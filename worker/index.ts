import { ApiError, describeError, json } from './http';
import { readBoundedJson } from './body';
import { validateBooking, type BookingInput } from './booking';
import { enforceRateLimit, purgeExpiredRateLimitCounters } from './rateLimit';
import { isTurnstileBypassed, verifyTurnstile } from './turnstile';
import {
  buildNotificationPayload,
  deliverPendingNotifications,
  enqueueNotificationStatement
} from './notifications';
import { handleAdminRequest } from './admin';
import {
  INQUIRY_POLICY_VERSION,
  PAYMENT_PARTNER_NAME,
  SITE_NAME
} from '../src/config/business';

/** How long a rate-limit counter is kept before the scheduled handler purges it. */
const RATE_LIMIT_RETENTION_SECONDS = 24 * 60 * 60;

function buildBookingStatements(
  env: Env,
  input: BookingInput,
  id: string,
  reference: string,
  now: string
): D1PreparedStatement[] {
  const statements = [
    env.DB.prepare(`
      INSERT INTO bookings (
        id, reference, status, tour_id, tour_title, customer_name,
        customer_email, customer_phone, customer_country, preferred_date,
        travelers, requirements, departure_date, adults, children, child_ages,
        accommodation_preference, contact_preference, budget_range, referral_source,
        inquiry_source, inquiry_policy_version, inquiry_policy_accepted_at, payment_recipient,
        idempotency_key, request_fingerprint, created_at, updated_at
      ) VALUES (?, ?, 'new', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      reference,
      input.tourId,
      input.tourTitle,
      input.name,
      input.email,
      input.phone,
      input.country ?? null,
      input.preferredDate,
      input.travelers,
      input.requirements ?? null,
      input.departureDate ?? null,
      input.adults,
      input.children,
      input.childAges ?? null,
      input.accommodationPreference ?? null,
      input.contactPreference ?? null,
      input.budgetRange ?? null,
      input.referralSource ?? null,
      input.source,
      INQUIRY_POLICY_VERSION,
      now,
      PAYMENT_PARTNER_NAME,
      input.idempotencyKey ?? null,
      input.requestFingerprint,
      now,
      now
    ),
    env.DB.prepare(`
      INSERT INTO booking_status_history (booking_id, status, note, actor, created_at)
      VALUES (?, 'new', 'Inquiry received.', 'customer', ?)
    `).bind(id, now),
    // The outbox row joins the same batch, so a stored inquiry can never exist
    // without a matching notification obligation.
    enqueueNotificationStatement(
      env,
      buildNotificationPayload({
        bookingId: id,
        reference,
        tourTitle: input.tourTitle,
        travelers: input.travelers,
        preferredDate: input.preferredDate,
        createdAt: now
      }),
      now
    )
  ];

  for (const [index, stop] of input.itineraryStops.entries()) {
    statements.push(
      env.DB.prepare(`
        INSERT INTO booking_itinerary_items (
          booking_id, position, stop_id, stop_title, stop_location, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).bind(id, index + 1, stop.id, stop.title, stop.location, now)
    );
  }

  return statements;
}

function isUniqueConstraintError(error: unknown): boolean {
  return describeError(error).toLowerCase().includes('unique');
}

type ExistingBooking = {
  id: string;
  reference: string;
  status: string;
  inquiry_source: string | null;
  request_fingerprint: string | null;
};

async function findByIdempotencyKey(env: Env, key: string): Promise<ExistingBooking | null> {
  return env.DB.prepare(
    'SELECT id, reference, status, inquiry_source, request_fingerprint FROM bookings WHERE idempotency_key = ?'
  )
    .bind(key)
    .first<ExistingBooking>();
}

async function fingerprintBooking(input: Omit<BookingInput, 'requestFingerprint'>): Promise<string> {
  // Explicit keys make the digest stable and deliberately exclude the
  // short-lived Turnstile token. Canonical tour/stop data has already been
  // resolved server-side by validateBooking.
  const normalized = JSON.stringify({
    source: input.source,
    tourId: input.tourId,
    tourTitle: input.tourTitle,
    name: input.name,
    email: input.email,
    phone: input.phone,
    country: input.country ?? null,
    preferredDate: input.preferredDate,
    departureDate: input.departureDate ?? null,
    travelers: input.travelers,
    adults: input.adults,
    children: input.children,
    childAges: input.childAges ?? null,
    accommodationPreference: input.accommodationPreference ?? null,
    contactPreference: input.contactPreference ?? null,
    budgetRange: input.budgetRange ?? null,
    referralSource: input.referralSource ?? null,
    requirements: input.requirements ?? null,
    itineraryStops: input.itineraryStops,
    partnerPaymentAcknowledged: input.partnerPaymentAcknowledged
  });
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized));
  return [...new Uint8Array(digest)]
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

function assertMatchingReplay(existing: ExistingBooking, fingerprint: string): void {
  if (existing.request_fingerprint !== fingerprint) {
    throw new ApiError(
      409,
      'idempotency_conflict',
      'This submission identifier was already used for different inquiry details. Please start a new request.'
    );
  }
}

function bookingResponse(
  booking: { reference: string; status: string; source: string; stopCount: number },
  status: number,
  replay = false
): Response {
  return json(
    {
      booking,
      replay,
      message: `Your request was received. It is not a confirmed reservation — ${SITE_NAME} or ${PAYMENT_PARTNER_NAME} will follow up with a personalized written quotation and policy PDF before any payment is due.`,
      payment: {
        recipient: PAYMENT_PARTNER_NAME,
        methods: ['visa', 'mastercard', 'apple_pay', 'wire_transfer'],
        instructions:
          'The travel partner will send a secure checkout link or official wire-transfer instructions privately after your quotation is accepted. Travision Tours does not collect payment.'
      }
    },
    { status }
  );
}

async function createBooking(request: Request, env: Env): Promise<Response> {
  const validated = validateBooking(await readBoundedJson(request));
  const requestFingerprint = await fingerprintBooking(validated);
  const input: BookingInput = { ...validated, requestFingerprint };

  const replayed = (existing: ExistingBooking) =>
    bookingResponse(
      {
        reference: existing.reference,
        status: existing.status,
        source: existing.inquiry_source ?? 'tour',
        stopCount: input.itineraryStops.length
      },
      200,
      true
    );

  // A replayed submission returns the original reference instead of inserting
  // a duplicate — this is what makes double-clicks and browser retries safe.
  if (input.idempotencyKey) {
    const existing = await findByIdempotencyKey(env, input.idempotencyKey);
    if (existing) {
      assertMatchingReplay(existing, requestFingerprint);
      return replayed(existing);
    }
  }


  // Only new submissions consume an abuse-protection attempt. A response-lost
  // retry is returned above without trying to redeem its single-use token again.
  await enforceRateLimit(env, request);
  await verifyTurnstile(
    input.turnstileToken,
    request.headers.get('CF-Connecting-IP') ?? undefined,
    env,
    input.idempotencyKey
  );

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const reference = `TV-${now.slice(0, 10).replaceAll('-', '')}-${id.slice(0, 8).toUpperCase()}`;

  try {
    await env.DB.batch(buildBookingStatements(env, input, id, reference, now));
  } catch (error) {
    // Two identical requests can race past the lookup above. The unique index
    // rejects the loser; return the winner's reference rather than an error.
    if (input.idempotencyKey && isUniqueConstraintError(error)) {
      const existing = await findByIdempotencyKey(env, input.idempotencyKey);
      if (existing) {
        assertMatchingReplay(existing, requestFingerprint);
        return replayed(existing);
      }
    }
    throw error;
  }

  console.log(
    JSON.stringify({
      message: 'booking_created',
      bookingId: id,
      reference,
      source: input.source,
      stopCount: input.itineraryStops.length
    })
  );

  // Best-effort delivery. A provider failure is recorded in the outbox and
  // retried by the scheduled handler, so it never loses the inquiry.
  try {
    await deliverPendingNotifications(env, 5);
  } catch (error) {
    console.error(
      JSON.stringify({ message: 'notification_delivery_deferred', error: describeError(error) })
    );
  }

  return bookingResponse(
    {
      reference,
      status: 'new',
      source: input.source,
      stopCount: input.itineraryStops.length
    },
    201
  );
}

async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname === '/api/health' && request.method === 'GET') {
    return json({
      status: 'ok',
      environment: env.ENVIRONMENT,
      turnstileBypassed: isTurnstileBypassed(env)
    });
  }

  if (url.pathname === '/api/bookings' && request.method === 'POST') {
    return createBooking(request, env);
  }

  if (url.pathname.startsWith('/api/admin/')) {
    return handleAdminRequest(request, env, url);
  }

  if (url.pathname.startsWith('/api/')) {
    return json({ error: { code: 'not_found', message: 'API route not found.' } }, { status: 404 });
  }

  return env.ASSETS.fetch(request);
}

export default {
  async fetch(request, env): Promise<Response> {
    try {
      return await handleRequest(request, env);
    } catch (error) {
      if (error instanceof ApiError) {
        return json(
          { error: { code: error.code, message: error.message } },
          { status: error.status, headers: error.headers }
        );
      }

      console.error(
        JSON.stringify({
          message: 'unhandled_request_error',
          path: new URL(request.url).pathname,
          error: describeError(error)
        })
      );
      return json(
        { error: { code: 'internal_error', message: 'The request could not be processed.' } },
        { status: 500 }
      );
    }
  },

  async scheduled(_controller, env, ctx): Promise<void> {
    ctx.waitUntil(
      (async () => {
        try {
          await purgeExpiredRateLimitCounters(env, RATE_LIMIT_RETENTION_SECONDS);
          await deliverPendingNotifications(env, 25);
        } catch (error) {
          console.error(
            JSON.stringify({ message: 'scheduled_task_failed', error: describeError(error) })
          );
        }
      })()
    );
  }
} satisfies ExportedHandler<Env>;

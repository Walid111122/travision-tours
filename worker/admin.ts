import { ApiError, json } from './http';
import { isAccessBypassed, requireAccessIdentity, type AccessEnv } from './access';
import { deliverPendingNotifications, type NotificationEnv } from './notifications';
import { boundedInteger, optionalString } from './validation';
import { readBoundedJson, MAX_ADMIN_BODY_BYTES } from './body';
import { enforceSameOriginMutation } from './requestGuard';
import { enforceScopedRateLimit } from './rateLimit';
import { auditStatement } from './audit';
import { handleCmsRequest } from './cms';
import { handleQuotationRequest } from './quotations';
import { handleMediaRequest, type MediaEnv } from './media';
import { INQUIRY_POLICY_VERSION, PAYMENT_PARTNER_NAME, SITE_NAME } from '../src/config/business';

export type AdminEnv = AccessEnv & NotificationEnv & MediaEnv & {
  ADMIN_RATE_LIMIT_WINDOW_SECONDS?: string;
  ADMIN_RATE_LIMIT_MAX_REQUESTS?: string;
};

const ADMIN_RATE_WINDOW = 60;
const ADMIN_RATE_MAX = 120;

const BOOKING_STATUSES = [
  'new',
  'quoted',
  'awaiting_transfer',
  'payment_verification',
  'confirmed',
  'cancelled'
] as const;

type BookingStatus = (typeof BOOKING_STATUSES)[number];

/**
 * The documented inquiry flow. Cancellation is available from any non-terminal
 * state; a cancelled inquiry is terminal.
 */
const ALLOWED_TRANSITIONS: Record<BookingStatus, readonly BookingStatus[]> = {
  new: ['quoted', 'cancelled'],
  quoted: ['awaiting_transfer', 'cancelled'],
  awaiting_transfer: ['payment_verification', 'cancelled'],
  payment_verification: ['confirmed', 'awaiting_transfer', 'cancelled'],
  confirmed: ['cancelled'],
  cancelled: []
};

const MAX_PAGE_SIZE = 200;
const DEFAULT_PAGE_SIZE = 50;

function isBookingStatus(value: unknown): value is BookingStatus {
  return typeof value === 'string' && (BOOKING_STATUSES as readonly string[]).includes(value);
}

type BookingRow = {
  id: string;
  reference: string;
  status: BookingStatus;
  tour_id: string;
  tour_title: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_country: string | null;
  preferred_date: string;
  departure_date: string | null;
  travelers: number;
  adults: number;
  children: number;
  child_ages: string | null;
  requirements: string | null;
  accommodation_preference: string | null;
  contact_preference: string | null;
  budget_range: string | null;
  referral_source: string | null;
  inquiry_source: string | null;
  inquiry_policy_version: string | null;
  payment_recipient: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
};

async function listBookings(
  env: AdminEnv,
  url: URL
): Promise<Response> {
  const reference = optionalString(url.searchParams.get('reference'), 'Reference', 40);
  const statusParam = url.searchParams.get('status');
  const status = statusParam ? (isBookingStatus(statusParam) ? statusParam : null) : null;

  if (statusParam && !status) {
    throw new ApiError(422, 'validation_error', 'Unknown booking status filter.');
  }

  const limit = boundedInteger(
    Number(url.searchParams.get('limit') ?? DEFAULT_PAGE_SIZE),
    'Limit',
    1,
    MAX_PAGE_SIZE
  );

  const conditions: string[] = [];
  const bindings: unknown[] = [];
  if (reference) {
    conditions.push('reference = ?');
    bindings.push(reference);
  }
  if (status) {
    conditions.push('status = ?');
    bindings.push(status);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { results } = await env.DB.prepare(`
    SELECT id, reference, status, tour_id, tour_title, customer_name, customer_email,
           preferred_date, travelers, inquiry_source, assigned_to, created_at, updated_at
    FROM bookings
    ${where}
    ORDER BY created_at DESC
    LIMIT ?
  `)
    .bind(...bindings, limit)
    .all();

  return json({ bookings: results ?? [] });
}

async function getBookingDetail(env: AdminEnv, bookingId: string): Promise<Response> {
  const booking = await env.DB.prepare('SELECT * FROM bookings WHERE id = ?')
    .bind(bookingId)
    .first<BookingRow>();

  if (!booking) {
    throw new ApiError(404, 'not_found', 'No booking matches that identifier.');
  }

  const [history, itinerary, notifications, notes, quotations] = await env.DB.batch([
    env.DB.prepare(
      'SELECT status, note, actor, created_at FROM booking_status_history WHERE booking_id = ? ORDER BY id ASC'
    ).bind(bookingId),
    env.DB.prepare(
      'SELECT position, stop_id, stop_title, stop_location FROM booking_itinerary_items WHERE booking_id = ? ORDER BY position ASC'
    ).bind(bookingId),
    env.DB.prepare(
      'SELECT id, channel, status, attempts, last_error, created_at, updated_at, sent_at FROM notification_outbox WHERE booking_id = ? ORDER BY id ASC'
    ).bind(bookingId),
    env.DB.prepare(
      'SELECT id, note, actor, created_at FROM inquiry_notes WHERE booking_id = ? ORDER BY id ASC'
    ).bind(bookingId),
    env.DB.prepare(
      'SELECT id, reference, status, version_no, updated_at FROM quotations WHERE booking_id = ? ORDER BY updated_at DESC'
    ).bind(bookingId)
  ]);

  return json({
    booking,
    history: history.results ?? [],
    itinerary: itinerary.results ?? [],
    notifications: notifications.results ?? [],
    notes: notes.results ?? [],
    quotations: quotations.results ?? []
  });
}

async function changeBookingStatus(
  env: AdminEnv,
  bookingId: string,
  request: Request,
  actor: string
): Promise<Response> {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== 'object') {
    throw new ApiError(422, 'validation_error', 'A status change body is required.');
  }

  const nextStatus = body.status;
  if (!isBookingStatus(nextStatus)) {
    throw new ApiError(422, 'validation_error', 'Select a valid booking status.');
  }

  const note = optionalString(body.note, 'Note', 500);

  const current = await env.DB.prepare('SELECT status FROM bookings WHERE id = ?')
    .bind(bookingId)
    .first<{ status: BookingStatus }>();

  if (!current) {
    throw new ApiError(404, 'not_found', 'No booking matches that identifier.');
  }

  if (!ALLOWED_TRANSITIONS[current.status].includes(nextStatus)) {
    throw new ApiError(
      422,
      'invalid_transition',
      `A booking in "${current.status}" cannot move to "${nextStatus}".`
    );
  }

  const now = new Date().toISOString();

  await env.DB.batch([
    env.DB.prepare('UPDATE bookings SET status = ?, updated_at = ? WHERE id = ?').bind(
      nextStatus,
      now,
      bookingId
    ),
    env.DB.prepare(`
      INSERT INTO booking_status_history (booking_id, status, note, actor, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(bookingId, nextStatus, note ?? null, actor, now)
  ]);

  console.log(
    JSON.stringify({
      message: 'booking_status_changed',
      bookingId,
      from: current.status,
      to: nextStatus,
      actor
    })
  );

  return json({ booking: { id: bookingId, status: nextStatus, updatedAt: now } });
}

async function listNotifications(env: AdminEnv, url: URL): Promise<Response> {
  const statusParam = url.searchParams.get('status');
  if (statusParam && !['pending', 'sent', 'failed'].includes(statusParam)) {
    throw new ApiError(422, 'validation_error', 'Unknown notification status filter.');
  }

  const limit = boundedInteger(
    Number(url.searchParams.get('limit') ?? DEFAULT_PAGE_SIZE),
    'Limit',
    1,
    MAX_PAGE_SIZE
  );

  const where = statusParam ? 'WHERE status = ?' : '';
  const bindings = statusParam ? [statusParam] : [];

  const { results } = await env.DB.prepare(`
    SELECT id, booking_id, channel, status, attempts, last_error, created_at, updated_at, sent_at
    FROM notification_outbox
    ${where}
    ORDER BY id DESC
    LIMIT ?
  `)
    .bind(...bindings, limit)
    .all();

  return json({ notifications: results ?? [] });
}

// ---------------------------------------------------------------------------
// Inquiry support: internal notes, assignment, single-inquiry export
// ---------------------------------------------------------------------------

async function addInquiryNote(
  env: AdminEnv,
  bookingId: string,
  request: Request,
  actor: string
): Promise<Response> {
  const body = (await readBoundedJson(request, MAX_ADMIN_BODY_BYTES)) as Record<string, unknown> | null;
  const note = optionalString(body?.note, 'Note', 2000);
  if (!note) throw new ApiError(422, 'validation_error', 'A note is required.');

  const exists = await env.DB.prepare('SELECT id FROM bookings WHERE id = ?').bind(bookingId).first();
  if (!exists) throw new ApiError(404, 'not_found', 'No booking matches that identifier.');

  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare('INSERT INTO inquiry_notes (booking_id, note, actor, created_at) VALUES (?, ?, ?, ?)')
      .bind(bookingId, note, actor, now),
    auditStatement(env, actor, 'inquiry.note', 'inquiry', bookingId, 'Internal note added.', now)
  ]);
  return json({ added: true }, { status: 201 });
}

async function assignInquiry(
  env: AdminEnv,
  bookingId: string,
  request: Request,
  actor: string
): Promise<Response> {
  const body = (await readBoundedJson(request, MAX_ADMIN_BODY_BYTES)) as Record<string, unknown> | null;
  const assignee = optionalString(body?.assignee, 'Assignee', 254) ?? null;
  if (assignee && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(assignee)) {
    throw new ApiError(422, 'validation_error', 'Assignee must be an email address.');
  }
  const now = new Date().toISOString();
  const result = await env.DB.prepare('UPDATE bookings SET assigned_to = ?, updated_at = ? WHERE id = ?')
    .bind(assignee, now, bookingId).run();
  if (!result.meta.changes) throw new ApiError(404, 'not_found', 'No booking matches that identifier.');
  await env.DB.batch([
    auditStatement(env, actor, 'inquiry.assign', 'inquiry', bookingId, `Assigned to ${assignee ?? '—'}.`, now)
  ]);
  return json({ booking: { id: bookingId, assigned_to: assignee } });
}

/** Safe single-inquiry export — no IP data, no tokens, no internal-only columns. */
async function exportInquiry(env: AdminEnv, bookingId: string, actor: string): Promise<Response> {
  const booking = await env.DB.prepare('SELECT * FROM bookings WHERE id = ?')
    .bind(bookingId).first<Record<string, unknown>>();
  if (!booking) throw new ApiError(404, 'not_found', 'No booking matches that identifier.');

  const { results: itinerary } = await env.DB.prepare(`
    SELECT position, stop_id, stop_title, stop_location
    FROM booking_itinerary_items WHERE booking_id = ? ORDER BY position
  `).bind(bookingId).all();

  const now = new Date().toISOString();
  await env.DB.batch([
    auditStatement(env, actor, 'inquiry.export', 'inquiry', bookingId, 'Single-inquiry export.', now)
  ]);

  const payload = {
    exported_at: now,
    exported_by: actor,
    system: `${SITE_NAME} admin`,
    inquiry: {
      reference: booking.reference,
      status: booking.status,
      tour_id: booking.tour_id,
      tour_title: booking.tour_title,
      customer_name: booking.customer_name,
      customer_email: booking.customer_email,
      customer_phone: booking.customer_phone,
      customer_country: booking.customer_country,
      preferred_date: booking.preferred_date,
      departure_date: booking.departure_date,
      travelers: booking.travelers,
      adults: booking.adults,
      children: booking.children,
      child_ages: booking.child_ages,
      requirements: booking.requirements,
      accommodation_preference: booking.accommodation_preference,
      contact_preference: booking.contact_preference,
      budget_range: booking.budget_range,
      inquiry_policy_version: booking.inquiry_policy_version,
      payment_recipient: booking.payment_recipient,
      assigned_to: booking.assigned_to,
      created_at: booking.created_at
    },
    itinerary: itinerary ?? []
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Disposition': `attachment; filename="inquiry-${booking.reference}.json"`
    }
  });
}

// ---------------------------------------------------------------------------
// Overview + audit + revisions listing
// ---------------------------------------------------------------------------

async function overview(env: AdminEnv): Promise<Response> {
  const q = async (sql: string, ...binds: unknown[]) =>
    (await env.DB.prepare(sql).bind(...binds).first<{ n: number }>())?.n ?? 0;

  const [
    toursPublished, toursDraft, toursArchived,
    postsPublished, postsDraft, postsScheduled,
    newInquiries,
    qDraft, qReady, qSent, qAccepted, qAwaiting, qConfirmed,
    recentAudit, mediaCount
  ] = await Promise.all([
    q(`SELECT COUNT(*) AS n FROM cms_tours WHERE status = 'published'`),
    q(`SELECT COUNT(*) AS n FROM cms_tours WHERE status = 'draft'`),
    q(`SELECT COUNT(*) AS n FROM cms_tours WHERE status = 'archived'`),
    q(`SELECT COUNT(*) AS n FROM cms_posts WHERE status = 'published'`),
    q(`SELECT COUNT(*) AS n FROM cms_posts WHERE status = 'draft'`),
    q(`SELECT COUNT(*) AS n FROM cms_posts WHERE status = 'scheduled'`),
    q(`SELECT COUNT(*) AS n FROM bookings WHERE status = 'new'`),
    q(`SELECT COUNT(*) AS n FROM quotations WHERE status = 'draft'`),
    q(`SELECT COUNT(*) AS n FROM quotations WHERE status = 'ready_for_review'`),
    q(`SELECT COUNT(*) AS n FROM quotations WHERE status = 'sent'`),
    q(`SELECT COUNT(*) AS n FROM quotations WHERE status = 'accepted'`),
    q(`SELECT COUNT(*) AS n FROM quotations WHERE status = 'awaiting_payment'`),
    q(`SELECT COUNT(*) AS n FROM quotations WHERE status = 'confirmed'`),
    env.DB.prepare(`
      SELECT actor, action, entity_type, entity_id, summary, created_at
      FROM admin_audit_log ORDER BY id DESC LIMIT 10
    `).all().then(r => r.results ?? []),
    q(`SELECT COUNT(*) AS n FROM media_assets WHERE status = 'active'`)
  ]);

  // Content with missing required fields (published rows that would fail
  // validation today are the operator's quality queue).
  const missing = await env.DB.prepare(`
    SELECT id FROM cms_tours
    WHERE status != 'archived' AND (
      title = '' OR cover_image = '' OR short_description = '' OR meta_description = ''
    )
    UNION ALL
    SELECT id FROM cms_posts
    WHERE status != 'archived' AND (title = '' OR excerpt = '' OR content = '')
  `).all();

  return json({
    counts: {
      toursPublished, toursDraft, toursArchived,
      postsPublished, postsDraft, postsScheduled,
      newInquiries,
      quotationsDraft: qDraft, quotationsReady: qReady, quotationsSent: qSent,
      quotationsAccepted: qAccepted, quotationsAwaitingPayment: qAwaiting,
      confirmedReservations: qConfirmed,
      contentMissingFields: (missing.results ?? []).length,
      activeMedia: mediaCount
    },
    recentActions: recentAudit,
    inquiryPolicyVersion: INQUIRY_POLICY_VERSION,
    paymentPartner: PAYMENT_PARTNER_NAME
  });
}

async function listAudit(env: AdminEnv, url: URL): Promise<Response> {
  const entityType = optionalString(url.searchParams.get('entity_type'), 'Entity type', 40);
  const entityId = optionalString(url.searchParams.get('entity_id'), 'Entity id', 160);
  const limit = boundedInteger(Number(url.searchParams.get('limit') ?? DEFAULT_PAGE_SIZE), 'Limit', 1, MAX_PAGE_SIZE);
  const offset = boundedInteger(Number(url.searchParams.get('offset') ?? 0), 'Offset', 0, 100000);

  const conditions: string[] = [];
  const bindings: unknown[] = [];
  if (entityType) { conditions.push('entity_type = ?'); bindings.push(entityType); }
  if (entityId) { conditions.push('entity_id = ?'); bindings.push(entityId); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const { results } = await env.DB.prepare(`
    SELECT actor, action, entity_type, entity_id, summary, created_at
    FROM admin_audit_log ${where} ORDER BY id DESC LIMIT ? OFFSET ?
  `).bind(...bindings, limit, offset).all();

  return json({ audit: results ?? [] });
}

async function listAllRevisions(env: AdminEnv, url: URL): Promise<Response> {
  const limit = boundedInteger(Number(url.searchParams.get('limit') ?? DEFAULT_PAGE_SIZE), 'Limit', 1, MAX_PAGE_SIZE);
  const { results } = await env.DB.prepare(`
    SELECT 'tour' AS entity_type, tour_id AS entity_id, revision_no, summary, actor, created_at
    FROM cms_tour_revisions
    UNION ALL
    SELECT 'post', post_id, revision_no, summary, actor, created_at FROM cms_post_revisions
    UNION ALL
    SELECT 'quotation', quotation_id, revision_no, summary, actor, created_at FROM quotation_revisions
    ORDER BY created_at DESC LIMIT ?
  `).bind(limit).all();
  return json({ revisions: results ?? [] });
}

async function retryNotification(env: AdminEnv, notificationId: number): Promise<Response> {
  const now = new Date().toISOString();
  const result = await env.DB.prepare(`
    UPDATE notification_outbox
    SET status = 'pending', next_attempt_at = ?, updated_at = ?
    WHERE id = ?
  `)
    .bind(now, now, notificationId)
    .run();

  if (!result.meta.changes) {
    throw new ApiError(404, 'not_found', 'No notification matches that identifier.');
  }

  const outcome = await deliverPendingNotifications(env, 25);
  return json({ retried: notificationId, ...outcome });
}

/**
 * Protected lead-review routes.
 *
 * Every route requires a verified Cloudflare Access identity. There is no
 * public listing endpoint, and the booking list is never reachable without it.
 */
export async function handleAdminRequest(
  request: Request,
  env: AdminEnv,
  url: URL
): Promise<Response> {
  const identity = await requireAccessIdentity(request, env);
  enforceSameOriginMutation(request);

  // Actor-scoped throttle on mutations — the public inquiry limit would be
  // far too tight for real editing sessions, but the authenticated surface
  // still deserves an abuse ceiling.
  if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method.toUpperCase())) {
    const window = Number(env.ADMIN_RATE_LIMIT_WINDOW_SECONDS ?? ADMIN_RATE_WINDOW);
    const max = Number(env.ADMIN_RATE_LIMIT_MAX_REQUESTS ?? ADMIN_RATE_MAX);
    await enforceScopedRateLimit(env, 'admin', identity.email, window, max);
  }

  const path = url.pathname.slice('/api/admin'.length) || '/';
  const method = request.method.toUpperCase();

  if (path === '/session' && method === 'GET') {
    return json({
      authorized: true,
      email: identity.email,
      devBypass: isAccessBypassed(env),
      environment: env.ENVIRONMENT ?? 'unknown'
    });
  }

  if (path === '/overview' && method === 'GET') {
    return overview(env);
  }

  if (path === '/bookings' && method === 'GET') {
    return listBookings(env, url);
  }

  const bookingMatch = path.match(/^\/bookings\/([^/]+)$/);
  if (bookingMatch && method === 'GET') {
    return getBookingDetail(env, decodeURIComponent(bookingMatch[1]));
  }

  const statusMatch = path.match(/^\/bookings\/([^/]+)\/status$/);
  if (statusMatch && method === 'POST') {
    return changeBookingStatus(env, decodeURIComponent(statusMatch[1]), request, identity.email);
  }

  const noteMatch = path.match(/^\/bookings\/([^/]+)\/notes$/);
  if (noteMatch && method === 'POST') {
    return addInquiryNote(env, decodeURIComponent(noteMatch[1]), request, identity.email);
  }

  const assignMatch = path.match(/^\/bookings\/([^/]+)\/assign$/);
  if (assignMatch && method === 'POST') {
    return assignInquiry(env, decodeURIComponent(assignMatch[1]), request, identity.email);
  }

  const exportMatch = path.match(/^\/bookings\/([^/]+)\/export$/);
  if (exportMatch && method === 'GET') {
    return exportInquiry(env, decodeURIComponent(exportMatch[1]), identity.email);
  }

  if (path === '/notifications' && method === 'GET') {
    return listNotifications(env, url);
  }

  const retryMatch = path.match(/^\/notifications\/(\d+)\/retry$/);
  if (retryMatch && method === 'POST') {
    return retryNotification(env, Number(retryMatch[1]));
  }

  if (path === '/audit' && method === 'GET') {
    return listAudit(env, url);
  }

  if (path === '/revisions' && method === 'GET') {
    return listAllRevisions(env, url);
  }

  const cms = await handleCmsRequest(request, env, path, identity.email);
  if (cms) return cms;

  const quotations = await handleQuotationRequest(request, env, path, identity.email);
  if (quotations) return quotations;

  const media = await handleMediaRequest(request, env, path, identity.email);
  if (media) return media;

  throw new ApiError(404, 'not_found', 'Admin route not found.');
}

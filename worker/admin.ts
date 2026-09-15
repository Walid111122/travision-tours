import { ApiError, json } from './http';
import { requireAccessIdentity, type AccessEnv } from './access';
import { deliverPendingNotifications, type NotificationEnv } from './notifications';
import { boundedInteger, optionalString } from './validation';

export type AdminEnv = AccessEnv & NotificationEnv;

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
           preferred_date, travelers, inquiry_source, created_at, updated_at
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

  const [history, itinerary, notifications] = await env.DB.batch([
    env.DB.prepare(
      'SELECT status, note, actor, created_at FROM booking_status_history WHERE booking_id = ? ORDER BY id ASC'
    ).bind(bookingId),
    env.DB.prepare(
      'SELECT position, stop_id, stop_title, stop_location FROM booking_itinerary_items WHERE booking_id = ? ORDER BY position ASC'
    ).bind(bookingId),
    env.DB.prepare(
      'SELECT id, channel, status, attempts, last_error, created_at, updated_at, sent_at FROM notification_outbox WHERE booking_id = ? ORDER BY id ASC'
    ).bind(bookingId)
  ]);

  return json({
    booking,
    history: history.results ?? [],
    itinerary: itinerary.results ?? [],
    notifications: notifications.results ?? []
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
  const path = url.pathname.slice('/api/admin'.length) || '/';
  const method = request.method.toUpperCase();

  if (path === '/session' && method === 'GET') {
    return json({ authorized: true, email: identity.email });
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

  if (path === '/notifications' && method === 'GET') {
    return listNotifications(env, url);
  }

  const retryMatch = path.match(/^\/notifications\/(\d+)\/retry$/);
  if (retryMatch && method === 'POST') {
    return retryNotification(env, Number(retryMatch[1]));
  }

  throw new ApiError(404, 'not_found', 'Admin route not found.');
}

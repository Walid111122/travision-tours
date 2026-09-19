import { ApiError, json } from './http';
import { readBoundedJson, MAX_ADMIN_BODY_BYTES } from './body';
import { boundedInteger, optionalString, requiredString } from './validation';
import { auditStatement } from './audit';
import { renderQuotationDocument } from './quotationDocument';
import { PAYMENT_PARTNER_NAME } from '../src/config/business';
import {
  QUOTATION_TRANSITIONS,
  QUOTATION_STATUSES,
  IMMUTABLE_AFTER_SENT,
  QUOTATION_FIELDS,
  emptyQuotationData,
  unresolvedQuotationFields,
  type QuotationData,
  type QuotationStatus
} from '../src/config/quotation';

/**
 * Quotation & reservation-policy workflow.
 *
 * Rules encoded here (owner decision):
 *  - a quotation is never auto-advanced — every status change is an explicit
 *    administrator action recorded in quotation_status_history + audit log;
 *  - `draft → ready_for_review` requires every required field to be filled
 *    with a real value (no placeholders);
 *  - `ready_for_review → approved → sent` is the only path to the customer;
 *  - once a version is sent it is immutable — edits go through /revise, which
 *    increments version_no and restarts the approval cycle;
 *  - `confirmed` is reachable only from `paid`, and `paid` only from
 *    `awaiting_payment` — an inquiry can never jump to confirmed;
 *  - the payment recipient is always the payment partner.
 */

type AdminDb = { DB: D1Database };

const MAX_PAGE = 200;
const DEFAULT_PAGE = 50;

const DATA_KEYS = QUOTATION_FIELDS.map(f => f.key) as (keyof QuotationData)[];

type QuotationRow = {
  id: string;
  reference: string;
  booking_id: string | null;
  status: QuotationStatus;
  version_no: number;
  revision: number;
  sent_version_no: number | null;
  data: string;
  internal_notes: string;
  policy_version: string;
  sent_at: string | null;
  sent_by: string | null;
  accepted_at: string | null;
  acceptance_method: string | null;
  acceptance_evidence: string | null;
  payment_received_at: string | null;
  confirmed_at: string | null;
  confirmed_by: string | null;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isQuotationStatus(value: unknown): value is QuotationStatus {
  return typeof value === 'string' && (QUOTATION_STATUSES as readonly string[]).includes(value);
}

function parseData(raw: string, currencyFallback: string): QuotationData {
  const base = emptyQuotationData(currencyFallback);
  try {
    const parsed = JSON.parse(raw) as Partial<QuotationData>;
    for (const key of DATA_KEYS) {
      const value = parsed[key];
      if (typeof value === 'string') base[key] = value;
    }
  } catch {
    /* a malformed blob falls back to the empty shape; the row still loads */
  }
  return base;
}

function sanitizeDataInput(input: unknown): Partial<QuotationData> {
  if (!isRecord(input)) {
    throw new ApiError(422, 'validation_error', 'Quotation data must be an object.');
  }
  const clean: Partial<QuotationData> = {};
  for (const [key, value] of Object.entries(input)) {
    if (!(DATA_KEYS as string[]).includes(key)) {
      throw new ApiError(422, 'validation_error', `Unknown quotation field: ${key}`);
    }
    if (value === null || value === undefined) {
      clean[key as keyof QuotationData] = '';
      continue;
    }
    if (typeof value !== 'string') {
      throw new ApiError(422, 'validation_error', `${key} must be text.`);
    }
    if (value.length > 20000) {
      throw new ApiError(422, 'validation_error', `${key} is too long.`);
    }
    // Strip control characters — the document renderer escapes markup, but
    // raw control bytes would still corrupt a printed PDF.
    clean[key as keyof QuotationData] = [...value].filter(ch => { const code = ch.charCodeAt(0); return code === 9 || code === 10 || code === 13 || (code >= 32 && code !== 127); }).join('');
  }
  return clean;
}

function summaryColumns(row: QuotationRow) {
  return {
    id: row.id,
    reference: row.reference,
    booking_id: row.booking_id,
    status: row.status,
    version_no: row.version_no,
    revision: row.revision,
    sent_version_no: row.sent_version_no,
    customer_name: parseData(row.data, 'USD').customerName,
    total_price: parseData(row.data, 'USD').totalPrice,
    sent_at: row.sent_at,
    updated_by: row.updated_by,
    updated_at: row.updated_at,
    created_at: row.created_at
  };
}

async function insertQuotationRevision(
  env: AdminDb,
  row: QuotationRow,
  actor: string,
  summary: string,
  now: string
): Promise<D1PreparedStatement> {
  return env.DB.prepare(`
    INSERT INTO quotation_revisions (quotation_id, revision_no, version_no, status, snapshot, summary, actor, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    row.id,
    row.revision,
    row.version_no,
    row.status,
    JSON.stringify({ data: row.data, internal_notes: row.internal_notes, policy_version: row.policy_version }),
    summary,
    actor,
    now
  );
}

async function getRow(env: AdminDb, id: string): Promise<QuotationRow> {
  const row = await env.DB.prepare('SELECT * FROM quotations WHERE id = ?').bind(id).first<QuotationRow>();
  if (!row) throw new ApiError(404, 'not_found', 'No quotation matches that identifier.');
  return row;
}

// ---------------------------------------------------------------------------
// List / detail
// ---------------------------------------------------------------------------

async function listQuotations(env: AdminDb, url: URL): Promise<Response> {
  const statusParam = optionalString(url.searchParams.get('status'), 'Status', 30);
  if (statusParam && !isQuotationStatus(statusParam)) {
    throw new ApiError(422, 'validation_error', 'Unknown quotation status filter.');
  }
  const q = optionalString(url.searchParams.get('q'), 'Search', 120);
  const limit = boundedInteger(Number(url.searchParams.get('limit') ?? DEFAULT_PAGE), 'Limit', 1, MAX_PAGE);
  const offset = boundedInteger(Number(url.searchParams.get('offset') ?? 0), 'Offset', 0, 100000);

  const conditions: string[] = [];
  const bindings: unknown[] = [];
  if (statusParam) { conditions.push('status = ?'); bindings.push(statusParam); }
  if (q) {
    conditions.push('(reference LIKE ? OR id LIKE ?)');
    const like = `%${q.replace(/[%_]/g, '')}%`;
    bindings.push(like, like);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const count = await env.DB.prepare(`SELECT COUNT(*) AS n FROM quotations ${where}`)
    .bind(...bindings).first<{ n: number }>();
  const { results } = await env.DB.prepare(`
    SELECT * FROM quotations ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?
  `).bind(...bindings, limit, offset).all<QuotationRow>();

  return json({ quotations: (results ?? []).map(summaryColumns), total: count?.n ?? 0 });
}

async function getQuotation(env: AdminDb, id: string): Promise<Response> {
  const row = await getRow(env, id);
  const { results: history } = await env.DB.prepare(`
    SELECT from_status, to_status, actor, note, created_at
    FROM quotation_status_history WHERE quotation_id = ? ORDER BY id ASC
  `).bind(id).all();

  return json({
    quotation: {
      ...row,
      data: parseData(row.data, 'USD'),
      unresolved: unresolvedQuotationFields(parseData(row.data, 'USD'))
    },
    history: history ?? []
  });
}

async function listQuotationRevisions(env: AdminDb, id: string): Promise<Response> {
  const { results } = await env.DB.prepare(`
    SELECT revision_no, version_no, status, summary, actor, created_at
    FROM quotation_revisions WHERE quotation_id = ? ORDER BY revision_no DESC
  `).bind(id).all();
  return json({ revisions: results ?? [] });
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export function prefillFromBooking(booking: Record<string, unknown>, currency: string): QuotationData {
  const data = emptyQuotationData(currency);
  data.customerName = String(booking.customer_name ?? '');
  data.customerEmail = String(booking.customer_email ?? '');
  data.customerPhone = String(booking.customer_phone ?? '');
  data.inquiryReference = String(booking.reference ?? '');
  data.travelDates = String(booking.preferred_date ?? '');
  data.adults = String(booking.adults ?? '');
  data.childrenAges =
    booking.children && Number(booking.children) > 0
      ? `${booking.children} child(ren), ages: ${booking.child_ages ?? 'to be provided'}`
      : 'None';
  const tourTitle = booking.tour_title ? `Tour: ${booking.tour_title}\n` : '';
  data.itinerary = tourTitle;
  data.specialRequests = String(booking.requirements ?? '') || 'None recorded';
  if (booking.accommodation_preference) {
    data.hotelSelection = `Preference: ${booking.accommodation_preference} — confirm actual property`;
  }
  return data;
}

async function createQuotation(
  env: AdminDb,
  request: Request,
  actor: string
): Promise<Response> {
  const body = (await readBoundedJson(request, MAX_ADMIN_BODY_BYTES)) as Record<string, unknown> | null;
  if (!isRecord(body)) throw new ApiError(422, 'validation_error', 'A JSON object body is required.');

  const currency = optionalString(body.currency, 'Currency', 3) ?? 'USD';
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new ApiError(422, 'validation_error', 'Currency must be a 3-letter ISO code.');
  }

  let bookingId: string | null = null;
  let data = emptyQuotationData(currency);
  if (body.bookingId) {
    bookingId = requiredString(body.bookingId, 'Inquiry', 80);
    const booking = await env.DB.prepare('SELECT * FROM bookings WHERE id = ?')
      .bind(bookingId).first<Record<string, unknown>>();
    if (!booking) throw new ApiError(404, 'not_found', 'No inquiry matches that identifier.');
    data = prefillFromBooking(booking, currency);
    data.currency = currency;
  }
  if (body.data !== undefined) {
    data = { ...data, ...sanitizeDataInput(body.data) };
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const reference = `TQ-${now.slice(0, 10).replaceAll('-', '')}-${id.slice(0, 8).toUpperCase()}`;

  const row: QuotationRow = {
    id, reference, booking_id: bookingId, status: 'draft', version_no: 1, revision: 1,
    sent_version_no: null, data: JSON.stringify(data), internal_notes: '',
    policy_version: '', sent_at: null, sent_by: null, accepted_at: null,
    acceptance_method: null, acceptance_evidence: null, payment_received_at: null,
    confirmed_at: null, confirmed_by: null, created_by: actor, updated_by: actor,
    created_at: now, updated_at: now
  };

  await env.DB.batch([
    env.DB.prepare(`
      INSERT INTO quotations (id, reference, booking_id, status, version_no, revision, data,
        internal_notes, policy_version, created_by, updated_by, created_at, updated_at)
      VALUES (?, ?, ?, 'draft', 1, 1, ?, '', '', ?, ?, ?, ?)
    `).bind(id, reference, bookingId, row.data, actor, actor, now, now),
    await insertQuotationRevision(env, row, actor, 'Quotation created', now),
    env.DB.prepare(`
      INSERT INTO quotation_status_history (quotation_id, from_status, to_status, actor, note, created_at)
      VALUES (?, '', 'draft', ?, 'Quotation created', ?)
    `).bind(id, actor, now),
    auditStatement(env, actor, 'quotation.create', 'quotation', id,
      `Draft ${reference}${bookingId ? ` from inquiry ${bookingId}` : ''}.`, now)
  ]);

  return json({ quotation: { id, reference, status: 'draft', version_no: 1, revision: 1 } }, { status: 201 });
}

// ---------------------------------------------------------------------------
// Update (content edits — only while the version is still editable)
// ---------------------------------------------------------------------------

async function updateQuotation(
  env: AdminDb,
  id: string,
  request: Request,
  actor: string
): Promise<Response> {
  const row = await getRow(env, id);
  if (IMMUTABLE_AFTER_SENT.includes(row.status)) {
    throw new ApiError(
      409,
      'version_locked',
      `This quotation version was already sent (${row.status}). Use "new version" to revise it — the sent document cannot be mutated.`
    );
  }

  const body = (await readBoundedJson(request, MAX_ADMIN_BODY_BYTES)) as Record<string, unknown> | null;
  if (!isRecord(body)) throw new ApiError(422, 'validation_error', 'A JSON object body is required.');
  const expected = boundedInteger(body.expectedRevision, 'Expected revision', 1, 1000000);
  const summary = optionalString(body.summary, 'Change summary', 300) ?? 'Content update';
  const internalNotes = optionalString(body.internalNotes, 'Internal notes', 20000);
  const policyVersion = optionalString(body.policyVersion, 'Policy version', 60);

  const merged = { ...parseData(row.data, 'USD') };
  if (body.data !== undefined) Object.assign(merged, sanitizeDataInput(body.data));

  const now = new Date().toISOString();
  const result = await env.DB.prepare(`
    UPDATE quotations SET data = ?, internal_notes = ?, policy_version = ?,
      revision = revision + 1, updated_by = ?, updated_at = ?
    WHERE id = ? AND revision = ?
  `).bind(
    JSON.stringify(merged),
    internalNotes ?? row.internal_notes,
    policyVersion ?? row.policy_version,
    actor, now, id, expected
  ).run();

  if (!result.meta.changes) {
    throw new ApiError(409, 'revision_conflict', 'This quotation was changed by someone else. Reload and retry.');
  }

  const updated = await getRow(env, id);
  await env.DB.batch([
    await insertQuotationRevision(env, updated, actor, summary, now),
    auditStatement(env, actor, 'quotation.update', 'quotation', id, summary, now)
  ]);
  return json({
    quotation: { id, revision: expected + 1, unresolved: unresolvedQuotationFields(merged) }
  });
}

// ---------------------------------------------------------------------------
// Status transitions
// ---------------------------------------------------------------------------

async function transitionQuotation(
  env: AdminDb,
  id: string,
  request: Request,
  actor: string
): Promise<Response> {
  const body = (await readBoundedJson(request, MAX_ADMIN_BODY_BYTES)) as Record<string, unknown> | null;
  if (!isRecord(body)) throw new ApiError(422, 'validation_error', 'A JSON object body is required.');
  const next = requiredString(body.status, 'Status', 30) as QuotationStatus;
  if (!isQuotationStatus(next)) {
    throw new ApiError(422, 'validation_error', 'Unknown quotation status.');
  }
  const note = optionalString(body.note, 'Note', 500) ?? '';

  const row = await getRow(env, id);
  if (!QUOTATION_TRANSITIONS[row.status].includes(next)) {
    throw new ApiError(
      422,
      'invalid_transition',
      `A quotation in "${row.status}" cannot move to "${next}".`
    );
  }

  const data = parseData(row.data, 'USD');
  const now = new Date().toISOString();
  const sets: string[] = ['status = ?', 'updated_by = ?', 'updated_at = ?'];
  const binds: (string | null)[] = [next, actor, now];

  if (next === 'ready_for_review') {
    const unresolved = unresolvedQuotationFields(data);
    if (unresolved.length) {
      throw new ApiError(
        422,
        'placeholders_unresolved',
        `Resolve these fields before review: ${unresolved.join(', ')}.`
      );
    }
    if (data.paymentRecipient !== PAYMENT_PARTNER_NAME) {
      throw new ApiError(
        422,
        'payment_recipient_invalid',
        `Payment recipient must be ${PAYMENT_PARTNER_NAME}.`
      );
    }
    if (!/^[A-Z]{3}$/.test(data.currency)) {
      throw new ApiError(422, 'validation_error', 'Currency must be a 3-letter ISO code.');
    }
  }

  if (next === 'sent') {
    // Only the approved version may go out — record exactly which one did.
    sets.push('sent_at = ?', 'sent_by = ?', 'sent_version_no = version_no');
    binds.push(now, actor);
  }

  if (next === 'accepted') {
    const method = optionalString(body.acceptanceMethod, 'Acceptance method', 200);
    if (!method) {
      throw new ApiError(
        422,
        'acceptance_evidence_required',
        'Record how the customer accepted (e.g. "email reply dated …").'
      );
    }
    sets.push('accepted_at = ?', 'acceptance_method = ?', 'acceptance_evidence = ?');
    binds.push(now, method, optionalString(body.acceptanceEvidence, 'Acceptance evidence', 500) ?? '');
  }

  if (next === 'paid') {
    sets.push('payment_received_at = ?');
    binds.push(now);
  }

  if (next === 'confirmed') {
    sets.push('confirmed_at = ?', 'confirmed_by = ?');
    binds.push(now, actor);
  }

  const result = await env.DB.prepare(
    `UPDATE quotations SET ${sets.join(', ')} WHERE id = ? AND status = ?`
  ).bind(...binds, id, row.status).run();

  if (!result.meta.changes) {
    throw new ApiError(409, 'revision_conflict', 'The quotation changed underneath you. Reload and retry.');
  }

  await env.DB.batch([
    env.DB.prepare(`
      INSERT INTO quotation_status_history (quotation_id, from_status, to_status, actor, note, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(id, row.status, next, actor, note, now),
    auditStatement(env, actor, 'quotation.status', 'quotation', id, `${row.status} → ${next}`, now)
  ]);

  return json({ quotation: { id, status: next } });
}

// ---------------------------------------------------------------------------
// Revise — new version of a sent/locked quotation
// ---------------------------------------------------------------------------

async function reviseQuotation(env: AdminDb, id: string, actor: string): Promise<Response> {
  const row = await getRow(env, id);
  if (!IMMUTABLE_AFTER_SENT.includes(row.status)) {
    throw new ApiError(422, 'invalid_transition', 'Only a sent or later quotation needs a new version.');
  }
  if (['declined', 'expired', 'cancelled'].includes(row.status)) {
    throw new ApiError(422, 'invalid_transition', 'A terminal quotation cannot be revised — create a new one.');
  }

  const now = new Date().toISOString();
  const result = await env.DB.prepare(`
    UPDATE quotations SET status = 'draft', version_no = version_no + 1,
      revision = revision + 1, updated_by = ?, updated_at = ?
    WHERE id = ? AND status = ?
  `).bind(actor, now, id, row.status).run();

  if (!result.meta.changes) {
    throw new ApiError(409, 'revision_conflict', 'The quotation changed underneath you. Reload and retry.');
  }

  const updated = await getRow(env, id);
  await env.DB.batch([
    await insertQuotationRevision(env, updated, actor, `Reopened as version ${updated.version_no}`, now),
    env.DB.prepare(`
      INSERT INTO quotation_status_history (quotation_id, from_status, to_status, actor, note, created_at)
      VALUES (?, ?, 'draft', ?, ?, ?)
    `).bind(id, row.status, actor, `Revised → version ${updated.version_no}`, now),
    auditStatement(env, actor, 'quotation.revise', 'quotation', id,
      `Reopened as version ${updated.version_no}.`, now)
  ]);

  return json({ quotation: { id, status: 'draft', version_no: updated.version_no, revision: updated.revision } });
}

// ---------------------------------------------------------------------------
// Print-ready document
// ---------------------------------------------------------------------------

async function quotationDocument(env: AdminDb, id: string, url: URL): Promise<Response> {
  const row = await getRow(env, id);
  let data = parseData(row.data, 'USD');
  let versionNo = row.version_no;
  let status = row.status;
  let policyVersion = row.policy_version;

  // Once sent, the customer-facing truth is the sent snapshot — preview=1
  // renders the working copy for internal review instead.
  if (row.sent_version_no !== null && url.searchParams.get('preview') !== '1') {
    const sent = await env.DB.prepare(`
      SELECT snapshot, version_no, status FROM quotation_revisions
      WHERE quotation_id = ? AND version_no = ?
      ORDER BY revision_no DESC LIMIT 1
    `).bind(id, row.sent_version_no).first<{ snapshot: string; version_no: number; status: string }>();
    if (sent) {
      const snapshot = JSON.parse(sent.snapshot) as { data: string; policy_version: string };
      data = parseData(snapshot.data, 'USD');
      versionNo = sent.version_no;
      policyVersion = snapshot.policy_version;
      status = 'sent';
    }
  }

  const html = renderQuotationDocument({
    reference: row.reference,
    versionNo,
    status,
    policyVersion,
    data
  });

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
      'Content-Disposition': `inline; filename="${row.reference}-v${versionNo}.html"`
    }
  });
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export async function handleQuotationRequest(
  request: Request,
  env: AdminDb,
  path: string,
  actor: string
): Promise<Response | null> {
  const method = request.method.toUpperCase();
  const url = new URL(request.url);

  if (path === '/quotations' && method === 'GET') return listQuotations(env, url);
  if (path === '/quotations' && method === 'POST') return createQuotation(env, request, actor);

  const detail = path.match(/^\/quotations\/([^/]+)$/);
  if (detail && method === 'GET') return getQuotation(env, decodeURIComponent(detail[1]));
  if (detail && method === 'PUT') return updateQuotation(env, decodeURIComponent(detail[1]), request, actor);

  const status = path.match(/^\/quotations\/([^/]+)\/status$/);
  if (status && method === 'POST') return transitionQuotation(env, decodeURIComponent(status[1]), request, actor);

  const revise = path.match(/^\/quotations\/([^/]+)\/revise$/);
  if (revise && method === 'POST') return reviseQuotation(env, decodeURIComponent(revise[1]), actor);

  const revisions = path.match(/^\/quotations\/([^/]+)\/revisions$/);
  if (revisions && method === 'GET') return listQuotationRevisions(env, decodeURIComponent(revisions[1]));

  const document = path.match(/^\/quotations\/([^/]+)\/document$/);
  if (document && method === 'GET') return quotationDocument(env, decodeURIComponent(document[1]), url);

  return null;
}

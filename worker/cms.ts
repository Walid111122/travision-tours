import { ApiError, json } from './http';
import { readBoundedJson, MAX_ADMIN_BODY_BYTES } from './body';
import { boundedInteger, optionalString, requiredString } from './validation';
import { auditStatement } from './audit';
import {
  findUnsafeMarkup,
  validatePostRow,
  validateTourRow,
  SLUG_PATTERN,
  type CmsPostRow,
  type CmsTourRow,
  type FieldIssue
} from '../src/cms/model';

/**
 * Protected CMS endpoints for tours and blog posts.
 *
 * Invariants enforced here:
 *  - every mutation requires `expectedRevision` (optimistic concurrency);
 *  - every successful mutation appends a snapshot to *_revisions and a row to
 *    admin_audit_log inside the same batch;
 *  - nothing is ever deleted — status='archived' is the terminal state;
 *  - tour ids (the public slugs) are immutable once created; post slugs can
 *    only change while a redirect row is recorded;
 *  - 'published' means "approved for the next export", not "live" — the site
 *    still ships from the prerendered build.
 */

type AdminDb = { DB: D1Database };

const MAX_PAGE = 200;
const DEFAULT_PAGE = 50;

const TOUR_STATUSES = ['draft', 'published', 'archived'] as const;
const POST_STATUSES = ['draft', 'published', 'scheduled', 'archived'] as const;

type TourStatus = (typeof TOUR_STATUSES)[number];
type PostStatus = (typeof POST_STATUSES)[number];

/** Fields an editor may send. Anything else in the body is rejected. */
const TOUR_EDITABLE = [
  'title', 'collection', 'destination', 'category', 'duration',
  'availability_label', 'price', 'currency', 'short_description',
  'full_description', 'highlights', 'itinerary', 'inclusions', 'exclusions',
  'notes', 'pickup_info', 'meeting_point', 'accessibility', 'operating_days',
  'child_info', 'accommodation_info', 'cover_image', 'gallery',
  'related_tours', 'map_url', 'display_order', 'featured', 'seo_title',
  'meta_description', 'canonical_path', 'og_image', 'source_notes'
] as const;

const POST_EDITABLE = [
  'slug', 'title', 'excerpt', 'author', 'cover_image', 'content', 'tags',
  'seo_title', 'meta_description', 'og_image', 'scheduled_at', 'source_notes'
] as const;

const TOUR_JSON_FIELDS = ['highlights', 'itinerary', 'inclusions', 'exclusions', 'gallery', 'related_tours'];
const POST_JSON_FIELDS = ['tags'];
const TOUR_NUMERIC_FIELDS = ['price', 'display_order', 'featured'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function fail422(issues: FieldIssue[]): never {
  throw new ApiError(
    422,
    'validation_error',
    issues.map(issue => `${issue.field}: ${issue.message}`).join(' ')
  );
}

function cleanStringList(value: unknown, field: string): string {
  if (!Array.isArray(value) || !value.every(item => typeof item === 'string')) {
    throw new ApiError(422, 'validation_error', `${field} must be an array of strings.`);
  }
  return JSON.stringify(value);
}

/**
 * Merge the submitted field patch over the current row and normalize types.
 * Unknown fields are refused outright so nothing is silently discarded, and
 * array-valued fields are stored as canonical JSON.
 */
function buildTourPatch(
  body: Record<string, unknown>,
  current: Partial<CmsTourRow>
): Record<string, string | number | null> {
  const fields = isRecord(body.fields) ? body.fields : {};
  const patch: Record<string, string | number | null> = {};

  for (const [key, value] of Object.entries(fields)) {
    if (!(TOUR_EDITABLE as readonly string[]).includes(key)) {
      throw new ApiError(422, 'validation_error', `Unknown tour field: ${key}`);
    }
    if (TOUR_JSON_FIELDS.includes(key)) {
      patch[key] = key === 'itinerary'
        ? JSON.stringify(value ?? [])
        : cleanStringList(value ?? [], key);
    } else if (TOUR_NUMERIC_FIELDS.includes(key)) {
      if (value === null || value === '') {
        patch[key] = key === 'price' ? null : 0;
      } else if (typeof value === 'number' && Number.isFinite(value)) {
        patch[key] = key === 'featured' ? (value ? 1 : 0) : value;
      } else {
        throw new ApiError(422, 'validation_error', `${key} must be a number.`);
      }
    } else {
      const text = optionalString(value, key, 20000) ?? '';
      const unsafe = findUnsafeMarkup(text);
      if (unsafe) {
        throw new ApiError(422, 'validation_error', `${key} contains unsafe markup.`);
      }
      patch[key] = text;
    }
  }
  return { ...current, ...patch };
}

function buildPostPatch(
  body: Record<string, unknown>,
  current: Partial<CmsPostRow>
): Record<string, string | number | null> {
  const fields = isRecord(body.fields) ? body.fields : {};
  const patch: Record<string, string | number | null> = {};

  for (const [key, value] of Object.entries(fields)) {
    if (!(POST_EDITABLE as readonly string[]).includes(key)) {
      throw new ApiError(422, 'validation_error', `Unknown post field: ${key}`);
    }
    if (POST_JSON_FIELDS.includes(key)) {
      patch[key] = cleanStringList(value ?? [], key);
    } else if (key === 'scheduled_at') {
      patch[key] = optionalString(value, key, 40) ?? null;
    } else {
      const limit = key === 'content' ? 100000 : 20000;
      const text = optionalString(value, key, limit) ?? '';
      const unsafe = findUnsafeMarkup(text);
      if (unsafe) {
        throw new ApiError(422, 'validation_error', `${key} contains unsafe markup.`);
      }
      patch[key] = text;
    }
  }
  return { ...current, ...patch };
}

function rowSnapshot(row: Record<string, unknown>): string {
  const ordered: Record<string, unknown> = {};
  for (const key of Object.keys(row).sort()) ordered[key] = row[key];
  return JSON.stringify(ordered);
}

// ---------------------------------------------------------------------------
// Tours
// ---------------------------------------------------------------------------

async function listTours(env: AdminDb, url: URL): Promise<Response> {
  const status = optionalString(url.searchParams.get('status'), 'Status', 20);
  if (status && !(TOUR_STATUSES as readonly string[]).includes(status)) {
    throw new ApiError(422, 'validation_error', 'Unknown tour status filter.');
  }
  const collection = optionalString(url.searchParams.get('collection'), 'Collection', 20);
  if (collection && !['package', 'day_tour'].includes(collection)) {
    throw new ApiError(422, 'validation_error', 'Unknown collection filter.');
  }
  const q = optionalString(url.searchParams.get('q'), 'Search', 120);
  const limit = boundedInteger(Number(url.searchParams.get('limit') ?? DEFAULT_PAGE), 'Limit', 1, MAX_PAGE);
  const offset = boundedInteger(Number(url.searchParams.get('offset') ?? 0), 'Offset', 0, 100000);
  const sort = url.searchParams.get('sort') === 'title' ? 'title COLLATE NOCASE ASC' : 'updated_at DESC';

  const conditions: string[] = [];
  const bindings: unknown[] = [];
  if (status) { conditions.push('status = ?'); bindings.push(status); }
  if (collection) { conditions.push('collection = ?'); bindings.push(collection); }
  if (q) {
    conditions.push('(id LIKE ? OR title LIKE ? OR destination LIKE ?)');
    const like = `%${q.replace(/[%_]/g, '')}%`;
    bindings.push(like, like, like);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRow = await env.DB.prepare(`SELECT COUNT(*) AS n FROM cms_tours ${where}`)
    .bind(...bindings)
    .first<{ n: number }>();

  const { results } = await env.DB.prepare(`
    SELECT id, collection, status, revision, published_revision_no, title,
           destination, category, duration, price, currency, cover_image,
           updated_by, updated_at, released_at
    FROM cms_tours ${where} ORDER BY ${sort} LIMIT ? OFFSET ?
  `)
    .bind(...bindings, limit, offset)
    .all();

  return json({ tours: results ?? [], total: countRow?.n ?? 0 });
}

async function getTour(env: AdminDb, id: string): Promise<Response> {
  const row = await env.DB.prepare('SELECT * FROM cms_tours WHERE id = ?').bind(id).first();
  if (!row) throw new ApiError(404, 'not_found', 'No CMS tour matches that identifier.');
  const refs = await env.DB.prepare(
    'SELECT COUNT(*) AS n FROM bookings WHERE tour_id = ?'
  ).bind(id).first<{ n: number }>();
  return json({ tour: row, inquiryReferences: refs?.n ?? 0 });
}

async function insertTourRevision(
  env: AdminDb,
  id: string,
  actor: string,
  summary: string,
  now: string
): Promise<D1PreparedStatement> {
  const row = await env.DB.prepare('SELECT * FROM cms_tours WHERE id = ?').bind(id).first();
  return env.DB.prepare(`
    INSERT INTO cms_tour_revisions (tour_id, revision_no, snapshot, summary, actor, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(id, (row as { revision: number }).revision, rowSnapshot(row as Record<string, unknown>), summary, actor, now);
}

export async function createTour(env: AdminDb, request: Request, actor: string): Promise<Response> {
  const body = (await readBoundedJson(request, MAX_ADMIN_BODY_BYTES)) as Record<string, unknown> | null;
  if (!isRecord(body)) throw new ApiError(422, 'validation_error', 'A JSON object body is required.');

  const id = requiredString(body.id, 'Tour id', 160).toLowerCase();
  if (!SLUG_PATTERN.test(id)) {
    throw new ApiError(422, 'validation_error', 'Tour id must be a lowercase slug (a-z, 0-9, dashes).');
  }

  const exists = await env.DB.prepare('SELECT id FROM cms_tours WHERE id = ?').bind(id).first();
  if (exists) throw new ApiError(409, 'duplicate_slug', 'A tour with that id already exists.');

  const now = new Date().toISOString();
  const patch = buildTourPatch(body, {
    collection: 'package', currency: 'USD', category: 'cultural',
    highlights: '[]', itinerary: '[]', inclusions: '[]', exclusions: '[]',
    gallery: '[]', related_tours: '[]', canonical_path: `/tours/${id}`
  });

  const outcome = validateTourRow({ ...patch, id } as Partial<CmsTourRow>);
  if (outcome.errors.length) fail422(outcome.errors);

  const columns = Object.keys(patch);
  const placeholders = columns.map(() => '?').join(', ');
  const statements: D1PreparedStatement[] = [
    env.DB.prepare(`
      INSERT INTO cms_tours (id, status, revision, created_by, updated_by, created_at, updated_at, ${columns.join(', ')})
      VALUES (?, 'draft', 1, ?, ?, ?, ?, ${placeholders})
    `).bind(id, actor, actor, now, now, ...columns.map(col => patch[col])),
    auditStatement(env, actor, 'tour.create', 'tour', id, `Draft created (${patch.title ?? id}).`, now)
  ];
  await env.DB.batch(statements);
  await env.DB.batch([await insertTourRevision(env, id, actor, 'Initial draft', now)]);
  return json({ tour: { id, status: 'draft', revision: 1 } }, { status: 201 });
}

export async function updateTour(env: AdminDb, id: string, request: Request, actor: string): Promise<Response> {
  const body = (await readBoundedJson(request, MAX_ADMIN_BODY_BYTES)) as Record<string, unknown> | null;
  if (!isRecord(body)) throw new ApiError(422, 'validation_error', 'A JSON object body is required.');
  const expected = boundedInteger(body.expectedRevision, 'Expected revision', 1, 1000000);
  const summary = optionalString(body.summary, 'Change summary', 300) ?? 'Content update';

  const current = await env.DB.prepare('SELECT * FROM cms_tours WHERE id = ?').bind(id).first<CmsTourRow>();
  if (!current) throw new ApiError(404, 'not_found', 'No CMS tour matches that identifier.');

  const patch = buildTourPatch(body, current);
  const outcome = validateTourRow({ ...patch, id });
  if (outcome.errors.length) fail422(outcome.errors);

  const now = new Date().toISOString();
  const fieldKeys = Object.keys(isRecord(body.fields) ? body.fields : {});
  const sets = fieldKeys.map(key => `${key} = ?`).join(', ');
  const values = fieldKeys.map(key => patch[key]);

  const result = await env.DB.prepare(`
    UPDATE cms_tours SET ${sets ? sets + ', ' : ''}revision = revision + 1, updated_by = ?, updated_at = ?
    WHERE id = ? AND revision = ?
  `)
    .bind(...values, actor, now, id, expected)
    .run();

  if (!result.meta.changes) {
    throw new ApiError(409, 'revision_conflict', 'This tour was changed by someone else. Reload and retry.');
  }

  await env.DB.batch([
    await insertTourRevision(env, id, actor, summary, now),
    auditStatement(env, actor, 'tour.update', 'tour', id, summary, now)
  ]);
  return json({ tour: { id, revision: expected + 1 }, warnings: outcome.warnings });
}

export async function setTourStatus(
  env: AdminDb,
  id: string,
  request: Request,
  actor: string
): Promise<Response> {
  const body = (await readBoundedJson(request, MAX_ADMIN_BODY_BYTES)) as Record<string, unknown> | null;
  if (!isRecord(body)) throw new ApiError(422, 'validation_error', 'A JSON object body is required.');
  const status = requiredString(body.status, 'Status', 20) as TourStatus;
  if (!TOUR_STATUSES.includes(status)) {
    throw new ApiError(422, 'validation_error', 'Status must be draft, published or archived.');
  }
  const expected = boundedInteger(body.expectedRevision, 'Expected revision', 1, 1000000);

  const current = await env.DB.prepare('SELECT * FROM cms_tours WHERE id = ?').bind(id).first<CmsTourRow>();
  if (!current) throw new ApiError(404, 'not_found', 'No CMS tour matches that identifier.');

  if (status === 'published') {
    const outcome = validateTourRow(current);
    if (outcome.errors.length) fail422(outcome.errors);
  }

  const now = new Date().toISOString();
  const releaseBits = status === 'published'
    ? ', published_revision_no = revision, slug_locked = 1, released_at = ?'
    : '';
  const bindValues = status === 'published' ? [status, actor, now, now, id, expected] : [status, actor, now, id, expected];

  const result = await env.DB.prepare(`
    UPDATE cms_tours SET status = ?, updated_by = ?, updated_at = ?${releaseBits}
    WHERE id = ? AND revision = ?
  `)
    .bind(...bindValues)
    .run();

  if (!result.meta.changes) {
    throw new ApiError(409, 'revision_conflict', 'This tour was changed by someone else. Reload and retry.');
  }

  await env.DB.batch([
    auditStatement(env, actor, `tour.${status}`, 'tour', id, `${current.status} → ${status}`, now)
  ]);
  return json({ tour: { id, status } });
}

export async function duplicateTour(env: AdminDb, id: string, actor: string): Promise<Response> {
  const current = await env.DB.prepare('SELECT * FROM cms_tours WHERE id = ?').bind(id).first<CmsTourRow>();
  if (!current) throw new ApiError(404, 'not_found', 'No CMS tour matches that identifier.');

  let candidate = `${id}-copy`;
  for (let i = 2; ; i += 1) {
    const clash = await env.DB.prepare('SELECT id FROM cms_tours WHERE id = ?').bind(candidate).first();
    if (!clash) break;
    candidate = `${id}-copy-${i}`;
  }

  const now = new Date().toISOString();
  const copy = { ...current, title: `${current.title} (copy)` };
  const NON_COPYABLE = new Set([
    'id', 'status', 'revision', 'published_revision_no', 'slug_locked',
    'created_by', 'updated_by', 'created_at', 'updated_at', 'released_at'
  ]);
  const rest = Object.fromEntries(
    Object.entries(copy).filter(([key]) => !NON_COPYABLE.has(key))
  );
  const columns = Object.keys(rest);
  await env.DB.batch([
    env.DB.prepare(`
      INSERT INTO cms_tours (id, status, revision, created_by, updated_by, created_at, updated_at, ${columns.join(', ')})
      VALUES (?, 'draft', 1, ?, ?, ?, ?, ${columns.map(() => '?').join(', ')})
    `).bind(candidate, actor, actor, now, now, ...columns.map(col => (rest as Record<string, unknown>)[col])),
    auditStatement(env, actor, 'tour.duplicate', 'tour', candidate, `Duplicated from ${id}.`, now)
  ]);
  await env.DB.batch([await insertTourRevision(env, candidate, actor, `Duplicated from ${id}`, now)]);
  return json({ tour: { id: candidate, status: 'draft', revision: 1 } }, { status: 201 });
}

export async function listTourRevisions(env: AdminDb, id: string): Promise<Response> {
  const { results } = await env.DB.prepare(`
    SELECT revision_no, summary, actor, created_at FROM cms_tour_revisions
    WHERE tour_id = ? ORDER BY revision_no DESC
  `).bind(id).all();
  return json({ revisions: results ?? [] });
}

export async function getTourRevision(env: AdminDb, id: string, revisionNo: number): Promise<Response> {
  const row = await env.DB.prepare(
    'SELECT * FROM cms_tour_revisions WHERE tour_id = ? AND revision_no = ?'
  ).bind(id, revisionNo).first();
  if (!row) throw new ApiError(404, 'not_found', 'No such revision.');
  return json({ revision: row });
}

export async function restoreTourRevision(
  env: AdminDb,
  id: string,
  request: Request,
  actor: string
): Promise<Response> {
  const body = (await readBoundedJson(request, MAX_ADMIN_BODY_BYTES)) as Record<string, unknown> | null;
  const revisionNo = boundedInteger(body?.revisionNo, 'Revision', 1, 1000000);
  const expected = boundedInteger(body?.expectedRevision, 'Expected revision', 1, 1000000);

  const rev = await env.DB.prepare(
    'SELECT snapshot FROM cms_tour_revisions WHERE tour_id = ? AND revision_no = ?'
  ).bind(id, revisionNo).first<{ snapshot: string }>();
  if (!rev) throw new ApiError(404, 'not_found', 'No such revision.');

  const snapshot = JSON.parse(rev.snapshot) as CmsTourRow;
  const now = new Date().toISOString();
  const restorable = { ...snapshot };
  delete (restorable as Partial<CmsTourRow>).revision;

  const columns = TOUR_EDITABLE.filter(col => col in restorable);
  const sets = columns.map(col => `${col} = ?`).join(', ');
  const result = await env.DB.prepare(`
    UPDATE cms_tours SET ${sets}, revision = revision + 1, updated_by = ?, updated_at = ?
    WHERE id = ? AND revision = ?
  `)
    .bind(...columns.map(col => (restorable as Record<string, unknown>)[col]), actor, now, id, expected)
    .run();

  if (!result.meta.changes) {
    throw new ApiError(409, 'revision_conflict', 'This tour was changed by someone else. Reload and retry.');
  }

  await env.DB.batch([
    await insertTourRevision(env, id, actor, `Restored revision ${revisionNo}`, now),
    auditStatement(env, actor, 'tour.restore', 'tour', id, `Restored to revision ${revisionNo}.`, now)
  ]);
  return json({ tour: { id, revision: expected + 1 } });
}

// ---------------------------------------------------------------------------
// Blog posts — same mechanics, post-shaped payload
// ---------------------------------------------------------------------------

async function listPosts(env: AdminDb, url: URL): Promise<Response> {
  const status = optionalString(url.searchParams.get('status'), 'Status', 20);
  if (status && !(POST_STATUSES as readonly string[]).includes(status)) {
    throw new ApiError(422, 'validation_error', 'Unknown post status filter.');
  }
  const q = optionalString(url.searchParams.get('q'), 'Search', 120);
  const limit = boundedInteger(Number(url.searchParams.get('limit') ?? DEFAULT_PAGE), 'Limit', 1, MAX_PAGE);
  const offset = boundedInteger(Number(url.searchParams.get('offset') ?? 0), 'Offset', 0, 100000);

  const conditions: string[] = [];
  const bindings: unknown[] = [];
  if (status) { conditions.push('status = ?'); bindings.push(status); }
  if (q) {
    conditions.push('(slug LIKE ? OR title LIKE ?)');
    const like = `%${q.replace(/[%_]/g, '')}%`;
    bindings.push(like, like);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRow = await env.DB.prepare(`SELECT COUNT(*) AS n FROM cms_posts ${where}`)
    .bind(...bindings)
    .first<{ n: number }>();
  const { results } = await env.DB.prepare(`
    SELECT id, slug, status, revision, published_revision_no, title, author,
           published_at, scheduled_at, updated_by, updated_at, released_at
    FROM cms_posts ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?
  `).bind(...bindings, limit, offset).all();

  return json({ posts: results ?? [], total: countRow?.n ?? 0 });
}

async function getPost(env: AdminDb, id: string): Promise<Response> {
  const row = await env.DB.prepare('SELECT * FROM cms_posts WHERE id = ?').bind(id).first();
  if (!row) throw new ApiError(404, 'not_found', 'No CMS post matches that identifier.');
  return json({ post: row });
}

async function insertPostRevision(
  env: AdminDb,
  id: string,
  actor: string,
  summary: string,
  now: string
): Promise<D1PreparedStatement> {
  const row = await env.DB.prepare('SELECT * FROM cms_posts WHERE id = ?').bind(id).first();
  return env.DB.prepare(`
    INSERT INTO cms_post_revisions (post_id, revision_no, snapshot, summary, actor, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(id, (row as { revision: number }).revision, rowSnapshot(row as Record<string, unknown>), summary, actor, now);
}

export async function createPost(env: AdminDb, request: Request, actor: string): Promise<Response> {
  const body = (await readBoundedJson(request, MAX_ADMIN_BODY_BYTES)) as Record<string, unknown> | null;
  if (!isRecord(body)) throw new ApiError(422, 'validation_error', 'A JSON object body is required.');

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const patch = buildPostPatch(body, { tags: '[]' });
  const slug = String(patch.slug ?? '');

  const outcome = validatePostRow({ ...patch, slug } as Partial<CmsPostRow>);
  if (outcome.errors.length) fail422(outcome.errors);

  const clash = await env.DB.prepare('SELECT id FROM cms_posts WHERE slug = ?').bind(slug).first();
  if (clash) throw new ApiError(409, 'duplicate_slug', 'A post with that slug already exists.');

  const columns = Object.keys(patch).filter(col => col !== 'slug');
  await env.DB.batch([
    env.DB.prepare(`
      INSERT INTO cms_posts (id, slug, status, revision, created_by, updated_by, created_at, updated_at${columns.length ? ', ' + columns.join(', ') : ''})
      VALUES (?, ?, 'draft', 1, ?, ?, ?, ?${columns.length ? ', ' + columns.map(() => '?').join(', ') : ''})
    `).bind(id, slug, actor, actor, now, now, ...columns.map(col => patch[col])),
    auditStatement(env, actor, 'post.create', 'post', id, `Draft created (${slug}).`, now)
  ]);
  await env.DB.batch([await insertPostRevision(env, id, actor, 'Initial draft', now)]);
  return json({ post: { id, slug, status: 'draft', revision: 1 } }, { status: 201 });
}

export async function updatePost(env: AdminDb, id: string, request: Request, actor: string): Promise<Response> {
  const body = (await readBoundedJson(request, MAX_ADMIN_BODY_BYTES)) as Record<string, unknown> | null;
  if (!isRecord(body)) throw new ApiError(422, 'validation_error', 'A JSON object body is required.');
  const expected = boundedInteger(body.expectedRevision, 'Expected revision', 1, 1000000);
  const summary = optionalString(body.summary, 'Change summary', 300) ?? 'Content update';

  const current = await env.DB.prepare('SELECT * FROM cms_posts WHERE id = ?').bind(id).first<CmsPostRow>();
  if (!current) throw new ApiError(404, 'not_found', 'No CMS post matches that identifier.');

  const patch = buildPostPatch(body, current);
  const outcome = validatePostRow({ ...patch, slug: String(patch.slug ?? current.slug) });
  if (outcome.errors.length) fail422(outcome.errors);

  const now = new Date().toISOString();
  const statements: D1PreparedStatement[] = [];
  const fieldKeys = Object.keys(isRecord(body.fields) ? body.fields : {}).filter(
    key => key !== 'slug'
  );

  // Published slugs are immutable unless the editor supplies the old slug as
  // a redirect source — recorded so the next export can emit the redirect.
  const wantsSlugChange =
    isRecord(body.fields) && body.fields.slug !== undefined && body.fields.slug !== current.slug;
  if (wantsSlugChange) {
    const nextSlug = String(patch.slug ?? '');
    if (!SLUG_PATTERN.test(nextSlug)) {
      throw new ApiError(422, 'validation_error', 'Slug must be lowercase with dashes.');
    }
    const clash = await env.DB.prepare('SELECT id FROM cms_posts WHERE slug = ? AND id != ?')
      .bind(nextSlug, id).first();
    if (clash) throw new ApiError(409, 'duplicate_slug', 'A post with that slug already exists.');
    if (current.slug_locked) {
      const redirectFrom = optionalString(body.redirectFrom, 'Redirect source', 200);
      if (redirectFrom !== current.slug) {
        throw new ApiError(
          422,
          'slug_locked',
          'This slug is published. Confirm the change by passing redirectFrom with the current slug — a redirect will be recorded.'
        );
      }
      statements.push(
        env.DB.prepare(`
          INSERT INTO cms_redirects (entity_type, entity_id, from_slug, to_slug, actor, created_at)
          VALUES ('post', ?, ?, ?, ?, ?)
          ON CONFLICT (entity_type, from_slug) DO UPDATE SET to_slug = excluded.to_slug
        `).bind(id, current.slug, nextSlug, actor, now)
      );
    }
    fieldKeys.push('slug');
  }

  const sets = fieldKeys.map(key => `${key} = ?`).join(', ');
  const result = await env.DB.prepare(`
    UPDATE cms_posts SET ${sets ? sets + ', ' : ''}revision = revision + 1, updated_by = ?, updated_at = ?
    WHERE id = ? AND revision = ?
  `)
    .bind(...fieldKeys.map(key => patch[key]), actor, now, id, expected)
    .run();

  if (!result.meta.changes) {
    throw new ApiError(409, 'revision_conflict', 'This post was changed by someone else. Reload and retry.');
  }

  await env.DB.batch([
    ...statements,
    await insertPostRevision(env, id, actor, summary, now),
    auditStatement(env, actor, 'post.update', 'post', id, summary, now)
  ]);
  return json({ post: { id, revision: expected + 1 }, warnings: outcome.warnings });
}

export async function setPostStatus(
  env: AdminDb,
  id: string,
  request: Request,
  actor: string
): Promise<Response> {
  const body = (await readBoundedJson(request, MAX_ADMIN_BODY_BYTES)) as Record<string, unknown> | null;
  if (!isRecord(body)) throw new ApiError(422, 'validation_error', 'A JSON object body is required.');
  const status = requiredString(body.status, 'Status', 20) as PostStatus;
  if (!POST_STATUSES.includes(status)) {
    throw new ApiError(422, 'validation_error', 'Status must be draft, published, scheduled or archived.');
  }
  const expected = boundedInteger(body.expectedRevision, 'Expected revision', 1, 1000000);
  const scheduledAt = optionalString(body.scheduledAt, 'Scheduled date', 40) ?? null;

  const current = await env.DB.prepare('SELECT * FROM cms_posts WHERE id = ?').bind(id).first<CmsPostRow>();
  if (!current) throw new ApiError(404, 'not_found', 'No CMS post matches that identifier.');

  if (status === 'published' || status === 'scheduled') {
    const outcome = validatePostRow(current);
    if (outcome.errors.length) fail422(outcome.errors);
    if (status === 'scheduled' && !scheduledAt) {
      throw new ApiError(422, 'validation_error', 'A scheduled post needs a publication date.');
    }
  }

  const now = new Date().toISOString();
  const releaseBits = status === 'published' || status === 'scheduled'
    ? `, published_revision_no = revision, slug_locked = 1, released_at = ?, published_at = ?, scheduled_at = ?`
    : '';
  const bindValues = releaseBits
    ? [status, actor, now, now, status === 'published' ? (current.published_at ?? now) : null, scheduledAt, id, expected]
    : [status, actor, now, id, expected];

  const result = await env.DB.prepare(`
    UPDATE cms_posts SET status = ?, updated_by = ?, updated_at = ?${releaseBits}
    WHERE id = ? AND revision = ?
  `).bind(...bindValues).run();

  if (!result.meta.changes) {
    throw new ApiError(409, 'revision_conflict', 'This post was changed by someone else. Reload and retry.');
  }

  await env.DB.batch([
    auditStatement(env, actor, `post.${status}`, 'post', id, `${current.status} → ${status}`, now)
  ]);
  return json({ post: { id, status } });
}

export async function listPostRevisions(env: AdminDb, id: string): Promise<Response> {
  const { results } = await env.DB.prepare(`
    SELECT revision_no, summary, actor, created_at FROM cms_post_revisions
    WHERE post_id = ? ORDER BY revision_no DESC
  `).bind(id).all();
  return json({ revisions: results ?? [] });
}

export async function getPostRevision(env: AdminDb, id: string, revisionNo: number): Promise<Response> {
  const row = await env.DB.prepare(
    'SELECT * FROM cms_post_revisions WHERE post_id = ? AND revision_no = ?'
  ).bind(id, revisionNo).first();
  if (!row) throw new ApiError(404, 'not_found', 'No such revision.');
  return json({ revision: row });
}

export async function restorePostRevision(
  env: AdminDb,
  id: string,
  request: Request,
  actor: string
): Promise<Response> {
  const body = (await readBoundedJson(request, MAX_ADMIN_BODY_BYTES)) as Record<string, unknown> | null;
  const revisionNo = boundedInteger(body?.revisionNo, 'Revision', 1, 1000000);
  const expected = boundedInteger(body?.expectedRevision, 'Expected revision', 1, 1000000);

  const rev = await env.DB.prepare(
    'SELECT snapshot FROM cms_post_revisions WHERE post_id = ? AND revision_no = ?'
  ).bind(id, revisionNo).first<{ snapshot: string }>();
  if (!rev) throw new ApiError(404, 'not_found', 'No such revision.');

  const snapshot = JSON.parse(rev.snapshot) as CmsPostRow;
  const now = new Date().toISOString();
  const columns = POST_EDITABLE.filter(col => col in snapshot && col !== 'slug');
  const sets = columns.map(col => `${col} = ?`).join(', ');
  const result = await env.DB.prepare(`
    UPDATE cms_posts SET ${sets}, revision = revision + 1, updated_by = ?, updated_at = ?
    WHERE id = ? AND revision = ?
  `)
    .bind(...columns.map(col => (snapshot as unknown as Record<string, unknown>)[col]), actor, now, id, expected)
    .run();

  if (!result.meta.changes) {
    throw new ApiError(409, 'revision_conflict', 'This post was changed by someone else. Reload and retry.');
  }

  await env.DB.batch([
    await insertPostRevision(env, id, actor, `Restored revision ${revisionNo}`, now),
    auditStatement(env, actor, 'post.restore', 'post', id, `Restored to revision ${revisionNo}.`, now)
  ]);
  return json({ post: { id, revision: expected + 1 } });
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export async function handleCmsRequest(
  request: Request,
  env: AdminDb,
  path: string,
  actor: string
): Promise<Response | null> {
  const method = request.method.toUpperCase();

  if (path === '/tours' && method === 'GET') return listTours(env, new URL(request.url));
  if (path === '/tours' && method === 'POST') return createTour(env, request, actor);
  if (path === '/posts' && method === 'GET') return listPosts(env, new URL(request.url));
  if (path === '/posts' && method === 'POST') return createPost(env, request, actor);

  const tourMatch = path.match(/^\/tours\/([^/]+)$/);
  if (tourMatch && method === 'GET') return getTour(env, decodeURIComponent(tourMatch[1]));
  if (tourMatch && method === 'PUT') return updateTour(env, decodeURIComponent(tourMatch[1]), request, actor);

  const tourStatus = path.match(/^\/tours\/([^/]+)\/status$/);
  if (tourStatus && method === 'POST') return setTourStatus(env, decodeURIComponent(tourStatus[1]), request, actor);

  const tourDup = path.match(/^\/tours\/([^/]+)\/duplicate$/);
  if (tourDup && method === 'POST') return duplicateTour(env, decodeURIComponent(tourDup[1]), actor);

  const tourRevs = path.match(/^\/tours\/([^/]+)\/revisions$/);
  if (tourRevs && method === 'GET') return listTourRevisions(env, decodeURIComponent(tourRevs[1]));

  const tourRev = path.match(/^\/tours\/([^/]+)\/revisions\/(\d+)$/);
  if (tourRev && method === 'GET') return getTourRevision(env, decodeURIComponent(tourRev[1]), Number(tourRev[2]));

  const tourRestore = path.match(/^\/tours\/([^/]+)\/restore$/);
  if (tourRestore && method === 'POST') return restoreTourRevision(env, decodeURIComponent(tourRestore[1]), request, actor);

  const postMatch = path.match(/^\/posts\/([^/]+)$/);
  if (postMatch && method === 'GET') return getPost(env, decodeURIComponent(postMatch[1]));
  if (postMatch && method === 'PUT') return updatePost(env, decodeURIComponent(postMatch[1]), request, actor);

  const postStatus = path.match(/^\/posts\/([^/]+)\/status$/);
  if (postStatus && method === 'POST') return setPostStatus(env, decodeURIComponent(postStatus[1]), request, actor);

  const postRevs = path.match(/^\/posts\/([^/]+)\/revisions$/);
  if (postRevs && method === 'GET') return listPostRevisions(env, decodeURIComponent(postRevs[1]));

  const postRev = path.match(/^\/posts\/([^/]+)\/revisions\/(\d+)$/);
  if (postRev && method === 'GET') return getPostRevision(env, decodeURIComponent(postRev[1]), Number(postRev[2]));

  const postRestore = path.match(/^\/posts\/([^/]+)\/restore$/);
  if (postRestore && method === 'POST') return restorePostRevision(env, decodeURIComponent(postRestore[1]), request, actor);

  return null;
}

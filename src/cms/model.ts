import type { BlogPost, ItineraryItem, Tour } from '../types';

/**
 * Pure CMS data layer — the mapping, validation and serialization shared by
 * the four `cms:*` CLI scripts and exercised directly by the unit tests.
 *
 * Nothing in this module touches the filesystem, the network or a D1 handle,
 * so every behavior is unit-testable. The wrangler-bound shells live in the
 * individual script files.
 */

// ---------------------------------------------------------------------------
// Row shapes (mirror migrations/0008_cms_schema.sql)
// ---------------------------------------------------------------------------

export interface CmsTourRow {
  id: string;
  collection: 'package' | 'day_tour';
  status: 'draft' | 'published' | 'archived';
  revision: number;
  published_revision_no: number | null;
  slug_locked: number;
  title: string;
  destination: string;
  category: string;
  duration: string;
  availability_label: string;
  price: number | null;
  currency: string;
  short_description: string;
  full_description: string;
  highlights: string;
  itinerary: string;
  inclusions: string;
  exclusions: string;
  notes: string;
  pickup_info: string;
  meeting_point: string;
  accessibility: string;
  operating_days: string;
  child_info: string;
  accommodation_info: string;
  cover_image: string;
  gallery: string;
  related_tours: string;
  map_url: string;
  display_order: number;
  featured: number;
  seo_title: string;
  meta_description: string;
  canonical_path: string;
  og_image: string;
  source_notes: string;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  released_at: string | null;
}

export interface CmsPostRow {
  id: string;
  slug: string;
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  revision: number;
  published_revision_no: number | null;
  slug_locked: number;
  title: string;
  excerpt: string;
  author: string;
  cover_image: string;
  content: string;
  tags: string;
  seo_title: string;
  meta_description: string;
  og_image: string;
  published_at: string | null;
  scheduled_at: string | null;
  source_notes: string;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  released_at: string | null;
}

// Allows the consecutive dashes present in legacy ids (e.g.
// "pkg-7-5-days-cairo--luxor---abu-simbel-tour") while still refusing spaces,
// case, punctuation and traversal characters.
export const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
export const TOUR_CATEGORIES = ['historical', 'cultural', 'adventure', 'spiritual'] as const;

// ---------------------------------------------------------------------------
// Safety: markup that must never enter stored content
// ---------------------------------------------------------------------------

const UNSAFE_MARKUP = /<\s*script|<\s*iframe|<\s*object|<\s*embed|javascript:|data:text\/html|\son[a-z]+\s*=/i;

/**
 * Rejects markup that could execute when rendered. Blog content is a markdown
 * subset rendered through a custom parser, so any raw HTML/event-handler
 * attribute is by definition unsafe rather than decorative.
 */
export function findUnsafeMarkup(value: string): string | null {
  const match = UNSAFE_MARKUP.exec(value);
  return match ? match[0] : null;
}

// ---------------------------------------------------------------------------
// Tour mapping: static Tour <-> CMS row
// ---------------------------------------------------------------------------

type JsonArray = string;

function toJson(value: unknown): JsonArray {
  return JSON.stringify(value ?? []);
}

function fromJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Map a static-catalog `Tour` to the CMS row the seeder inserts. Fields that
 * have no static counterpart (pickup, child policy, …) stay empty — they are
 * edited through the dashboard, not invented here.
 */
export function tourToRow(
  tour: Tour,
  collection: 'package' | 'day_tour',
  actor: string,
  now: string
): CmsTourRow {
  return {
    id: tour.id,
    collection,
    status: 'published',
    revision: 1,
    published_revision_no: 1,
    slug_locked: 1,
    title: tour.title,
    destination: tour.location ?? '',
    category: tour.category ?? 'cultural',
    duration: tour.duration ?? '',
    availability_label: '',
    price: tour.price ?? null,
    currency: 'USD',
    short_description: tour.description ?? '',
    full_description: '',
    highlights: toJson(tour.highlights),
    itinerary: toJson(tour.itinerary),
    inclusions: toJson(tour.inclusions),
    exclusions: toJson(tour.exclusions),
    notes: '',
    pickup_info: '',
    meeting_point: '',
    accessibility: '',
    operating_days: '',
    child_info: '',
    accommodation_info: '',
    cover_image: tour.image ?? '',
    gallery: toJson(tour.gallery),
    related_tours: toJson([]),
    map_url: tour.mapUrl ?? '',
    display_order: 0,
    featured: tour.featured ? 1 : 0,
    seo_title: '',
    meta_description: '',
    canonical_path: `/tours/${tour.id}`,
    og_image: '',
    source_notes: '',
    created_by: actor,
    updated_by: actor,
    created_at: now,
    updated_at: now,
    released_at: now
  };
}

/**
 * Map a CMS row back to the public `Tour` shape the build consumes.
 * Only published rows reach this function (the exporter filters), and only
 * the public fields are projected — CMS-only metadata stays in D1.
 */
export function rowToTour(row: CmsTourRow): Tour {
  const tour: Tour = {
    id: row.id,
    title: row.title,
    description: row.short_description,
    price: row.price ?? 0,
    duration: row.duration,
    location: row.destination,
    category: (TOUR_CATEGORIES as readonly string[]).includes(row.category)
      ? (row.category as Tour['category'])
      : 'cultural',
    image: row.cover_image
  };
  const itinerary = fromJson<ItineraryItem[]>(row.itinerary, []);
  const highlights = fromJson<string[]>(row.highlights, []);
  const inclusions = fromJson<string[]>(row.inclusions, []);
  const exclusions = fromJson<string[]>(row.exclusions, []);
  const gallery = fromJson<string[]>(row.gallery, []);
  if (itinerary.length) tour.itinerary = itinerary;
  if (highlights.length) tour.highlights = highlights;
  if (inclusions.length) tour.inclusions = inclusions;
  if (exclusions.length) tour.exclusions = exclusions;
  if (gallery.length) tour.gallery = gallery;
  if (row.featured) tour.featured = true;
  if (row.map_url) tour.mapUrl = row.map_url;
  return tour;
}

// ---------------------------------------------------------------------------
// Blog mapping
// ---------------------------------------------------------------------------

export function postToRow(post: BlogPost, actor: string, now: string): CmsPostRow {
  return {
    id: post.id,
    slug: post.id,
    status: 'published',
    revision: 1,
    published_revision_no: 1,
    slug_locked: 1,
    title: post.title,
    excerpt: post.excerpt,
    author: post.author,
    cover_image: post.image,
    content: post.content,
    tags: toJson(post.tags),
    seo_title: '',
    meta_description: post.excerpt,
    og_image: '',
    published_at: post.date,
    scheduled_at: null,
    source_notes: '',
    created_by: actor,
    updated_by: actor,
    created_at: now,
    updated_at: now,
    released_at: now
  };
}

export function rowToPost(row: CmsPostRow): BlogPost {
  return {
    id: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    author: row.author,
    date: (row.published_at ?? '').slice(0, 10),
    image: row.cover_image,
    tags: fromJson<string[]>(row.tags, [])
  };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface FieldIssue {
  field: string;
  message: string;
}

export interface ValidationOutcome {
  errors: FieldIssue[];
  warnings: FieldIssue[];
}

const IMAGE_PATH = /^\/[\w\-./]+$/;
const ABSOLUTE_URL = /^https:\/\//;

function checkTextSafety(field: string, value: string, errors: FieldIssue[]): void {
  const unsafe = findUnsafeMarkup(value);
  if (unsafe) {
    errors.push({ field, message: `Contains unsafe markup (${JSON.stringify(unsafe)}).` });
  }
}

export function validateTourRow(row: Partial<CmsTourRow>): ValidationOutcome {
  const errors: FieldIssue[] = [];
  const warnings: FieldIssue[] = [];

  if (!row.id || !SLUG_PATTERN.test(row.id)) {
    errors.push({ field: 'id', message: 'ID must be a lowercase slug (a-z, 0-9, dashes).' });
  }
  if (!row.title?.trim()) errors.push({ field: 'title', message: 'Title is required.' });
  if (row.category && !(TOUR_CATEGORIES as readonly string[]).includes(row.category)) {
    errors.push({
      field: 'category',
      message: `Category must be one of: ${TOUR_CATEGORIES.join(', ')}.`
    });
  }
  if (row.price !== undefined && row.price !== null) {
    if (typeof row.price !== 'number' || !Number.isFinite(row.price) || row.price < 0) {
      errors.push({ field: 'price', message: 'Price must be a non-negative number.' });
    }
  }
  if (row.currency && !/^[A-Z]{3}$/.test(row.currency)) {
    errors.push({ field: 'currency', message: 'Currency must be a 3-letter ISO code.' });
  }

  for (const field of ['highlights', 'itinerary', 'inclusions', 'exclusions', 'gallery', 'related_tours'] as const) {
    const raw = row[field];
    if (raw === undefined) continue;
    try {
      if (!Array.isArray(JSON.parse(raw))) throw new Error('not an array');
    } catch {
      errors.push({ field, message: `${field} must be a JSON array.` });
    }
  }

  try {
    const days = fromJson<ItineraryItem[]>(row.itinerary ?? '[]', []);
    days.forEach((day, index) => {
      if (typeof day.day !== 'number' || day.day < 1) {
        errors.push({ field: 'itinerary', message: `Itinerary item ${index + 1} has no valid day number.` });
      }
      if (!day.title?.trim() && !day.description?.trim()) {
        errors.push({ field: 'itinerary', message: `Itinerary day ${day.day} needs a title or description.` });
      }
    });
  } catch {
    /* already reported as malformed JSON above */
  }

  if (row.cover_image && !IMAGE_PATH.test(row.cover_image) && !ABSOLUTE_URL.test(row.cover_image)) {
    errors.push({ field: 'cover_image', message: 'Cover image must be a local /images path or https URL.' });
  }
  if (!row.cover_image) {
    warnings.push({ field: 'cover_image', message: 'No cover image — the card will show the placeholder.' });
  }
  if (!row.short_description?.trim()) {
    warnings.push({ field: 'short_description', message: 'No short description for listing cards.' });
  }
  if (!row.meta_description?.trim()) {
    warnings.push({ field: 'meta_description', message: 'No meta description — SEO check will flag it.' });
  }

  for (const [field, value] of Object.entries({
    title: row.title,
    short_description: row.short_description,
    full_description: row.full_description,
    notes: row.notes,
    child_info: row.child_info,
    accommodation_info: row.accommodation_info
  })) {
    if (typeof value === 'string') checkTextSafety(field, value, errors);
  }

  return { errors, warnings };
}

export function validatePostRow(row: Partial<CmsPostRow>): ValidationOutcome {
  const errors: FieldIssue[] = [];
  const warnings: FieldIssue[] = [];

  if (!row.slug || !SLUG_PATTERN.test(row.slug)) {
    errors.push({ field: 'slug', message: 'Slug must be lowercase with dashes (a-z, 0-9, -).' });
  }
  if (!row.title?.trim()) errors.push({ field: 'title', message: 'Title is required.' });
  if (!row.content?.trim()) errors.push({ field: 'content', message: 'Body content is required.' });

  if (row.excerpt && row.excerpt.length > 220) {
    warnings.push({ field: 'excerpt', message: 'Excerpt is longer than 220 characters.' });
  }

  // Heading structure: the markdown subset supports ## and ### only, and the
  // document must not jump straight to ### without a ##.
  if (row.content) {
    const lines = row.content.split('\n');
    let seenH2 = false;
    lines.forEach((line, index) => {
      if (/^###\s/.test(line) && !seenH2) {
        errors.push({
          field: 'content',
          message: `Line ${index + 1}: ### heading appears before any ## heading.`
        });
      }
      if (/^##\s/.test(line)) seenH2 = true;
      if (/^#\s/.test(line)) {
        errors.push({ field: 'content', message: `Line ${index + 1}: # headings are not allowed in body content.` });
      }
    });

    // Broken internal links: every markdown link must point at a known path.
    const linkPattern = /\[[^\]]+\]\(([^)]+)\)/g;
    let match: RegExpExecArray | null;
    while ((match = linkPattern.exec(row.content)) !== null) {
      const target = match[1];
      if (target.startsWith('/') && !/^\/(tours|blog|policies|guidelines|about|contact|planner|images)?\/?[\w\-/]*$/.test(target)) {
        warnings.push({ field: 'content', message: `Suspicious internal link target: ${target}` });
      }
      if (/^https?:\/\//.test(target)) {
        warnings.push({ field: 'content', message: `External link in body — verify it is intended: ${target}` });
      }
    }

    if (!/\]\(\/tours\//.test(row.content) && !/\]\(\/(policies|guidelines|contact)/.test(row.content)) {
      warnings.push({
        field: 'content',
        message: 'No internal link to a tour or guidance page — add one for SEO and navigation.'
      });
    }
  }

  if (row.cover_image && !IMAGE_PATH.test(row.cover_image) && !ABSOLUTE_URL.test(row.cover_image)) {
    errors.push({ field: 'cover_image', message: 'Cover image must be a local /images path or https URL.' });
  }

  for (const [field, value] of Object.entries({
    title: row.title,
    excerpt: row.excerpt,
    content: row.content
  })) {
    if (typeof value === 'string') checkTextSafety(field, value, errors);
  }

  return { errors, warnings };
}

// ---------------------------------------------------------------------------
// Deterministic export serialization
// ---------------------------------------------------------------------------

/**
 * Serialize an array to a TS module with stable formatting — one property
 * order, 2-space indentation, LF newlines — so a re-export of unchanged data
 * is byte-identical and `git diff` stays empty.
 */
function serializeValue(value: unknown, indent: string): string {
  if (value === null || value === undefined) return 'undefined';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    if (!value.length) return '[]';
    const inner = value.map(item => `${indent}  ${serializeValue(item, indent + '  ')}`);
    return `[\n${inner.join(',\n')}\n${indent}]`;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).filter(key => record[key] !== undefined);
  if (!keys.length) return '{}';
  const inner = keys.map(key => `${indent}  ${JSON.stringify(key)}: ${serializeValue(record[key], indent + '  ')}`);
  return `{\n${inner.join(',\n')}\n${indent}}`;
}

export function serializeToursModule(rows: CmsTourRow[], exportName: string): string {
  const tours = rows.map(rowToTour);
  const body = tours.map(tour => `  ${serializeValue(tour, '  ')}`).join(',\n');
  return (
    `import type { Tour } from '../types';\n\n` +
    `/**\n * GENERATED by scripts/cms-export.ts — do not edit by hand.\n` +
    ` * Source of truth: cms_tours rows whose status is 'published'.\n */\n` +
    `export const ${exportName}: Tour[] = [\n${body}\n];\n`
  );
}

export function serializePostsModule(rows: CmsPostRow[]): string {
  const posts = rows.map(rowToPost);
  const body = posts.map(post => `  ${serializeValue(post, '  ')}`).join(',\n');
  return (
    `import type { BlogPost } from '../types';\n\n` +
    `/**\n * GENERATED by scripts/cms-export.ts — do not edit by hand.\n` +
    ` * Source of truth: cms_posts rows whose status is 'published'.\n */\n` +
    `export const GENERATED_BLOG_POSTS: BlogPost[] = [\n${body}\n];\n`
  );
}

// ---------------------------------------------------------------------------
// Diff
// ---------------------------------------------------------------------------

export interface FieldDiff {
  id: string;
  field: string;
  source: unknown;
  exported: unknown;
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      const v = (value as Record<string, unknown>)[key];
      if (v !== undefined) out[key] = canonicalize(v);
    }
    return out;
  }
  return value;
}

/**
 * Field-by-field comparison between a static source object and the entity an
 * export produced. Returns a flat list of differences — an empty list means
 * the seeded CMS content and the public build artifacts are identical.
 */
export function diffEntities(id: string, source: unknown, exported: unknown): FieldDiff[] {
  const diffs: FieldDiff[] = [];
  const a = canonicalize(source) as Record<string, unknown>;
  const b = canonicalize(exported) as Record<string, unknown>;
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (JSON.stringify(a[key]) !== JSON.stringify(b[key])) {
      diffs.push({ id, field: key, source: a[key], exported: b[key] });
    }
  }
  return diffs;
}

// ---------------------------------------------------------------------------
// SQL helpers for the seeder
// ---------------------------------------------------------------------------

export function sqlString(value: string | null): string {
  if (value === null) return 'NULL';
  return `'${value.replace(/'/g, "''")}'`;
}

export function sqlValue(value: string | number | null): string {
  if (value === null) return 'NULL';
  if (typeof value === 'number') return String(value);
  return sqlString(value);
}

const CMS_TOUR_COLUMNS: (keyof CmsTourRow)[] = [
  'id', 'collection', 'status', 'revision', 'published_revision_no', 'slug_locked',
  'title', 'destination', 'category', 'duration', 'availability_label', 'price',
  'currency', 'short_description', 'full_description', 'highlights', 'itinerary',
  'inclusions', 'exclusions', 'notes', 'pickup_info', 'meeting_point',
  'accessibility', 'operating_days', 'child_info', 'accommodation_info',
  'cover_image', 'gallery', 'related_tours', 'map_url', 'display_order',
  'featured', 'seo_title', 'meta_description', 'canonical_path', 'og_image',
  'source_notes', 'created_by', 'updated_by', 'created_at', 'updated_at', 'released_at'
];

const CMS_POST_COLUMNS: (keyof CmsPostRow)[] = [
  'id', 'slug', 'status', 'revision', 'published_revision_no', 'slug_locked',
  'title', 'excerpt', 'author', 'cover_image', 'content', 'tags', 'seo_title',
  'meta_description', 'og_image', 'published_at', 'scheduled_at', 'source_notes',
  'created_by', 'updated_by', 'created_at', 'updated_at', 'released_at'
];

/** Idempotent insert: a re-run sees the conflict and does nothing. */
export function insertTourStatement(row: CmsTourRow): string {
  const values = CMS_TOUR_COLUMNS.map(col => sqlValue(row[col] as string | number | null));
  return (
    `INSERT INTO cms_tours (${CMS_TOUR_COLUMNS.join(', ')}) VALUES (${values.join(', ')})\n` +
    `  ON CONFLICT (id) DO NOTHING;`
  );
}

export function insertPostStatement(row: CmsPostRow): string {
  const values = CMS_POST_COLUMNS.map(col => sqlValue(row[col] as string | number | null));
  return (
    `INSERT INTO cms_posts (${CMS_POST_COLUMNS.join(', ')}) VALUES (${values.join(', ')})\n` +
    `  ON CONFLICT (id) DO NOTHING;`
  );
}

/** One snapshot row per seeded entity so revision history starts at 1. */
export function insertTourRevisionStatement(row: CmsTourRow): string {
  return (
    `INSERT INTO cms_tour_revisions (tour_id, revision_no, snapshot, summary, actor, created_at)\n` +
    `SELECT id, revision, json_object(${CMS_TOUR_COLUMNS.map(c => `'${c}', ${c}`).join(', ')}),\n` +
    `  'Seeded from static catalog', ${sqlString(row.created_by)}, ${sqlString(row.created_at)}\n` +
    `FROM cms_tours WHERE id = ${sqlString(row.id)}\n` +
    `  AND NOT EXISTS (SELECT 1 FROM cms_tour_revisions WHERE tour_id = ${sqlString(row.id)} AND revision_no = 1);`
  );
}

export function insertPostRevisionStatement(row: CmsPostRow): string {
  return (
    `INSERT INTO cms_post_revisions (post_id, revision_no, snapshot, summary, actor, created_at)\n` +
    `SELECT id, revision, json_object(${CMS_POST_COLUMNS.map(c => `'${c}', ${c}`).join(', ')}),\n` +
    `  'Seeded from static catalog', ${sqlString(row.created_by)}, ${sqlString(row.created_at)}\n` +
    `FROM cms_posts WHERE id = ${sqlString(row.id)}\n` +
    `  AND NOT EXISTS (SELECT 1 FROM cms_post_revisions WHERE post_id = ${sqlString(row.id)} AND revision_no = 1);`
  );
}

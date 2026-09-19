-- Phase 10: private CMS / administration schema.
--
-- Every content table carries `revision` for optimistic concurrency: updates
-- must name the revision they read, and a stale writer loses instead of
-- silently overwriting a colleague's change. Content is never hard-deleted —
-- `status = 'archived'` is the terminal state, and every mutation appends a
-- full snapshot to the matching *_revisions table plus a row in
-- admin_audit_log.
--
-- Rollback: DROP TABLE admin_audit_log, media_assets, inquiry_notes,
-- quotation_status_history, quotation_revisions, quotations,
-- cms_post_revisions, cms_posts, cms_tour_revisions, cms_tours, cms_redirects,
-- cms_release_jobs; then ALTER TABLE bookings DROP COLUMN assigned_to
-- (SQLite >= 3.35 supports DROP COLUMN; otherwise rebuild the table without
-- it — the column is nullable and unused by older workers).

-- ---------------------------------------------------------------------------
-- Tours / trips
-- ---------------------------------------------------------------------------
CREATE TABLE cms_tours (
  id TEXT PRIMARY KEY,                    -- stable public id (URL slug)
  collection TEXT NOT NULL DEFAULT 'package'
    CHECK (collection IN ('package', 'day_tour')),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  revision INTEGER NOT NULL DEFAULT 1,    -- optimistic-concurrency counter
  published_revision_no INTEGER,          -- revision approved for release/export
  slug_locked INTEGER NOT NULL DEFAULT 0, -- 1 once first published
  title TEXT NOT NULL,
  destination TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'cultural',
  duration TEXT NOT NULL DEFAULT '',
  availability_label TEXT NOT NULL DEFAULT '',
  price REAL,
  currency TEXT NOT NULL DEFAULT 'USD',
  short_description TEXT NOT NULL DEFAULT '',
  full_description TEXT NOT NULL DEFAULT '',
  highlights TEXT NOT NULL DEFAULT '[]',  -- JSON array of strings
  itinerary TEXT NOT NULL DEFAULT '[]',   -- JSON array of ItineraryItem
  inclusions TEXT NOT NULL DEFAULT '[]',
  exclusions TEXT NOT NULL DEFAULT '[]',
  notes TEXT NOT NULL DEFAULT '',         -- general practical notes
  pickup_info TEXT NOT NULL DEFAULT '',
  meeting_point TEXT NOT NULL DEFAULT '',
  accessibility TEXT NOT NULL DEFAULT '',
  operating_days TEXT NOT NULL DEFAULT '',
  child_info TEXT NOT NULL DEFAULT '',
  accommodation_info TEXT NOT NULL DEFAULT '',
  cover_image TEXT NOT NULL DEFAULT '',
  gallery TEXT NOT NULL DEFAULT '[]',
  related_tours TEXT NOT NULL DEFAULT '[]',
  map_url TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  featured INTEGER NOT NULL DEFAULT 0,
  seo_title TEXT NOT NULL DEFAULT '',
  meta_description TEXT NOT NULL DEFAULT '',
  canonical_path TEXT NOT NULL DEFAULT '',
  og_image TEXT NOT NULL DEFAULT '',
  source_notes TEXT NOT NULL DEFAULT '',  -- evidence notes, never public
  created_by TEXT NOT NULL DEFAULT '',
  updated_by TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  released_at TEXT                        -- when last marked ready for export
);
CREATE INDEX idx_cms_tours_status ON cms_tours (status, collection);
CREATE INDEX idx_cms_tours_updated ON cms_tours (updated_at DESC);

CREATE TABLE cms_tour_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tour_id TEXT NOT NULL REFERENCES cms_tours (id),
  revision_no INTEGER NOT NULL,
  snapshot TEXT NOT NULL,                 -- full row JSON at that revision
  summary TEXT NOT NULL DEFAULT '',
  actor TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (tour_id, revision_no)
);
CREATE INDEX idx_cms_tour_revisions ON cms_tour_revisions (tour_id, revision_no DESC);

-- ---------------------------------------------------------------------------
-- Blog posts
-- ---------------------------------------------------------------------------
CREATE TABLE cms_posts (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,              -- public /blog/<slug>
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'scheduled', 'archived')),
  revision INTEGER NOT NULL DEFAULT 1,
  published_revision_no INTEGER,
  slug_locked INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  author TEXT NOT NULL DEFAULT '',
  cover_image TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',       -- project markdown subset
  tags TEXT NOT NULL DEFAULT '[]',
  seo_title TEXT NOT NULL DEFAULT '',
  meta_description TEXT NOT NULL DEFAULT '',
  og_image TEXT NOT NULL DEFAULT '',
  published_at TEXT,
  scheduled_at TEXT,
  source_notes TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL DEFAULT '',
  updated_by TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  released_at TEXT
);
CREATE INDEX idx_cms_posts_status ON cms_posts (status);
CREATE INDEX idx_cms_posts_updated ON cms_posts (updated_at DESC);

CREATE TABLE cms_post_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id TEXT NOT NULL REFERENCES cms_posts (id),
  revision_no INTEGER NOT NULL,
  snapshot TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  actor TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (post_id, revision_no)
);
CREATE INDEX idx_cms_post_revisions ON cms_post_revisions (post_id, revision_no DESC);

-- ---------------------------------------------------------------------------
-- Quotations and reservation-specific policies
-- ---------------------------------------------------------------------------
-- `data` holds the customer-facing quotation fields as JSON; `internal_notes`
-- is stored separately so it can never leak into the rendered document.
-- Once a version has been sent, the sent snapshot is immutable: further edits
-- go through a new `version_no`, which resets the approval cycle.
CREATE TABLE quotations (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,         -- e.g. TQ-20260920-XXXXXXXX
  booking_id TEXT REFERENCES bookings (id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'ready_for_review', 'approved', 'sent', 'accepted',
    'awaiting_payment', 'paid', 'confirmed', 'declined', 'expired', 'cancelled'
  )),
  version_no INTEGER NOT NULL DEFAULT 1,  -- document version shown to customer
  revision INTEGER NOT NULL DEFAULT 1,    -- optimistic-concurrency counter
  sent_version_no INTEGER,                -- version that was actually sent
  data TEXT NOT NULL DEFAULT '{}',        -- customer-facing fields (JSON)
  internal_notes TEXT NOT NULL DEFAULT '',
  policy_version TEXT NOT NULL DEFAULT '',
  sent_at TEXT,
  sent_by TEXT,
  accepted_at TEXT,
  acceptance_method TEXT,
  acceptance_evidence TEXT,
  payment_received_at TEXT,
  confirmed_at TEXT,
  confirmed_by TEXT,
  created_by TEXT NOT NULL DEFAULT '',
  updated_by TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_quotations_status ON quotations (status);
CREATE INDEX idx_quotations_booking ON quotations (booking_id);
CREATE INDEX idx_quotations_updated ON quotations (updated_at DESC);

CREATE TABLE quotation_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quotation_id TEXT NOT NULL REFERENCES quotations (id),
  revision_no INTEGER NOT NULL,
  version_no INTEGER NOT NULL,
  status TEXT NOT NULL,
  snapshot TEXT NOT NULL,                 -- {data, internal_notes, policy_version}
  summary TEXT NOT NULL DEFAULT '',
  actor TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (quotation_id, revision_no)
);
CREATE INDEX idx_quotation_revisions ON quotation_revisions (quotation_id, revision_no DESC);

CREATE TABLE quotation_status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quotation_id TEXT NOT NULL REFERENCES quotations (id),
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  actor TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE INDEX idx_quotation_history ON quotation_status_history (quotation_id, id);

-- ---------------------------------------------------------------------------
-- Inquiry support
-- ---------------------------------------------------------------------------
CREATE TABLE inquiry_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id TEXT NOT NULL REFERENCES bookings (id),
  note TEXT NOT NULL,
  actor TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_inquiry_notes ON inquiry_notes (booking_id, id);

ALTER TABLE bookings ADD COLUMN assigned_to TEXT;

-- ---------------------------------------------------------------------------
-- Media library
-- ---------------------------------------------------------------------------
CREATE TABLE media_assets (
  id TEXT PRIMARY KEY,
  object_key TEXT NOT NULL UNIQUE,        -- safe generated key inside the bucket
  filename TEXT NOT NULL,
  mime TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  alt TEXT NOT NULL,                      -- required at upload time
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_by TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  archived_at TEXT
);
CREATE INDEX idx_media_status ON media_assets (status);

-- ---------------------------------------------------------------------------
-- Slug redirects (published-slug renames)
-- ---------------------------------------------------------------------------
CREATE TABLE cms_redirects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('tour', 'post')),
  entity_id TEXT NOT NULL,
  from_slug TEXT NOT NULL,
  to_slug TEXT NOT NULL,
  actor TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (entity_type, from_slug)
);

-- ---------------------------------------------------------------------------
-- Append-only administrative audit log
-- ---------------------------------------------------------------------------
-- Nothing in the application may UPDATE or DELETE from this table; it is the
-- forensic record. Summaries must never carry secrets, tokens, or full
-- customer payloads.
CREATE TABLE admin_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,                   -- e.g. tour.update, quotation.status
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE INDEX idx_audit_entity ON admin_audit_log (entity_type, entity_id, id);
CREATE INDEX idx_audit_time ON admin_audit_log (created_at DESC);

-- ---------------------------------------------------------------------------
-- Release/export bookkeeping
-- ---------------------------------------------------------------------------
CREATE TABLE cms_release_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL CHECK (kind IN ('seed', 'validate', 'export', 'diff')),
  status TEXT NOT NULL CHECK (status IN ('started', 'succeeded', 'failed')),
  summary TEXT NOT NULL DEFAULT '',
  actor TEXT NOT NULL DEFAULT 'cli',
  created_at TEXT NOT NULL
);

# CMS Data Model

All CMS state lives in Cloudflare D1, created by `migrations/0008_cms_schema.sql`.
Existing `bookings`/`booking_status_history`/`notification_outbox` tables are
untouched except one additive column (`bookings.assigned_to`).

**Rollback:** `DROP TABLE admin_audit_log, media_assets, inquiry_notes,
quotation_status_history, quotation_revisions, quotations,
cms_post_revisions, cms_posts, cms_tour_revisions, cms_tours, cms_redirects,
cms_release_jobs;` then `ALTER TABLE bookings DROP COLUMN assigned_to`
(SQLite ≥ 3.35; the column is nullable so older workers ignore it).

## Tables

### cms_tours

One row per public tour. `id` is the stable public slug (e.g.
`6-days-cairo-luxor-aswan`) — it is the URL and never changes.

Key columns: `collection` (`package`/`day_tour`), `status`
(`draft`/`published`/`archived`), `revision` (optimistic concurrency),
`published_revision_no`, `slug_locked`, all content fields
(`title`, `destination`, `price`, `currency`, `short_description`,
`full_description`, `highlights`, `itinerary`, `inclusions`, `exclusions`,
`notes`, `pickup_info`, `meeting_point`, `accessibility`, `operating_days`,
`child_info`, `accommodation_info`, `cover_image`, `gallery`,
`related_tours`, `map_url`, `display_order`, `featured`), SEO fields
(`seo_title`, `meta_description`, `canonical_path`, `og_image`),
`source_notes`, and audit stamps (`created_by`, `updated_by`, `created_at`,
`updated_at`, `released_at`).

List-typed fields are stored as JSON strings and normalized on write.

### cms_tour_revisions

Append-only snapshots: `(tour_id, revision_no, snapshot, summary, actor,
created_at)`. Every successful mutation writes one row inside the same batch
as the change, so history can never drift from content.

### cms_posts / cms_post_revisions

Same shape for blog posts. `slug` is unique and separate from the internal
`id`; a published post may be renamed only by supplying `redirectFrom`, which
records a `cms_redirects` row for the next export.

### cms_redirects

`(entity_type, entity_id, from_slug, to_slug, actor, created_at)` — preserves
SEO when a published slug is deliberately moved.

### quotations

One row per quotation. `status` follows the state machine in
`src/config/quotation.ts`; `data` is the JSON customer-facing field set
(`QuotationData`); `internal_notes` is stored separately and can never reach
the rendered document. `version_no` increments on `/revise`; `revision`
increments on every content save (concurrency token). Sent documents record
`sent_version_no`, `sent_at`, `sent_by`; acceptance/payment/confirmation
record their own columns.

### quotation_revisions

`(quotation_id, revision_no, version_no, status, snapshot, summary, actor,
created_at)` — the snapshot is what `GET /quotations/:id/document` renders for
sent versions, so the customer document is frozen at send time.

### quotation_status_history

`(quotation_id, from_status, to_status, actor, note, created_at)` — every
transition, in order.

### inquiry_notes

Private operator notes on `bookings`. Never rendered into exports or the
customer PDF.

### media_assets

Metadata for uploaded images: `object_key` (generated server-side), `mime`
(signature-sniffed), dimensions, required `alt`, `status`
(`active`/`archived`). Bytes live in the `MEDIA` R2 binding — emulated
locally by `wrangler dev`.

### admin_audit_log

Append-only: `(actor, action, entity_type, entity_id, summary, created_at)`.
No request bodies, tokens, or secrets are stored.

### cms_release_jobs

Optional bookkeeping for export runs (`status`, `actor`, `summary`,
timestamps). The current export is a local script; the table is there for a
future automated release pipeline.

## Concurrency model

All mutations take `expectedRevision`. The `UPDATE … WHERE id = ? AND
revision = ?` either applies or throws `revision_conflict` — last-writer-wins
is impossible. Status transitions on quotations compare `status` the same
way.

## Deletion model

Nothing is hard-deleted. Tours/posts/quotations move to terminal statuses
(`archived`, `cancelled`, `declined`, `expired`); media is archived and cannot
be archived while referenced; revisions and audit rows are never mutated.

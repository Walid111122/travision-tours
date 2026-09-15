-- Phase 8: prepare for tour-specific quotation and cancellation terms.
--
-- The general inquiry policy is already versioned: migration 0003 added
-- `inquiry_policy_version` and `inquiry_policy_accepted_at`, and the worker writes
-- the version it recorded at submission time.
--
-- The plan also requires a *tour-specific* policy and quotation version, because
-- the final written quotation carries its own cancellation and refund terms.
-- Those terms do not exist yet — they are being drafted with the owner and are
-- pending legal approval. The fields are therefore added here as nullable and are
-- deliberately left unused: nothing reads or writes them, and no version string
-- is invented. They exist so that shipping the real terms later is a data change
-- rather than a schema migration on a live table.
--
-- When the terms are approved:
--   1. Publish them and assign a version identifier (same format as
--      `INQUIRY_POLICY_VERSION`, i.e. an ISO date such as '2026-08-13').
--   2. Have the client send the version it displayed.
--   3. Record it on the booking alongside the acceptance timestamp, and note that
--      both must be written from a single shared constant — see the duplication
--      described in PHASE8_CONTENT_VALIDATION.md §A9.

ALTER TABLE bookings ADD COLUMN quotation_policy_version TEXT;
ALTER TABLE bookings ADD COLUMN quotation_policy_accepted_at TEXT;

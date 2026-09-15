-- Bind each idempotency key to the normalized inquiry that first used it.
-- This prevents a reused key from replaying a reference for different details.

ALTER TABLE bookings ADD COLUMN request_fingerprint TEXT;


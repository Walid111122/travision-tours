-- Phase 3: make booking inquiries reliable.
--
-- 1. Idempotency: a client-supplied submission key with a unique index, so a
--    double-click or a browser retry replays the original booking instead of
--    creating a duplicate.
-- 2. Operator notification outbox: an accepted inquiry is always either
--    notified or visibly queued/failed, never silently lost.
-- 3. Rate limiting: hashed client keys only — no raw IP addresses are stored.
-- 4. Status audit: record which operator changed a booking's status.

ALTER TABLE bookings ADD COLUMN idempotency_key TEXT;

CREATE UNIQUE INDEX idx_bookings_idempotency_key
  ON bookings(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

ALTER TABLE booking_status_history ADD COLUMN actor TEXT;

CREATE TABLE notification_outbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email'
    CHECK (channel IN ('email')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  last_error TEXT,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  next_attempt_at TEXT,
  sent_at TEXT,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

CREATE INDEX idx_notification_outbox_pending
  ON notification_outbox(status, next_attempt_at);

CREATE INDEX idx_notification_outbox_booking
  ON notification_outbox(booking_id);

-- Sliding-window throttle counters.
-- `key_hash` is a salted SHA-256 digest, never a raw address, and rows are
-- purged by the scheduled handler once their window has expired.
CREATE TABLE rate_limit_counters (
  key_hash TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (key_hash, window_start)
);

CREATE INDEX idx_rate_limit_counters_window
  ON rate_limit_counters(window_start);

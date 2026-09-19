PRAGMA foreign_keys = ON;

CREATE TABLE bookings (
  id TEXT PRIMARY KEY NOT NULL,
  reference TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN (
      'new',
      'quoted',
      'awaiting_transfer',
      'payment_verification',
      'confirmed',
      'cancelled'
    )),
  tour_id TEXT NOT NULL,
  tour_title TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_country TEXT,
  preferred_date TEXT NOT NULL,
  travelers INTEGER NOT NULL CHECK (travelers BETWEEN 1 AND 50),
  requirements TEXT,
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency = 'USD'),
  quoted_amount_cents INTEGER CHECK (quoted_amount_cents IS NULL OR quoted_amount_cents >= 0),
  wire_transfer_reference TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE booking_status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id TEXT NOT NULL,
  status TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

CREATE INDEX idx_bookings_status_created
  ON bookings(status, created_at DESC);

CREATE INDEX idx_bookings_customer_email
  ON bookings(customer_email);

CREATE INDEX idx_booking_status_history_booking
  ON booking_status_history(booking_id, created_at DESC);

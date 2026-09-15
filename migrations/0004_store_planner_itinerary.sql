-- Records where an inquiry came from, and stores planner itineraries alongside
-- the booking they belong to.
--
-- A tour inquiry has no itinerary rows. A planner inquiry has one row per
-- selected stop, in the order the customer arranged them. Stop titles and
-- locations are resolved server-side from the shared planner catalog, so the
-- stored values cannot be forged by the client.

ALTER TABLE bookings ADD COLUMN inquiry_source TEXT NOT NULL DEFAULT 'tour';

CREATE TABLE booking_itinerary_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  stop_id TEXT NOT NULL,
  stop_title TEXT NOT NULL,
  stop_location TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

CREATE INDEX idx_booking_itinerary_items_booking
  ON booking_itinerary_items(booking_id, position);

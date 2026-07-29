ALTER TABLE bookings ADD COLUMN departure_date TEXT;
ALTER TABLE bookings ADD COLUMN adults INTEGER NOT NULL DEFAULT 1 CHECK (adults BETWEEN 1 AND 50);
ALTER TABLE bookings ADD COLUMN children INTEGER NOT NULL DEFAULT 0 CHECK (children BETWEEN 0 AND 20);
ALTER TABLE bookings ADD COLUMN child_ages TEXT;
ALTER TABLE bookings ADD COLUMN accommodation_preference TEXT;
ALTER TABLE bookings ADD COLUMN contact_preference TEXT;
ALTER TABLE bookings ADD COLUMN budget_range TEXT;
ALTER TABLE bookings ADD COLUMN referral_source TEXT;

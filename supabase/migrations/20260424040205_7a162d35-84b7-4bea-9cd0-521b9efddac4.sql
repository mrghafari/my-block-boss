-- Add exclusive flag to venues (no overlap allowed)
ALTER TABLE public.reservation_venues
  ADD COLUMN IF NOT EXISTS exclusive boolean NOT NULL DEFAULT false;

-- Add full-day exclusive booking flag to reservations
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS is_exclusive boolean NOT NULL DEFAULT false;
-- Add new columns to units table
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS resident_count integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS resident_name text,
ADD COLUMN IF NOT EXISTS resident_phone text,
ADD COLUMN IF NOT EXISTS landline_phone text;
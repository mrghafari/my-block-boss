
-- Make unit_id nullable in managers table to support external managers
ALTER TABLE public.managers ALTER COLUMN unit_id DROP NOT NULL;

-- Add external manager fields
ALTER TABLE public.managers ADD COLUMN IF NOT EXISTS external_name text;

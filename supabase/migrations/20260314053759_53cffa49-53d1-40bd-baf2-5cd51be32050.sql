
ALTER TABLE public.buildings ALTER COLUMN default_charge_amount SET DEFAULT 500000;
ALTER TABLE public.buildings ALTER COLUMN default_extra_charge_amount SET DEFAULT 200000;

-- Update existing buildings that have 0 to the new defaults
UPDATE public.buildings SET default_charge_amount = 500000 WHERE default_charge_amount = 0;
UPDATE public.buildings SET default_extra_charge_amount = 200000 WHERE default_extra_charge_amount = 0;

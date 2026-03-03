
-- 1. Create buildings table
CREATE TABLE public.buildings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  total_units INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view buildings" ON public.buildings FOR SELECT USING (true);
CREATE POLICY "Anyone can insert buildings" ON public.buildings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update buildings" ON public.buildings FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete buildings" ON public.buildings FOR DELETE USING (true);

-- 2. Create a default building and get its ID for migration
INSERT INTO public.buildings (id, name, address) 
VALUES ('00000000-0000-0000-0000-000000000001', 'ساختمان پیش‌فرض', 'آدرس پیش‌فرض');

-- 3. Add building_id to units
ALTER TABLE public.units ADD COLUMN building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE;
UPDATE public.units SET building_id = '00000000-0000-0000-0000-000000000001';
ALTER TABLE public.units ALTER COLUMN building_id SET NOT NULL;

-- 4. Add building_id to expenses
ALTER TABLE public.expenses ADD COLUMN building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE;
UPDATE public.expenses SET building_id = '00000000-0000-0000-0000-000000000001';
ALTER TABLE public.expenses ALTER COLUMN building_id SET NOT NULL;

-- 5. Add building_id to payments
ALTER TABLE public.payments ADD COLUMN building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE;
UPDATE public.payments SET building_id = '00000000-0000-0000-0000-000000000001';
ALTER TABLE public.payments ALTER COLUMN building_id SET NOT NULL;

-- 6. Add building_id to managers
ALTER TABLE public.managers ADD COLUMN building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE;
UPDATE public.managers SET building_id = '00000000-0000-0000-0000-000000000001';
ALTER TABLE public.managers ALTER COLUMN building_id SET NOT NULL;

-- 7. Add building_id to category_allocation_settings
ALTER TABLE public.category_allocation_settings ADD COLUMN building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE;
UPDATE public.category_allocation_settings SET building_id = '00000000-0000-0000-0000-000000000001';
ALTER TABLE public.category_allocation_settings ALTER COLUMN building_id SET NOT NULL;

-- 8. Add building_id to expense_categories
ALTER TABLE public.expense_categories ADD COLUMN building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE;
UPDATE public.expense_categories SET building_id = '00000000-0000-0000-0000-000000000001';
ALTER TABLE public.expense_categories ALTER COLUMN building_id SET NOT NULL;

-- 9. Add indexes for performance
CREATE INDEX idx_units_building ON public.units(building_id);
CREATE INDEX idx_expenses_building ON public.expenses(building_id);
CREATE INDEX idx_payments_building ON public.payments(building_id);
CREATE INDEX idx_managers_building ON public.managers(building_id);

-- 10. Trigger for updated_at on buildings
CREATE TRIGGER update_buildings_updated_at
BEFORE UPDATE ON public.buildings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

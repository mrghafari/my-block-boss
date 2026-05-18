-- Storages
CREATE TABLE public.unit_storages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL,
  unit_id uuid NOT NULL,
  storage_number text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_unit_storages_unit ON public.unit_storages(unit_id);
CREATE INDEX idx_unit_storages_building ON public.unit_storages(building_id);
ALTER TABLE public.unit_storages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view unit storages" ON public.unit_storages
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR is_building_member(auth.uid(), building_id));
CREATE POLICY "Managers can insert unit storages" ON public.unit_storages
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR is_building_manager(auth.uid(), building_id));
CREATE POLICY "Managers can update unit storages" ON public.unit_storages
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR is_building_manager(auth.uid(), building_id));
CREATE POLICY "Managers can delete unit storages" ON public.unit_storages
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR is_building_manager(auth.uid(), building_id));

CREATE TRIGGER trg_unit_storages_updated_at
BEFORE UPDATE ON public.unit_storages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Vehicles (Iranian plate: 12 ب 345 - 67)
CREATE TABLE public.unit_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL,
  unit_id uuid NOT NULL,
  plate_part1 text NOT NULL,        -- 2 digits
  plate_letter text NOT NULL,       -- 1 Persian letter
  plate_part2 text NOT NULL,        -- 3 digits
  plate_city text NOT NULL,         -- 2-digit city code
  description text,                 -- e.g. car model/color
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_unit_vehicles_unit ON public.unit_vehicles(unit_id);
CREATE INDEX idx_unit_vehicles_building ON public.unit_vehicles(building_id);
ALTER TABLE public.unit_vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view unit vehicles" ON public.unit_vehicles
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR is_building_member(auth.uid(), building_id));
CREATE POLICY "Managers can insert unit vehicles" ON public.unit_vehicles
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR is_building_manager(auth.uid(), building_id));
CREATE POLICY "Managers can update unit vehicles" ON public.unit_vehicles
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR is_building_manager(auth.uid(), building_id));
CREATE POLICY "Managers can delete unit vehicles" ON public.unit_vehicles
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR is_building_manager(auth.uid(), building_id));

CREATE TRIGGER trg_unit_vehicles_updated_at
BEFORE UPDATE ON public.unit_vehicles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
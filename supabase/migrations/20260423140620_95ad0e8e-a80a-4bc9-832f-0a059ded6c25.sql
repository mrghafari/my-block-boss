DROP INDEX IF EXISTS public.unique_active_manager_per_building;
DROP INDEX IF EXISTS public.unique_active_manager_per_unit;

CREATE UNIQUE INDEX unique_active_manager_per_role
ON public.managers (building_id, role_id)
WHERE (is_active = true AND role_id IS NOT NULL);
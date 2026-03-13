
-- Deactivate older duplicate active managers, keeping only the latest per building
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY building_id ORDER BY start_date DESC, created_at DESC) AS rn
  FROM public.managers
  WHERE is_active = true
)
UPDATE public.managers SET is_active = false
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- Now create the unique constraint
CREATE UNIQUE INDEX unique_active_manager_per_building 
ON public.managers (building_id) 
WHERE (is_active = true);

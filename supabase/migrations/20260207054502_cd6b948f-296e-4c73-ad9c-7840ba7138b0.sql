-- Drop the old trigger and function
DROP TRIGGER IF EXISTS create_allocation_settings_on_category_insert ON public.expense_categories;
DROP FUNCTION IF EXISTS public.create_default_allocation_settings();

-- Create updated function that handles both category and category_id
CREATE OR REPLACE FUNCTION public.create_default_allocation_settings()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.category_allocation_settings (category_id, category, allowed_allocation_types, default_allocation_type)
  VALUES (NEW.id, 'other'::expense_category, ARRAY['equal', 'by_area', 'by_residents', 'by_area_residents', 'single_unit']::public.allocation_type[], 'equal');
  RETURN NEW;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER create_allocation_settings_on_category_insert
  AFTER INSERT ON public.expense_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_allocation_settings();
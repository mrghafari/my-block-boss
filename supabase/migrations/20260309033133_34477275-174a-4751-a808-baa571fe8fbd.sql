
CREATE OR REPLACE FUNCTION public.handle_new_building()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Don't auto-assign super admins as building managers
  IF NOT public.has_role(auth.uid(), 'super_admin'::app_role) THEN
    INSERT INTO public.building_members (user_id, building_id, role)
    VALUES (auth.uid(), NEW.id, 'manager');
  END IF;
  RETURN NEW;
END;
$function$;

DROP FUNCTION IF EXISTS public.get_admin_buildings();

CREATE OR REPLACE FUNCTION public.get_admin_buildings()
 RETURNS TABLE(id uuid, name text, address text, total_units bigint, manager_name text, manager_email text, manager_phone text, manager_user_id uuid, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    b.id,
    b.name,
    b.address,
    (SELECT COUNT(*) FROM public.units u WHERE u.building_id = b.id) as total_units,
    p.full_name as manager_name,
    au.email::text as manager_email,
    p.phone as manager_phone,
    bm.user_id as manager_user_id,
    b.created_at
  FROM public.buildings b
  LEFT JOIN public.building_members bm ON bm.building_id = b.id AND bm.role = 'manager'
  LEFT JOIN public.profiles p ON p.user_id = bm.user_id
  LEFT JOIN auth.users au ON au.id = bm.user_id
  WHERE public.has_role(auth.uid(), 'super_admin'::app_role)
  ORDER BY b.created_at DESC
$function$;

CREATE OR REPLACE FUNCTION public.admin_lookup_user(_query text)
 RETURNS TABLE(user_id uuid, email text, full_name text, phone text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT p.user_id, au.email::text, p.full_name, p.phone
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.user_id
  WHERE public.has_role(auth.uid(), 'super_admin'::app_role)
    AND (
      p.phone ILIKE '%' || _query || '%'
      OR au.email::text ILIKE '%' || _query || '%'
      OR p.full_name ILIKE '%' || _query || '%'
    )
  LIMIT 20
$function$;

CREATE OR REPLACE FUNCTION public.admin_reassign_building(_building_id uuid, _new_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _old_user_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT user_id INTO _old_user_id
  FROM public.building_members
  WHERE building_id = _building_id AND role = 'manager'
  LIMIT 1;

  INSERT INTO public.building_members (user_id, building_id, role)
  VALUES (_new_user_id, _building_id, 'manager')
  ON CONFLICT (user_id, building_id) DO UPDATE SET role = 'manager';

  IF _old_user_id IS NOT NULL AND _old_user_id <> _new_user_id THEN
    DELETE FROM public.building_members
    WHERE building_id = _building_id
      AND role = 'manager'
      AND user_id = _old_user_id;
  END IF;
END;
$function$;
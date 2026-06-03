UPDATE public.managers
SET mobile = external_name
WHERE (mobile IS NULL OR mobile = '')
  AND external_name ~ '^09[0-9]{9}$';

UPDATE public.profiles
SET phone = full_name
WHERE (phone IS NULL OR phone = '')
  AND full_name ~ '^09[0-9]{9}$';

CREATE OR REPLACE FUNCTION public.auto_register_initial_manager()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _main_role_id uuid;
  _full_name text;
  _phone text;
  _email text;
  _display_name text;
BEGIN
  IF public.has_role(auth.uid(), 'super_admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT id INTO _main_role_id
  FROM public.manager_roles
  WHERE building_id = NEW.id AND name = 'main'
  LIMIT 1;

  IF _main_role_id IS NULL THEN
    INSERT INTO public.manager_roles (building_id, name, label, is_system, sort_order)
    VALUES (NEW.id, 'main', 'مدیر اصلی', true, 1)
    RETURNING id INTO _main_role_id;
  END IF;

  SELECT full_name, phone INTO _full_name, _phone
  FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;

  IF _phone IS NULL OR _phone = '' THEN
    SELECT email INTO _email FROM auth.users WHERE id = auth.uid() LIMIT 1;
    IF _email IS NOT NULL AND _email ~ '^09[0-9]{9}@resident\.local$' THEN
      _phone := split_part(_email, '@', 1);
      UPDATE public.profiles SET phone = _phone WHERE user_id = auth.uid() AND (phone IS NULL OR phone = '');
    END IF;
  END IF;

  _display_name := COALESCE(NULLIF(_full_name, ''), NULLIF(_phone, ''), 'مدیر');

  IF EXISTS (
    SELECT 1 FROM public.managers
    WHERE building_id = NEW.id AND role_id = _main_role_id AND is_active = true
  ) THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.managers (
    building_id, role_id, role_type, external_name, mobile, email,
    start_date, is_active, charge_discount_percent, extra_charge_discount_percent
  )
  VALUES (
    NEW.id, _main_role_id, 'external', _display_name,
    NULLIF(_phone, ''), NULL,
    CURRENT_DATE, true, 0, 0
  );

  RETURN NEW;
END;
$function$;
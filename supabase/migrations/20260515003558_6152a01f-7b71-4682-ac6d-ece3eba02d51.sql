-- Convert linked managers back to external when their unit/phone link is broken
CREATE OR REPLACE FUNCTION public.revert_manager_to_external_on_unit_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Owner phone removed or changed: revert owner-linked managers whose mobile no longer matches
  IF TG_OP = 'UPDATE' AND COALESCE(OLD.phone,'') IS DISTINCT FROM COALESCE(NEW.phone,'') THEN
    UPDATE public.managers m
    SET role_type = 'external',
        unit_id = NULL,
        external_name = COALESCE(NULLIF(OLD.owner_name,''), m.external_name, m.mobile, 'مدیر'),
        updated_at = now()
    WHERE m.unit_id = NEW.id
      AND m.role_type = 'owner'
      AND COALESCE(m.mobile,'') = COALESCE(OLD.phone,'')
      AND COALESCE(m.mobile,'') <> COALESCE(NEW.phone,'');
  END IF;

  -- Resident phone removed or changed
  IF TG_OP = 'UPDATE' AND COALESCE(OLD.resident_phone,'') IS DISTINCT FROM COALESCE(NEW.resident_phone,'') THEN
    UPDATE public.managers m
    SET role_type = 'external',
        unit_id = NULL,
        external_name = COALESCE(NULLIF(OLD.resident_name,''), NULLIF(OLD.owner_name,''), m.external_name, m.mobile, 'مدیر'),
        updated_at = now()
    WHERE m.unit_id = NEW.id
      AND m.role_type = 'resident'
      AND COALESCE(m.mobile,'') = COALESCE(OLD.resident_phone,'')
      AND COALESCE(m.mobile,'') <> COALESCE(NEW.resident_phone,'');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_revert_manager_to_external_on_unit_change ON public.units;
CREATE TRIGGER trg_revert_manager_to_external_on_unit_change
BEFORE UPDATE OF phone, resident_phone ON public.units
FOR EACH ROW
EXECUTE FUNCTION public.revert_manager_to_external_on_unit_change();

-- When a unit is deleted, revert all its linked managers to external (keep them active)
CREATE OR REPLACE FUNCTION public.revert_managers_on_unit_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.managers m
  SET role_type = 'external',
      unit_id = NULL,
      external_name = COALESCE(
        m.external_name,
        CASE WHEN m.role_type = 'owner' THEN NULLIF(OLD.owner_name,'')
             ELSE COALESCE(NULLIF(OLD.resident_name,''), NULLIF(OLD.owner_name,''))
        END,
        m.mobile,
        'مدیر'
      ),
      updated_at = now()
  WHERE m.unit_id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_revert_managers_on_unit_delete ON public.units;
CREATE TRIGGER trg_revert_managers_on_unit_delete
BEFORE DELETE ON public.units
FOR EACH ROW
EXECUTE FUNCTION public.revert_managers_on_unit_delete();
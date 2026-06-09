
CREATE TABLE public.manager_transfer_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES public.manager_roles(id) ON DELETE CASCADE,
  new_manager_id uuid NOT NULL REFERENCES public.managers(id) ON DELETE CASCADE,
  recipient_phone text NOT NULL,
  effective_date date NOT NULL DEFAULT CURRENT_DATE,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  attempts int NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.manager_transfer_otps TO authenticated;
GRANT ALL ON public.manager_transfer_otps TO service_role;

ALTER TABLE public.manager_transfer_otps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers manage transfer otps for their building"
  ON public.manager_transfer_otps
  FOR ALL
  TO authenticated
  USING (
    public.is_building_manager(auth.uid(), building_id)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  )
  WITH CHECK (
    public.is_building_manager(auth.uid(), building_id)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE INDEX idx_manager_transfer_otps_lookup
  ON public.manager_transfer_otps (building_id, role_id, expires_at);

CREATE OR REPLACE FUNCTION public.consume_manager_transfer_otp(_otp_id uuid, _code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _otp record;
BEGIN
  SELECT * INTO _otp FROM public.manager_transfer_otps WHERE id = _otp_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'کد نامعتبر است';
  END IF;

  IF NOT (public.is_building_manager(auth.uid(), _otp.building_id)
          OR public.has_role(auth.uid(), 'super_admin'::app_role)) THEN
    RAISE EXCEPTION 'دسترسی غیرمجاز';
  END IF;

  IF _otp.used_at IS NOT NULL THEN
    RAISE EXCEPTION 'این کد قبلاً استفاده شده است';
  END IF;

  IF _otp.expires_at < now() THEN
    RAISE EXCEPTION 'کد منقضی شده است';
  END IF;

  IF _otp.attempts >= 5 THEN
    RAISE EXCEPTION 'تعداد تلاش‌های مجاز به پایان رسیده است';
  END IF;

  IF _otp.code <> _code THEN
    UPDATE public.manager_transfer_otps
      SET attempts = attempts + 1
      WHERE id = _otp_id;
    RAISE EXCEPTION 'کد وارد شده اشتباه است';
  END IF;

  -- Perform transfer: deactivate other active managers in this role, activate new one
  UPDATE public.managers
    SET is_active = false, end_date = _otp.effective_date
    WHERE building_id = _otp.building_id
      AND role_id = _otp.role_id
      AND is_active = true
      AND id <> _otp.new_manager_id;

  UPDATE public.managers
    SET is_active = true,
        role_id = _otp.role_id,
        start_date = _otp.effective_date,
        end_date = NULL
    WHERE id = _otp.new_manager_id;

  UPDATE public.manager_transfer_otps
    SET used_at = now()
    WHERE id = _otp_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_manager_transfer_otp(uuid, text) TO authenticated;

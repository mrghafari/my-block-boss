-- Create building bank accounts table
CREATE TABLE public.building_bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  building_id UUID NOT NULL,
  iban TEXT NOT NULL,
  account_holder TEXT NOT NULL,
  bank_name TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT false,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  admin_notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.building_bank_accounts ENABLE ROW LEVEL SECURITY;

-- Members can view bank accounts of their building
CREATE POLICY "Members can view bank accounts"
ON public.building_bank_accounts
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role) OR is_building_member(auth.uid(), building_id));

-- Managers can insert bank accounts (they will start unapproved)
CREATE POLICY "Managers can insert bank accounts"
ON public.building_bank_accounts
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR is_building_manager(auth.uid(), building_id));

-- Managers can update only non-approval fields; super admins can update everything
CREATE POLICY "Managers can update their bank accounts"
ON public.building_bank_accounts
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role) OR is_building_manager(auth.uid(), building_id));

-- Managers can delete their bank accounts
CREATE POLICY "Managers can delete bank accounts"
ON public.building_bank_accounts
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role) OR is_building_manager(auth.uid(), building_id));

-- Trigger to update updated_at
CREATE TRIGGER update_building_bank_accounts_updated_at
BEFORE UPDATE ON public.building_bank_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to prevent non-admins from approving
CREATE OR REPLACE FUNCTION public.protect_bank_account_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If approval status is changing and user is not super admin, block it
  IF (OLD.is_approved IS DISTINCT FROM NEW.is_approved 
      OR OLD.approved_at IS DISTINCT FROM NEW.approved_at 
      OR OLD.approved_by IS DISTINCT FROM NEW.approved_by
      OR OLD.admin_notes IS DISTINCT FROM NEW.admin_notes)
     AND NOT has_role(auth.uid(), 'super_admin'::app_role) THEN
    NEW.is_approved := OLD.is_approved;
    NEW.approved_at := OLD.approved_at;
    NEW.approved_by := OLD.approved_by;
    NEW.admin_notes := OLD.admin_notes;
  END IF;
  
  -- Only one active account per building
  IF NEW.is_active = true AND NEW.is_approved = true THEN
    UPDATE public.building_bank_accounts
    SET is_active = false
    WHERE building_id = NEW.building_id
      AND id <> NEW.id
      AND is_active = true;
  END IF;
  
  -- Cannot be active if not approved
  IF NEW.is_active = true AND NEW.is_approved = false THEN
    NEW.is_active := false;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_bank_account_approval_trigger
BEFORE UPDATE ON public.building_bank_accounts
FOR EACH ROW
EXECUTE FUNCTION public.protect_bank_account_approval();

CREATE INDEX idx_building_bank_accounts_building ON public.building_bank_accounts(building_id);
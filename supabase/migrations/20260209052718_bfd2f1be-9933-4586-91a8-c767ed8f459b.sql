-- Create managers table
CREATE TABLE public.managers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  role_type TEXT NOT NULL CHECK (role_type IN ('owner', 'resident')),
  mobile TEXT,
  email TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  charge_discount_percent INTEGER NOT NULL DEFAULT 0 CHECK (charge_discount_percent >= 0 AND charge_discount_percent <= 100),
  extra_charge_discount_percent INTEGER NOT NULL DEFAULT 0 CHECK (extra_charge_discount_percent >= 0 AND extra_charge_discount_percent <= 100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.managers ENABLE ROW LEVEL SECURITY;

-- Public access policies (as per previous requirements)
CREATE POLICY "Anyone can view managers"
  ON public.managers FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert managers"
  ON public.managers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update managers"
  ON public.managers FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete managers"
  ON public.managers FOR DELETE
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_managers_updated_at
  BEFORE UPDATE ON public.managers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
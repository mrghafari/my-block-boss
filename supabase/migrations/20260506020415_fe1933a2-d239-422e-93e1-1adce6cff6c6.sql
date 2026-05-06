
-- Fix #1: Prevent privilege escalation on profiles via WITH CHECK
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND subscription_plan = (SELECT subscription_plan FROM public.profiles WHERE user_id = auth.uid())
  AND max_buildings = (SELECT max_buildings FROM public.profiles WHERE user_id = auth.uid())
  AND max_units_per_building = (SELECT max_units_per_building FROM public.profiles WHERE user_id = auth.uid())
  AND is_blocked = (SELECT is_blocked FROM public.profiles WHERE user_id = auth.uid())
);

-- Allow super admins to update any profile fields (e.g., subscription, blocking)
CREATE POLICY "Super admins can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Fix #2: Restrict buildings INSERT — block creation by blocked users
DROP POLICY IF EXISTS "Authenticated users can create buildings" ON public.buildings;

CREATE POLICY "Authenticated users can create buildings"
ON public.buildings
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND is_blocked = true
  )
);

ALTER TABLE public.managers
DROP CONSTRAINT IF EXISTS managers_role_type_check;

ALTER TABLE public.managers
ADD CONSTRAINT managers_role_type_check
CHECK (role_type = ANY (ARRAY['owner'::text, 'resident'::text, 'external'::text]));
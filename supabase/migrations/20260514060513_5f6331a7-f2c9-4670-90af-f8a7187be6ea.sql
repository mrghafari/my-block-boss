
ALTER TABLE public.building_rules
  ADD COLUMN IF NOT EXISTS pdf_path text,
  ADD COLUMN IF NOT EXISTS pdf_name text;

ALTER TABLE public.building_rules ALTER COLUMN content SET DEFAULT '';
ALTER TABLE public.building_rules ALTER COLUMN content DROP NOT NULL;

INSERT INTO storage.buckets (id, name, public) VALUES ('building-rules', 'building-rules', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Members view building rules pdf"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'building-rules'
  AND (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.is_building_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
  )
);

CREATE POLICY "Managers upload building rules pdf"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'building-rules'
  AND (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.is_building_manager(auth.uid(), ((storage.foldername(name))[1])::uuid)
  )
);

CREATE POLICY "Managers update building rules pdf"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'building-rules'
  AND (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.is_building_manager(auth.uid(), ((storage.foldername(name))[1])::uuid)
  )
);

CREATE POLICY "Managers delete building rules pdf"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'building-rules'
  AND (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.is_building_manager(auth.uid(), ((storage.foldername(name))[1])::uuid)
  )
);

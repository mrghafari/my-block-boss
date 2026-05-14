-- Add person_type column to support per-person (owner/resident) access blocks
ALTER TABLE public.unit_document_access_blocks
  ADD COLUMN IF NOT EXISTS person_type text NOT NULL DEFAULT 'both'
    CHECK (person_type IN ('owner', 'resident', 'both'));

-- Replace old unique constraint (unit-wide) with one that includes person_type
ALTER TABLE public.unit_document_access_blocks
  DROP CONSTRAINT IF EXISTS unit_document_access_blocks_building_id_unit_id_key;

ALTER TABLE public.unit_document_access_blocks
  ADD CONSTRAINT unit_document_access_blocks_unique_per_person
    UNIQUE (building_id, unit_id, person_type);
-- MIGRATION: Update property_metadata table structure for full sync capability
-- Run this in Supabase SQL Editor to prepare the table for syncPropertiesFromInmovillaAction

-- Step 1: Add new columns if they don't exist
ALTER TABLE property_metadata 
ADD COLUMN IF NOT EXISTS tipo VARCHAR(255) DEFAULT 'Property',
ADD COLUMN IF NOT EXISTS precio DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS poblacion VARCHAR(255),
ADD COLUMN IF NOT EXISTS descriptions JSONB DEFAULT '{
  "description_es": "",
  "description_en": "",
  "description_fr": "",
  "description_de": "",
  "description_it": "",
  "description_pl": ""
}'::jsonb,
ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS main_photo TEXT,
ADD COLUMN IF NOT EXISTS full_data JSONB,
ADD COLUMN IF NOT EXISTS nodisponible BOOLEAN DEFAULT false;

-- Step 2: Update updated_at timestamp format (if needed)
ALTER TABLE property_metadata 
ALTER COLUMN updated_at SET DEFAULT now();

-- Step 3: Verify table structure
-- Run this query to confirm all columns exist:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'property_metadata' 
-- ORDER BY ordinal_position;

-- Step 4: (OPTIONAL) Migrate old 'description' data to 'descriptions' JSONB
-- Uncomment if you have data in the old 'description' column:
/*
UPDATE property_metadata
SET descriptions = jsonb_set(
  descriptions,
  '{description_es}',
  to_jsonb(COALESCE(description, ''))
)
WHERE description IS NOT NULL;

-- Then drop the old description column if desired:
ALTER TABLE property_metadata DROP COLUMN IF EXISTS description;
*/

-- RESULT: property_metadata now ready to receive synced data from Inmovilla
-- Columns: cod_ofer, ref, tipo, precio, poblacion, descriptions (JSONB), photos (array), main_photo, full_data, nodisponible, updated_at

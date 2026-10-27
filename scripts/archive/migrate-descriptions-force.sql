-- Force migrate: Copy descriptions text column to descriptions jsonb
-- This overwrites the descriptions column completely with the text values

-- First, show what we're about to change
SELECT 
  cod_ofer,
  ref,
  SUBSTRING(description, 1, 50) as description_preview,
  descriptions as current_json
FROM property_metadata
WHERE description IS NOT NULL
LIMIT 5;

-- Now update: Replace descriptions JSON with data from description column
UPDATE property_metadata
SET descriptions = jsonb_build_object(
  'description_es', description,
  'description_en', '',
  'description_fr', '',
  'description_de', '',
  'description_it', '',
  'description_pl', ''
)
WHERE description IS NOT NULL;

-- Verify the update
SELECT COUNT(*) as total_updated FROM property_metadata WHERE descriptions->>'description_es' != '';

-- Show some examples of the migrated data
SELECT 
  cod_ofer,
  ref,
  SUBSTRING(descriptions->>'description_es', 1, 80) as es_description,
  descriptions
FROM property_metadata
WHERE descriptions->>'description_es' != ''
LIMIT 10;

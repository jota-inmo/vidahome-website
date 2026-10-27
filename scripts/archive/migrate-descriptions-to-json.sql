-- Migrate descriptions from text column to jsonb column
-- This script moves data from property_metadata.description (text) to property_metadata.descriptions (jsonb)

BEGIN;

-- Update descriptions jsonb column with data from description text column
UPDATE property_metadata
SET descriptions = CASE 
  WHEN description IS NOT NULL THEN 
    jsonb_build_object('description_es', description)
  ELSE 
    descriptions
END,
updated_at = NOW()
WHERE description IS NOT NULL 
  AND (descriptions IS NULL 
       OR descriptions->>'description_es' IS NULL);

-- Log the migration
SELECT 
  COUNT(*) as migrated_rows,
  COUNT(CASE WHEN descriptions->>'description_es' IS NOT NULL THEN 1 END) as rows_with_es_description
FROM property_metadata
WHERE description IS NOT NULL;

COMMIT;

-- Verify: Check a sample of migrated data
SELECT 
  cod_ofer,
  ref,
  description,
  descriptions->>'description_es' as description_es_from_json,
  updated_at
FROM property_metadata
WHERE descriptions->>'description_es' IS NOT NULL
LIMIT 10;

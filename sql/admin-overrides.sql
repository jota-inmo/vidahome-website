-- Add admin_overrides column to property_metadata
-- This JSONB column stores manual edits from admin that persist over Inmovilla sync
-- Example: {"precio": 259900, "tipo": "Villa", "poblacion": "Bélgida"}

ALTER TABLE property_metadata 
ADD COLUMN IF NOT EXISTS admin_overrides JSONB DEFAULT '{}'::jsonb;

-- Grant access
GRANT ALL ON property_metadata TO authenticated;
GRANT ALL ON property_metadata TO service_role;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

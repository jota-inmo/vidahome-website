-- Fix property_metadata: Update full_data with correct tipo_nombre from the tipo column

UPDATE property_metadata
SET full_data = jsonb_set(
    COALESCE(full_data, '{}'::jsonb),
    '{tipo_nombre}',
    to_jsonb(tipo)
)
WHERE tipo IS NOT NULL
  AND tipo != ''
  AND (
    -- Update if full_data is null/empty, OR
    full_data IS NULL
    OR full_data = '{}'::jsonb
    OR COALESCE(full_data->>'tipo_nombre', '') = ''
    OR full_data->>'tipo_nombre' = 'Property'
  );

-- Verify the changes
SELECT 
    cod_ofer,
    ref,
    tipo,
    full_data->>'tipo_nombre' as tipo_nombre_from_full_data,
    poblacion
FROM property_metadata
WHERE nodisponible = false
LIMIT 15;

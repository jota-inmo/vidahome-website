-- Inspeccionaré qué claves tiene full_data

-- 1. Ver estructura de full_data para una propiedad
SELECT 
  cod_ofer,
  ref,
  tipo,
  poblacion,
  jsonb_object_keys(full_data) as full_data_keys
FROM property_metadata
WHERE cod_ofer = 26286553
LIMIT 1;

-- 2. Ver valores específicos de full_data para algunas propiedades
SELECT 
  cod_ofer,
  ref,
  tipo,
  poblacion,
  full_data->>'tipo_nombre' as fd_tipo_nombre,
  full_data->>'tipo' as fd_tipo,
  full_data->>'poblacion' as fd_poblacion,
  full_data->>'municipio' as fd_municipio
FROM property_metadata
WHERE cod_ofer IN (26286553, 26286557, 26286558)
ORDER BY cod_ofer;

-- 3. Contar valores NULL en las columnas
SELECT
  COUNT(*) FILTER (WHERE tipo IS NULL OR tipo = '') as sin_tipo,
  COUNT(*) FILTER (WHERE poblacion IS NULL OR poblacion = '') as sin_poblacion,
  COUNT(*) as total
FROM property_metadata;

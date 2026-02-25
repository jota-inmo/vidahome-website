-- ============================================================
-- Sincronizar columnas property_metadata desde full_data
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Actualizar columnas principales de property_metadata
UPDATE property_metadata
SET
  precio    = NULLIF((full_data->>'precioinmo'), '')::numeric,
  tipo      = COALESCE(
                NULLIF(full_data->>'tipo_nombre', ''),
                NULLIF(full_data->>'tipo', '')
              ),
  poblacion = COALESCE(
                NULLIF(full_data->>'poblacion', ''),
                NULLIF(full_data->>'municipio', '')
              )
WHERE full_data IS NOT NULL;

-- Resultado esperado: ~78 filas actualizadas

-- ============================================================
-- 2. Actualizar property_features desde full_data
--    Solo rellena valores NULL (no sobreescribe datos existentes)
-- ============================================================

-- Crear filas en property_features para propiedades que no las tienen
INSERT INTO property_features (cod_ofer)
SELECT m.cod_ofer
FROM property_metadata m
LEFT JOIN property_features f ON f.cod_ofer = m.cod_ofer
WHERE f.cod_ofer IS NULL
  AND m.full_data IS NOT NULL
ON CONFLICT (cod_ofer) DO NOTHING;

-- Actualizar campos vacíos/nulos desde full_data
UPDATE property_features pf
SET
  superficie             = COALESCE(
                             pf.superficie,
                             NULLIF((m.full_data->>'m_cons'), '')::numeric
                           ),
  habitaciones           = COALESCE(
                             pf.habitaciones,
                             NULLIF((m.full_data->>'habitaciones'), '')::integer
                           ),
  habitaciones_simples   = COALESCE(
                             pf.habitaciones_simples,
                             NULLIF((m.full_data->>'habsimples'), '')::integer
                           ),
  habitaciones_dobles    = COALESCE(
                             pf.habitaciones_dobles,
                             NULLIF((m.full_data->>'habdobles'), '')::integer
                           ),
  banos                  = COALESCE(
                             pf.banos,
                             NULLIF((m.full_data->>'banyos'), '')::integer
                           )
FROM property_metadata m
WHERE pf.cod_ofer = m.cod_ofer
  AND m.full_data IS NOT NULL;

-- ============================================================
-- 3. Verificación post-sync
-- ============================================================
SELECT
  COUNT(*) FILTER (WHERE precio IS NOT NULL)   AS con_precio,
  COUNT(*) FILTER (WHERE precio IS NULL)       AS sin_precio,
  COUNT(*) FILTER (WHERE tipo IS NOT NULL)     AS con_tipo,
  COUNT(*) FILTER (WHERE tipo IS NULL)         AS sin_tipo,
  COUNT(*) FILTER (WHERE poblacion IS NOT NULL) AS con_poblacion,
  COUNT(*) FILTER (WHERE poblacion IS NULL)    AS sin_poblacion,
  COUNT(*)                                     AS total
FROM property_metadata;

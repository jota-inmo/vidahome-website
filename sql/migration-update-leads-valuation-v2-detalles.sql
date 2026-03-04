-- Migración: Simplificar detalles del inmueble en leads_valuation_v2
-- Fecha: 2026-03-04
-- Descripción: Agregar campos habitaciones, banos y notas_adicionales
--              Eliminar campos piso_planta y puerta que ya no se usan

-- Agregar nuevas columnas
ALTER TABLE leads_valuation_v2 
  ADD COLUMN IF NOT EXISTS habitaciones INTEGER,
  ADD COLUMN IF NOT EXISTS banos INTEGER,
  ADD COLUMN IF NOT EXISTS notas_adicionales TEXT;

-- Eliminar columnas antiguas (opcional - descomentar si quieres eliminarlas)
-- ALTER TABLE leads_valuation_v2 
--   DROP COLUMN IF EXISTS piso_planta,
--   DROP COLUMN IF EXISTS puerta;

-- Agregar comentarios para documentación
COMMENT ON COLUMN leads_valuation_v2.habitaciones IS 'Número de habitaciones del inmueble';
COMMENT ON COLUMN leads_valuation_v2.banos IS 'Número de baños del inmueble';
COMMENT ON COLUMN leads_valuation_v2.notas_adicionales IS 'Información adicional proporcionada por el usuario';

-- Migration: Add simple/double room distinction to property_features
-- Description: Track habitaciones_simples and habitaciones_dobles separately
-- Date: 2026-02-25

-- Add new columns if they don't exist
ALTER TABLE public.property_features
ADD COLUMN IF NOT EXISTS habitaciones_simples INTEGER DEFAULT 0;

ALTER TABLE public.property_features
ADD COLUMN IF NOT EXISTS habitaciones_dobles INTEGER DEFAULT 0;

-- Create index for room searches
CREATE INDEX IF NOT EXISTS idx_property_features_habitaciones_simples 
  ON public.property_features(habitaciones_simples);

CREATE INDEX IF NOT EXISTS idx_property_features_habitaciones_dobles 
  ON public.property_features(habitaciones_dobles);

-- Update habitaciones column to be the sum of simples + dobles
-- (This will be computed in the application code when upserting)

-- Constraint to ensure total rooms can be computed
ALTER TABLE public.property_features
ADD CONSTRAINT check_habitaciones_sum 
  CHECK (habitaciones = (COALESCE(habitaciones_simples, 0) + COALESCE(habitaciones_dobles, 0)))
  NOT DEFERRABLE;

-- Note: The constraint above ensures data integrity by validating that
-- habitaciones = habitaciones_simples + habitaciones_dobles

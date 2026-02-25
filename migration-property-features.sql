-- Migration: Create property_features table for fast querying
-- Description: Store frequently accessed property attributes (price, rooms, baths, area)
-- Date: 2026-02-25

CREATE TABLE IF NOT EXISTS public.property_features (
  id BIGSERIAL PRIMARY KEY,
  cod_ofer INTEGER NOT NULL UNIQUE REFERENCES property_metadata(cod_ofer) ON DELETE CASCADE,
  
  -- Core metrics
  precio NUMERIC(12, 2) DEFAULT 0,
  habitaciones INTEGER,
  banos INTEGER,
  superficie NUMERIC(10, 2),  -- m2
  
  -- Property characteristics
  plantas INTEGER,
  ascensor BOOLEAN DEFAULT false,
  parking BOOLEAN DEFAULT false,
  terraza BOOLEAN DEFAULT false,
  
  -- Building info
  ano_construccion INTEGER,
  estado_conservacion TEXT,  -- 'nuevo', 'buen estado', 'reforma', 'ruina', etc
  
  -- Energy
  clase_energetica TEXT,  -- A, B, C, D, E, F, G
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_at TIMESTAMP WITH TIME ZONE,  -- Last sync from Inmovilla
  
  -- Constraints
  CHECK (precio >= 0),
  CHECK (habitaciones >= 0),
  CHECK (banos >= 0),
  CHECK (superficie > 0)
);

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_property_features_precio 
  ON public.property_features(precio);

CREATE INDEX IF NOT EXISTS idx_property_features_habitaciones 
  ON public.property_features(habitaciones);

CREATE INDEX IF NOT EXISTS idx_property_features_superficie 
  ON public.property_features(superficie);

CREATE INDEX IF NOT EXISTS idx_property_features_synced_at 
  ON public.property_features(synced_at DESC);

-- RLS Policies
ALTER TABLE public.property_features ENABLE ROW LEVEL SECURITY;

-- Public read (anyone can see property features)
CREATE POLICY "Public read property features"
  ON public.property_features
  FOR SELECT
  USING (true);

-- Service role can write
CREATE POLICY "Service role write property features"
  ON public.property_features
  FOR INSERT
  WITH CHECK (true);

-- Service role can update
CREATE POLICY "Service role update property features"
  ON public.property_features
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Service role can delete
CREATE POLICY "Service role delete property features"
  ON public.property_features
  FOR DELETE
  USING (true);

-- Migration: Extend property_features with all available Inmovilla API fields
-- Date: 2026-02-27
-- Adds the fields available in the paginacion endpoint that were not previously stored

-- ─── New columns ────────────────────────────────────────────────────────────────

ALTER TABLE public.property_features
  -- Tipo de acción (1=Venta, 2=Alquiler, 3=Traspaso)
  ADD COLUMN IF NOT EXISTS keyacci INTEGER DEFAULT 1,

  -- Precio alquiler (separado del precio de venta)
  ADD COLUMN IF NOT EXISTS precioalq NUMERIC(12,2) DEFAULT 0,

  -- Precio anterior / outlet (para badge de rebaja)
  ADD COLUMN IF NOT EXISTS outlet NUMERIC(12,2) DEFAULT 0,

  -- Zona/barrio dentro de la ciudad
  ADD COLUMN IF NOT EXISTS zona VARCHAR(255),

  -- Tipo de propiedad (texto, e.g. "Piso", "Chalet", "Local")
  ADD COLUMN IF NOT EXISTS tipo VARCHAR(100),

  -- Distancia al mar en metros
  ADD COLUMN IF NOT EXISTS distmar INTEGER DEFAULT 0,

  -- Piscina comunitaria / privada
  ADD COLUMN IF NOT EXISTS piscina_com BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS piscina_prop BOOLEAN DEFAULT false,

  -- Climatización
  ADD COLUMN IF NOT EXISTS aire_con BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS calefaccion BOOLEAN DEFAULT false,

  -- Superficies adicionales (en m2)
  ADD COLUMN IF NOT EXISTS m_utiles NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS m_terraza NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS m_parcela NUMERIC(10,2) DEFAULT 0,

  -- Aseos (distintos de baños completos)
  ADD COLUMN IF NOT EXISTS aseos INTEGER DEFAULT 0,

  -- Parking extendido (0=sin parking, 1=opcional, 2=incluido)
  ADD COLUMN IF NOT EXISTS parking_tipo INTEGER DEFAULT 0,

  -- Características adicionales
  ADD COLUMN IF NOT EXISTS diafano BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS todoext BOOLEAN DEFAULT false,

  -- Coordenadas GPS (disponibles en ficha, no en paginacion)
  ADD COLUMN IF NOT EXISTS latitud DECIMAL(10,7),
  ADD COLUMN IF NOT EXISTS longitud DECIMAL(10,7);

-- ─── Indexes para filtros más comunes ───────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_pf_keyacci
  ON public.property_features(keyacci);

CREATE INDEX IF NOT EXISTS idx_pf_precioalq
  ON public.property_features(precioalq);

CREATE INDEX IF NOT EXISTS idx_pf_zona
  ON public.property_features(zona);

CREATE INDEX IF NOT EXISTS idx_pf_tipo
  ON public.property_features(tipo);

CREATE INDEX IF NOT EXISTS idx_pf_distmar
  ON public.property_features(distmar);

CREATE INDEX IF NOT EXISTS idx_pf_piscina_com
  ON public.property_features(piscina_com);

CREATE INDEX IF NOT EXISTS idx_pf_aire_con
  ON public.property_features(aire_con);

CREATE INDEX IF NOT EXISTS idx_pf_latlon
  ON public.property_features(latitud, longitud)
  WHERE latitud IS NOT NULL AND longitud IS NOT NULL;

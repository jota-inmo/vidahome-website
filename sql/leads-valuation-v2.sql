-- Nueva tabla para leads de tasación con nuevo flujo
CREATE TABLE IF NOT EXISTS leads_valuation_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- STEP 1: Tipo de operación
  operation_type VARCHAR(20) NOT NULL CHECK (operation_type IN ('venta', 'alquiler')),
  
  -- STEP 2: Tipo de bien
  property_type VARCHAR(50) NOT NULL,
  property_type_other VARCHAR(100),
  
  -- STEP 3: Dirección
  provincia VARCHAR(100),
  municipio VARCHAR(100),
  tipo_via VARCHAR(50),
  via VARCHAR(200),
  numero VARCHAR(50),
  ref_catastral_manual VARCHAR(22),
  
  -- STEP 4: Detalles de piso (condicional)
  piso_planta VARCHAR(50),
  puerta VARCHAR(50),
  
  -- STEP 5: Datos del catastro
  catastro_data JSONB,
  
  -- STEP 6: Datos de contacto
  user_name VARCHAR(150) NOT NULL,
  user_email VARCHAR(255),
  user_phone VARCHAR(20) NOT NULL,
  user_country_code VARCHAR(5) NOT NULL,
  user_message TEXT,
  
  -- Metadata
  progress_step INTEGER DEFAULT 1,
  completed BOOLEAN DEFAULT false,
  estimated_value DECIMAL(12,2),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'new'
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_leads_v2_created_at ON leads_valuation_v2(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_v2_status ON leads_valuation_v2(status);
CREATE INDEX IF NOT EXISTS idx_leads_v2_operation ON leads_valuation_v2(operation_type);
CREATE INDEX IF NOT EXISTS idx_leads_v2_property_type ON leads_valuation_v2(property_type);
CREATE INDEX IF NOT EXISTS idx_leads_v2_completed ON leads_valuation_v2(completed);

-- RLS: Solo admins pueden ver todos los leads
ALTER TABLE leads_valuation_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inserts from anonymous" ON leads_valuation_v2
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Only admins can view" ON leads_valuation_v2
  FOR SELECT 
  USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() ->> 'email' LIKE '%@vidahome%'
  );

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_leads_valuation_v2_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_leads_valuation_v2_updated_at ON leads_valuation_v2;
CREATE TRIGGER update_leads_valuation_v2_updated_at
  BEFORE UPDATE ON leads_valuation_v2
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_valuation_v2_timestamp();

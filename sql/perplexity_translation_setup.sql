-- SQL Migration to set up properties table and translation logging
-- Based on user requirements for Perplexity translation

-- 1. Create properties table (if not exists)
-- Note: We use the structure requested by the user
CREATE TABLE IF NOT EXISTS properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id INTEGER UNIQUE, -- original cod_ofer
    ref TEXT,
    description_es TEXT,
    description_en TEXT,
    description_fr TEXT,
    description_de TEXT,
    description_it TEXT,
    description_pl TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create translation_log table
CREATE TABLE IF NOT EXISTS translation_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id INTEGER REFERENCES properties(property_id) ON DELETE CASCADE,
    language TEXT NOT NULL,
    tokens_used INTEGER,
    cost_estimate NUMERIC(10, 5),
    status TEXT DEFAULT 'success',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_log ENABLE ROW LEVEL SECURITY;

-- 4. Policies (allow all for now as per project pattern, but in production use Auth)
CREATE POLICY "Allow all on properties" ON properties FOR ALL USING (true);
CREATE POLICY "Allow all on translation_log" ON translation_log FOR ALL USING (true);

-- 5. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Initial Migration of data from property_metadata if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'property_metadata') THEN
        INSERT INTO properties (property_id, ref, description_es, description_en, description_fr, description_de, description_pl)
        SELECT 
            cod_ofer, 
            ref, 
            COALESCE(descriptions->>'es', description),
            descriptions->>'en',
            descriptions->>'fr',
            descriptions->>'de',
            descriptions->>'pl'
        FROM property_metadata
        ON CONFLICT (property_id) DO NOTHING;
    END IF;
END $$;

-- SQL for creating the leads table in Supabase
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    email TEXT NOT NULL,
    telefono TEXT NOT NULL,
    mensaje TEXT,
    cod_ofer INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for the contact form)
CREATE POLICY "Allow anon insert" ON leads FOR INSERT WITH CHECK (true);

-- Table for featured properties on homepage
CREATE TABLE IF NOT EXISTS featured_properties (
    cod_ofer INTEGER PRIMARY KEY,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE featured_properties ENABLE ROW LEVEL SECURITY;

-- Allow public read
CREATE POLICY "Allow public read featured" ON featured_properties FOR SELECT USING (true);

-- For simplicity in this demo, allow all for now (in production you'd add auth)
CREATE POLICY "Allow all for management" ON featured_properties FOR ALL USING (true);

-- Table for property metadata caching (to store descriptions for the catalog)
CREATE TABLE IF NOT EXISTS property_metadata (
    cod_ofer INTEGER PRIMARY KEY,
    ref TEXT,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE property_metadata ENABLE ROW LEVEL SECURITY;

-- Allow public read for catalog enrichment
CREATE POLICY "Allow public read metadata" ON property_metadata FOR SELECT USING (true);

-- Allow all for system updates (simplification for the demo)
CREATE POLICY "Allow all for system" ON property_metadata FOR ALL USING (true);

-- Table for hero slides
CREATE TABLE IF NOT EXISTS hero_slides (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_path TEXT NOT NULL,
    link_url TEXT,
    title TEXT,
    titles JSONB DEFAULT '{}'::jsonb,
    "order" INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    type TEXT DEFAULT 'video',
    poster TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Migration for existing table (if it exists without titles)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hero_slides' AND column_name='titles') THEN
        ALTER TABLE hero_slides ADD COLUMN titles JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Enable RLS for hero_slides
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read hero" ON hero_slides FOR SELECT USING (true);
CREATE POLICY "Allow all management hero" ON hero_slides FOR ALL USING (true);

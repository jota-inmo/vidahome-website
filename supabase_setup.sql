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

-- Analytics Schema for Vidahome Dashboard
-- Execute this in Supabase SQL Editor

-- 1. Tabla principal: Property Views (visitas a propiedades)
CREATE TABLE IF NOT EXISTS analytics_property_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cod_ofer INTEGER NOT NULL,
    locale VARCHAR(5) NOT NULL DEFAULT 'es',
    visitor_ip VARCHAR(50),
    user_agent TEXT,
    referer TEXT,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    session_id VARCHAR(100),
    
    -- Index para queries rápidas
    FOREIGN KEY (cod_ofer) REFERENCES property_metadata(cod_ofer) ON DELETE CASCADE
);

CREATE INDEX idx_analytics_views_property ON analytics_property_views(cod_ofer);
CREATE INDEX idx_analytics_views_date ON analytics_property_views(viewed_at);
CREATE INDEX idx_analytics_views_locale ON analytics_property_views(locale);

-- 2. Tabla: Lead Events (cuando alguien envía contacto)
CREATE TABLE IF NOT EXISTS analytics_leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cod_ofer INTEGER,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    source VARCHAR(50), -- 'contact_form', 'property_card', 'direct', etc
    locale VARCHAR(5) NOT NULL DEFAULT 'es',
    conversion_type VARCHAR(50), -- 'lead', 'quote', 'call', etc
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_analytics_leads_property ON analytics_leads(cod_ofer);
CREATE INDEX idx_analytics_leads_date ON analytics_leads(created_at);
CREATE INDEX idx_analytics_leads_locale ON analytics_leads(locale);

-- 3. Tabla: Valuation Leads (cuando alguien pide tasación)
CREATE TABLE IF NOT EXISTS analytics_valuations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    valuation_id UUID REFERENCES valuation_leads(id) ON DELETE CASCADE,
    locale VARCHAR(5) NOT NULL DEFAULT 'es',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_analytics_valuations_date ON analytics_valuations(created_at);

-- 4. Tabla: Page Views (vistas generales de páginas)
CREATE TABLE IF NOT EXISTS analytics_page_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_path VARCHAR(255) NOT NULL, -- '/es', '/en', '/propiedades', etc
    locale VARCHAR(5) NOT NULL DEFAULT 'es',
    visitor_ip VARCHAR(50),
    session_id VARCHAR(100),
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_analytics_pages_path ON analytics_page_views(page_path);
CREATE INDEX idx_analytics_pages_date ON analytics_page_views(viewed_at);

-- 5. Tabla: Search Events (búsquedas en el catálogo)
CREATE TABLE IF NOT EXISTS analytics_searches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    search_query TEXT,
    locale VARCHAR(5) NOT NULL DEFAULT 'es',
    results_count INTEGER,
    visitor_ip VARCHAR(50),
    session_id VARCHAR(100),
    searched_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_analytics_searches_date ON analytics_searches(searched_at);
CREATE INDEX idx_analytics_searches_locale ON analytics_searches(locale);

-- 6. Enable RLS
ALTER TABLE analytics_property_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_valuations ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_searches ENABLE ROW LEVEL SECURITY;

-- 7. Policies: Lectura pública (para frontend), escritura admin
CREATE POLICY "Allow insert for all" ON analytics_property_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow read for all" ON analytics_property_views FOR SELECT USING (true);
CREATE POLICY "Allow admin update" ON analytics_property_views FOR UPDATE USING (true);

CREATE POLICY "Allow insert for all" ON analytics_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow read for all" ON analytics_leads FOR SELECT USING (true);

CREATE POLICY "Allow insert for all" ON analytics_valuations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow read for all" ON analytics_valuations FOR SELECT USING (true);

CREATE POLICY "Allow insert for all" ON analytics_page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow read for all" ON analytics_page_views FOR SELECT USING (true);

CREATE POLICY "Allow insert for all" ON analytics_searches FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow read for all" ON analytics_searches FOR SELECT USING (true);

-- Nota: En admin, usar supabaseAdmin (SERVICE_ROLE_KEY) para leer estos datos

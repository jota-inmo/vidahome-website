CREATE TABLE IF NOT EXISTS analytics_property_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cod_ofer INTEGER NOT NULL,
    locale VARCHAR(5) NOT NULL DEFAULT 'es',
    visitor_ip VARCHAR(50),
    user_agent TEXT,
    referer TEXT,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    session_id VARCHAR(100)
);

CREATE INDEX idx_analytics_views_property ON analytics_property_views(cod_ofer);
CREATE INDEX idx_analytics_views_date ON analytics_property_views(viewed_at);
CREATE INDEX idx_analytics_views_locale ON analytics_property_views(locale);

CREATE TABLE IF NOT EXISTS analytics_leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cod_ofer INTEGER,
    email VARCHAR(255),
    source VARCHAR(50),
    locale VARCHAR(5) NOT NULL DEFAULT 'es',
    conversion_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_analytics_leads_property ON analytics_leads(cod_ofer);
CREATE INDEX idx_analytics_leads_date ON analytics_leads(created_at);
CREATE INDEX idx_analytics_leads_locale ON analytics_leads(locale);

CREATE TABLE IF NOT EXISTS analytics_valuations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    address VARCHAR(255),
    email VARCHAR(255),
    locale VARCHAR(5) NOT NULL DEFAULT 'es',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_analytics_valuations_date ON analytics_valuations(created_at);

CREATE TABLE IF NOT EXISTS analytics_page_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_path VARCHAR(255) NOT NULL,
    locale VARCHAR(5) NOT NULL DEFAULT 'es',
    visitor_ip VARCHAR(50),
    session_id VARCHAR(100),
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_analytics_pages_path ON analytics_page_views(page_path);
CREATE INDEX idx_analytics_pages_date ON analytics_page_views(viewed_at);

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

ALTER TABLE analytics_property_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_valuations ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_searches ENABLE ROW LEVEL SECURITY;

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

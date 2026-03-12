-- Create table for property URLs in different languages
CREATE TABLE IF NOT EXISTS property_urls (
    cod_ofer INTEGER PRIMARY KEY REFERENCES property_metadata(cod_ofer) ON DELETE CASCADE,
    ref VARCHAR(255),
    url_es TEXT,
    url_en TEXT,
    url_fr TEXT,
    url_de TEXT,
    url_it TEXT,
    url_pl TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- For faster lookups by reference
CREATE INDEX IF NOT EXISTS idx_property_urls_ref ON property_urls(ref);

-- Comments for documentation
COMMENT ON TABLE property_urls IS 'Stores pre-generated URLs for each property in all supported languages for use in automations (Google Calendar, confirmations, etc.)';
COMMENT ON COLUMN property_urls.cod_ofer IS 'Unique property identifier from Inmovilla';
COMMENT ON COLUMN property_urls.ref IS 'Property reference number';

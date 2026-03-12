-- Table for legal pages content in 6 languages
CREATE TABLE IF NOT EXISTS legal_pages (
    slug VARCHAR(50) PRIMARY KEY, -- 'privacy', 'cookies', 'legal'
    title_es TEXT,
    title_en TEXT,
    title_fr TEXT,
    title_de TEXT,
    title_it TEXT,
    title_pl TEXT,
    content_es TEXT,
    content_en TEXT,
    content_fr TEXT,
    content_de TEXT,
    content_it TEXT,
    content_pl TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default rows with titles for each language
INSERT INTO legal_pages (slug, 
    title_es, title_en, title_fr, title_de, title_it, title_pl,
    content_es, content_en, content_fr, content_de, content_it, content_pl
) 
VALUES 
    ('privacy', 
    'Política de Privacidad', 'Privacy Policy', 'Politique de confidentialité', 'Datenschutzerklärung', 'Informativa sulla privacy', 'Polityka prywatności',
    '<p>Contenido de la política de privacidad en español...</p>', '<p>Privacy policy content in English...</p>', '<p>Contenu de la politique de confidentialité en français...</p>', '<p>Inhalt der Datenschutzerklärung auf Deutsch...</p>', '<p>Contenuto dell''informativa sulla privacy in italiano...</p>', '<p>Treść polityki prywatności po polsku...</p>'),
    
    ('cookies', 
    'Política de Cookies', 'Cookies Policy', 'Politique de cookies', 'Cookie-Richtlinie', 'Politica sui cookie', 'Polityka prywatności (Cookies)',
    '<p>Contenido de la política de cookies en español...</p>', '<p>Cookies policy content in English...</p>', '<p>Contenu de la politique de cookies en français...</p>', '<p>Inhalt der Cookie-Richtlinie auf Deutsch...</p>', '<p>Contenuto della politica sui cookie in italiano...</p>', '<p>Treść polityki cookies po polsku...</p>'),
    
    ('legal', 
    'Aviso Legal', 'Legal Notice', 'Mentions Légales', 'Impressum', 'Note Legali', 'Nota Prawna',
    '<p>Contenido del aviso legal en español...</p>', '<p>Legal notice content in English...</p>', '<p>Contenu des mentions légales en français...</p>', '<p>Inhalt des Impressums auf Deutsch...</p>', '<p>Contenuto delle note legali in italiano...</p>', '<p>Treść noty prawnej po polsku...</p>')
ON CONFLICT (slug) DO NOTHING;

-- Ensure notifications_email key exists in company_settings
INSERT INTO company_settings (key, value, updated_at)
VALUES ('notifications_email', 'info@vidahome.es', NOW())
ON CONFLICT (key) DO NOTHING;

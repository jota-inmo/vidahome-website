-- ========================================
-- BLOG SYSTEM - COMPLETE SUPABASE SETUP
-- ========================================

-- 1. CREATE BLOG POSTS TABLE
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Content
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    excerpt VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    
    -- Metadata
    locale VARCHAR(5) NOT NULL,      -- es, en, fr, de, it, pl
    author VARCHAR(100) DEFAULT 'Vidahome',
    featured_image_url VARCHAR(500),
    featured_image_alt VARCHAR(255),
    
    -- SEO
    meta_description VARCHAR(160),
    meta_keywords VARCHAR(255),
    
    -- Status & Relationships
    is_published BOOLEAN DEFAULT false,
    category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    published_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT title_not_empty CHECK (char_length(title) > 0),
    CONSTRAINT content_not_empty CHECK (char_length(content) > 0)
);

-- 2. CREATE BLOG CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS blog_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    locale VARCHAR(5) NOT NULL,
    icon VARCHAR(50),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    CONSTRAINT unique_category_slug_locale UNIQUE(slug, locale)
);

-- 3. CREATE BLOG TAGS TABLE
CREATE TABLE IF NOT EXISTS blog_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) NOT NULL,
    locale VARCHAR(5) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    CONSTRAINT unique_tag_slug_locale UNIQUE(slug, locale)
);

-- 4. CREATE JUNCTION TABLE (MANY-TO-MANY)
CREATE TABLE IF NOT EXISTS blog_post_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES blog_tags(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT unique_post_tag UNIQUE(post_id, tag_id)
);

-- 5. CREATE TRANSLATION LOG TABLE (para tracking automático)
CREATE TABLE IF NOT EXISTS blog_translation_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    target_post_id UUID REFERENCES blog_posts(id) ON DELETE SET NULL,
    source_locale VARCHAR(5) NOT NULL,
    target_locale VARCHAR(5) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',  -- pending, in_progress, completed, failed
    cost_estimate VARCHAR(20),
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- ========================================
-- INDEXES (Performance Critical)
-- ========================================

CREATE INDEX idx_blog_posts_locale ON blog_posts(locale);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_published ON blog_posts(is_published);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX idx_blog_posts_category ON blog_posts(category_id);
CREATE INDEX idx_blog_posts_created ON blog_posts(created_at DESC);
CREATE INDEX idx_blog_posts_locale_published ON blog_posts(locale, is_published);

CREATE INDEX idx_blog_categories_locale ON blog_categories(locale);
CREATE INDEX idx_blog_categories_slug ON blog_categories(slug);

CREATE INDEX idx_blog_tags_locale ON blog_tags(locale);

CREATE INDEX idx_blog_post_tags_post ON blog_post_tags(post_id);
CREATE INDEX idx_blog_post_tags_tag ON blog_post_tags(tag_id);

CREATE INDEX idx_blog_translation_source ON blog_translation_log(source_post_id);
CREATE INDEX idx_blog_translation_status ON blog_translation_log(status);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_translation_log ENABLE ROW LEVEL SECURITY;

-- PUBLIC CAN READ PUBLISHED POSTS
CREATE POLICY blog_posts_select ON blog_posts
    FOR SELECT
    USING (is_published = true);

-- ADMINS CAN READ ALL
CREATE POLICY blog_posts_admin_select ON blog_posts
    FOR SELECT
    USING (auth.jwt() ->> 'role' = 'admin');

-- ADMIN CAN INSERT/UPDATE/DELETE
CREATE POLICY blog_posts_admin_modify ON blog_posts
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin');

-- CATEGORIES AND TAGS PUBLIC READ
CREATE POLICY blog_categories_select ON blog_categories
    FOR SELECT
    USING (true);

CREATE POLICY blog_tags_select ON blog_tags
    FOR SELECT
    USING (true);

CREATE POLICY blog_post_tags_select ON blog_post_tags
    FOR SELECT
    USING (true);

-- ========================================
-- STORAGE BUCKET (para imágenes destacadas)
-- ========================================

-- Crear bucket vía Supabase dashboard:
-- 1. Storage → New Bucket
-- 2. Name: "blog-images"
-- 3. Public: true
-- 4. Upload límite: 10MB
-- 5. Allowed MIME types: image/*

-- SQL para policies:
CREATE POLICY "Public read access" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'blog-images');

CREATE POLICY "Admin can upload" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'blog-images' 
        AND auth.jwt() ->> 'role' = 'admin'
    );

CREATE POLICY "Admin can delete" ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'blog-images'
        AND auth.jwt() ->> 'role' = 'admin'
    );

-- ========================================
-- SAMPLE DATA (OPCIONAL)
-- ========================================

-- Insertar categoría ejemplo
INSERT INTO blog_categories (name, slug, description, locale, icon)
VALUES ('Mercado Inmobiliario', 'mercado-inmobiliario', 'Artículos sobre tendencias del mercado', 'es', 'TrendingUp')
ON CONFLICT (slug, locale) DO NOTHING;

INSERT INTO blog_categories (name, slug, description, locale, icon)
VALUES ('Real Estate Market', 'real-estate-market', 'Articles about market trends', 'en', 'TrendingUp')
ON CONFLICT (slug, locale) DO NOTHING;

-- ========================================
-- UTILITY FUNCTIONS
-- ========================================

-- Función para generar slug automáticamente
CREATE OR REPLACE FUNCTION generate_slug(text_input VARCHAR)
RETURNS VARCHAR
AS $$
BEGIN
    RETURN 
        LOWER(
            REGEXP_REPLACE(
                REGEXP_REPLACE(
                    REGEXP_REPLACE(text_input, '[áéíóú]', 'a', 'g'),
                    '[^a-z0-9\s-]', '', 'g'
                ),
                '\s+', '-', 'g'
            )
        );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blog_posts_update_trigger
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER blog_categories_update_trigger
    BEFORE UPDATE ON blog_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ========================================
-- VERIFICACIÓN FINAL
-- ========================================

-- Ver todas las tablas creadas
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'blog%';

-- Ver índices
-- SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename LIKE 'blog%';

-- PHASE 1 SUPABASE DEPLOYMENT
-- Execute all commands in Supabase SQL Editor (https://supabase.com/dashboard)
-- This file contains:
-- 1. Blog system schema (4 tables)
-- 2. Analytics enhancements (UTM and traffic source tracking)

-- ============================================================================
-- SECTION 1: BLOG SYSTEM SCHEMA
-- ============================================================================

-- Blog Posts Table
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Content
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,           -- Markdown content
    excerpt VARCHAR(500),
    
    -- Metadata
    locale VARCHAR(5) NOT NULL,      -- es, en, fr, de, pl
    author VARCHAR(100),
    featured_image_url VARCHAR(500),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    published_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_published BOOLEAN DEFAULT false,
    
    -- SEO
    meta_description VARCHAR(160),
    meta_keywords VARCHAR(255),
    
    -- Relations
    category_id UUID,
    
    CONSTRAINT unique_slug_per_locale UNIQUE (slug, locale)
);

-- Blog Categories Table
CREATE TABLE IF NOT EXISTS blog_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    locale VARCHAR(5) NOT NULL,
    UNIQUE(slug, locale)
);

-- Blog Tags Table
CREATE TABLE IF NOT EXISTS blog_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    locale VARCHAR(5) NOT NULL,
    UNIQUE(slug, locale)
);

-- Blog Post Tags Junction Table
CREATE TABLE IF NOT EXISTS blog_post_tags (
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES blog_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_locale ON blog_posts(locale);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(is_published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created ON blog_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_categories_locale ON blog_categories(locale);
CREATE INDEX IF NOT EXISTS idx_blog_tags_locale ON blog_tags(locale);

-- Row Level Security
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_tags ENABLE ROW LEVEL SECURITY;

-- Policies - Allow read of published posts to everyone
CREATE POLICY "Allow read published posts" ON blog_posts 
    FOR SELECT USING (is_published = true);

-- Policies - Categories and tags readable by all
CREATE POLICY "Allow read categories" ON blog_categories 
    FOR SELECT USING (true);

CREATE POLICY "Allow read tags" ON blog_tags 
    FOR SELECT USING (true);

CREATE POLICY "Allow read post tags" ON blog_post_tags 
    FOR SELECT USING (true);

-- ============================================================================
-- SECTION 2: ANALYTICS ENHANCEMENTS
-- ============================================================================
-- These columns track UTM parameters and traffic source detection
-- Used by useAnalytics hook in src/lib/hooks/useAnalytics.ts

-- Add new columns to analytics_property_views table
ALTER TABLE analytics_property_views 
ADD COLUMN IF NOT EXISTS traffic_source VARCHAR(50),
ADD COLUMN IF NOT EXISTS utm_source VARCHAR(100),
ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(100),
ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(100);

-- Add indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_analytics_traffic_source ON analytics_property_views(traffic_source);
CREATE INDEX IF NOT EXISTS idx_analytics_utm_source ON analytics_property_views(utm_source);
CREATE INDEX IF NOT EXISTS idx_analytics_utm_medium ON analytics_property_views(utm_medium);
CREATE INDEX IF NOT EXISTS idx_analytics_utm_campaign ON analytics_property_views(utm_campaign);

-- Example queries for analytics dashboard:
-- SELECT traffic_source, COUNT(*) as views FROM analytics_property_views GROUP BY traffic_source;
-- SELECT utm_source, utm_medium, COUNT(*) as conversions FROM analytics_property_views WHERE cod_ofer IS NOT NULL GROUP BY utm_source, utm_medium;

'use server';

import { createClient } from '@supabase/supabase-js';
import { BlogPost, BlogListParams, BlogCategory } from '@/types/blog';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

/**
 * Fetch blog posts by locale
 */
export async function getBlogPostsAction(
    locale: string,
    page: number = 1,
    limit: number = 10
): Promise<{
    success: boolean;
    data?: BlogPost[];
    total?: number;
    error?: string;
}> {
    try {
        const offset = (page - 1) * limit;

        const { data, count, error } = await supabase
            .from('blog_posts')
            .select('*', { count: 'exact' })
            .eq('locale', locale)
            .eq('is_published', true)
            .order('published_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        return {
            success: true,
            data: (data || []) as BlogPost[],
            total: count || 0,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error fetching blog posts',
        };
    }
}

/**
 * Fetch single blog post by slug
 */
export async function getBlogPostBySlugAction(
    locale: string,
    slug: string
): Promise<{
    success: boolean;
    data?: BlogPost;
    error?: string;
}> {
    try {
        const { data, error } = await supabase
            .from('blog_posts')
            .select('*')
            .eq('locale', locale)
            .eq('slug', slug)
            .eq('is_published', true)
            .single();

        if (error) throw error;

        return {
            success: true,
            data: data as BlogPost,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Blog post not found',
        };
    }
}

/**
 * Get all categories for a locale
 */
export async function getBlogCategoriesAction(
    locale: string
): Promise<{
    success: boolean;
    data?: BlogCategory[];
    error?: string;
}> {
    try {
        const { data, error } = await supabase
            .from('blog_categories')
            .select('*')
            .eq('locale', locale)
            .order('name', { ascending: true });

        if (error) throw error;

        return {
            success: true,
            data: (data || []) as BlogCategory[],
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error fetching categories',
        };
    }
}

/**
 * Get posts by category
 */
export async function getBlogPostsByCategoryAction(
    locale: string,
    categorySlug: string,
    page: number = 1,
    limit: number = 10
): Promise<{
    success: boolean;
    data?: BlogPost[];
    total?: number;
    error?: string;
}> {
    try {
        const offset = (page - 1) * limit;

        // First get the category
        const { data: categoryData } = await supabase
            .from('blog_categories')
            .select('id')
            .eq('locale', locale)
            .eq('slug', categorySlug)
            .single();

        if (!categoryData) {
            return {
                success: false,
                error: 'Category not found',
            };
        }

        // Then get posts for that category
        const { data, count, error } = await supabase
            .from('blog_posts')
            .select('*', { count: 'exact' })
            .eq('locale', locale)
            .eq('category_id', categoryData.id)
            .eq('is_published', true)
            .order('published_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        return {
            success: true,
            data: (data || []) as BlogPost[],
            total: count || 0,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error fetching category posts',
        };
    }
}

/**
 * Search blog posts
 */
export async function searchBlogPostsAction(
    locale: string,
    query: string,
    page: number = 1,
    limit: number = 10
): Promise<{
    success: boolean;
    data?: BlogPost[];
    total?: number;
    error?: string;
}> {
    try {
        const offset = (page - 1) * limit;

        const { data, count, error } = await supabase
            .from('blog_posts')
            .select('*', { count: 'exact' })
            .eq('locale', locale)
            .eq('is_published', true)
            .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%,content.ilike.%${query}%`)
            .order('published_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        return {
            success: true,
            data: (data || []) as BlogPost[],
            total: count || 0,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error searching blog posts',
        };
    }
}

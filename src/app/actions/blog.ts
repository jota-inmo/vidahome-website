'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { BlogPost, BlogListParams, BlogCategory } from '@/types/blog';

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

        const { data, count, error } = await supabaseAdmin
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
        const { data, error } = await supabaseAdmin
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
        const { data, error } = await supabaseAdmin
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
        const { data: categoryData } = await supabaseAdmin
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
        const { data, count, error } = await supabaseAdmin
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

        const { data, count, error } = await supabaseAdmin
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

// ============================================================================
// ADMIN CRUD OPERATIONS (use supabaseAdmin to bypass RLS)
// ============================================================================

/**
 * Fetch ALL blog posts for admin (including drafts)
 */
export async function getAdminBlogPostsAction(
    locale: string
): Promise<{
    success: boolean;
    data?: BlogPost[];
    error?: string;
}> {
    try {
        const { data, error } = await supabaseAdmin
            .from('blog_posts')
            .select('*')
            .eq('locale', locale)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[getAdminBlogPosts] Supabase error:', JSON.stringify(error));
            return {
                success: false,
                error: `${error.message}${error.details ? ` — ${error.details}` : ''}`,
            };
        }

        console.log(`[getAdminBlogPosts] Found ${data?.length || 0} posts for locale=${locale}`);
        return { success: true, data: (data || []) as BlogPost[] };
    } catch (error: any) {
        console.error('[getAdminBlogPosts] Error:', error);
        return {
            success: false,
            error: error?.message || String(error) || 'Error fetching posts',
        };
    }
}

/**
 * Create a new blog post
 */
export async function createBlogPostAction(post: {
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    locale: string;
    author: string;
    meta_description: string;
    meta_keywords: string;
    featured_image_url: string;
    featured_image_alt: string;
    is_published: boolean;
    category_id?: string | null;
}): Promise<{ success: boolean; data?: BlogPost; error?: string }> {
    try {
        const { data, error } = await supabaseAdmin
            .from('blog_posts')
            .insert({
                ...post,
                published_at: post.is_published ? new Date().toISOString() : null,
            })
            .select()
            .single();

        if (error) {
            console.error('[createBlogPost] Supabase error:', JSON.stringify(error));
            return {
                success: false,
                error: `${error.message}${error.details ? ` — ${error.details}` : ''}${error.hint ? ` (${error.hint})` : ''}`,
            };
        }

        return { success: true, data: data as BlogPost };
    } catch (error: any) {
        console.error('[createBlogPost] Error:', error);
        return {
            success: false,
            error: error?.message || String(error) || 'Error creating post',
        };
    }
}

/**
 * Update an existing blog post
 */
export async function updateBlogPostAction(
    id: string,
    updates: {
        title: string;
        slug: string;
        content: string;
        excerpt: string;
        meta_description: string;
        meta_keywords: string;
        featured_image_url: string;
        featured_image_alt: string;
        is_published: boolean;
        category_id?: string | null;
        published_at?: string | null;
    }
): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabaseAdmin
            .from('blog_posts')
            .update({
                ...updates,
                published_at: updates.is_published
                    ? (updates.published_at || new Date().toISOString())
                    : null,
            })
            .eq('id', id);

        if (error) {
            console.error('[updateBlogPost] Supabase error:', JSON.stringify(error));
            return {
                success: false,
                error: `${error.message}${error.details ? ` — ${error.details}` : ''}${error.hint ? ` (${error.hint})` : ''}`,
            };
        }

        return { success: true };
    } catch (error: any) {
        console.error('[updateBlogPost] Error:', error);
        return {
            success: false,
            error: error?.message || String(error) || 'Error updating post',
        };
    }
}

/**
 * Delete a blog post
 */
export async function deleteBlogPostAction(
    id: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabaseAdmin
            .from('blog_posts')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error deleting post',
        };
    }
}

/**
 * Upload blog image to Supabase Storage via supabaseAdmin
 */
export async function uploadBlogImageAction(
    formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        const file = formData.get('file') as File;
        if (!file) throw new Error('No file provided');

        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { error: uploadError } = await supabaseAdmin.storage
            .from('blog-images')
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) throw uploadError;

        const { data } = supabaseAdmin.storage
            .from('blog-images')
            .getPublicUrl(fileName);

        return { success: true, url: data.publicUrl };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error uploading image',
        };
    }
}

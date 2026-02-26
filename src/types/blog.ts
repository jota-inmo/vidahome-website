export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    locale: string;
    author?: string;
    featured_image_url?: string;
    featured_image_alt?: string;
    meta_description: string;
    meta_keywords: string;
    is_published: boolean;
    created_at: string;
    updated_at: string;
    published_at: string | null;
    category_id?: string;
    category?: BlogCategory;
    tags?: BlogTag[];
}

export interface BlogCategory {
    id: string;
    name: string;
    slug: string;
    description?: string;
    locale: string;
}

export interface BlogTag {
    id: string;
    name: string;
    slug: string;
    locale: string;
}

export interface BlogPostWithRelations extends BlogPost {
    category?: BlogCategory;
    tags?: BlogTag[];
}

export interface BlogListParams {
    locale: string;
    page?: number;
    limit?: number;
    categorySlug?: string;
    tagSlug?: string;
    search?: string;
}

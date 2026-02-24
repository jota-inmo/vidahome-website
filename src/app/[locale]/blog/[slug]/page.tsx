import React from 'react';
import { Metadata } from 'next';
import { getBlogPostBySlugAction } from '@/app/actions/blog';
import { Link } from '@/i18n/routing';

export async function generateMetadata({
    params,
}: {
    params: { locale: string; slug: string };
}): Promise<Metadata> {
    const result = await getBlogPostBySlugAction(params.locale, params.slug);

    if (!result.success || !result.data) {
        return {
            title: 'Blog Post Not Found',
            description: 'The blog post you are looking for does not exist.',
        };
    }

    const post = result.data;
    return {
        title: `${post.title} | Vidahome Blog`,
        description: post.meta_description || post.excerpt || post.content.substring(0, 160),
        keywords: post.meta_keywords,
    };
}

export default async function BlogPostPage({
    params,
}: {
    params: { locale: string; slug: string };
}) {
    const result = await getBlogPostBySlugAction(params.locale, params.slug);

    if (!result.success || !result.data) {
        return (
            <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-serif mb-4">Post Not Found</h1>
                    <p className="text-slate-600 dark:text-slate-400 mb-8">
                        Sorry, the blog post you are looking for does not exist.
                    </p>
                    <Link
                        href="/blog"
                        className="inline-block px-6 py-3 bg-slate-900 text-white rounded hover:bg-slate-800 transition-colors"
                    >
                        Back to Blog
                    </Link>
                </div>
            </div>
        );
    }

    const post = result.data;

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
            {/* Hero/Featured Image */}
            {post.featured_image_url && (
                <div className="w-full h-96 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center overflow-hidden">
                    <img
                        src={post.featured_image_url}
                        alt={post.title}
                        className="w-full h-full object-cover"
                    />
                </div>
            )}

            {/* Content */}
            <article className="max-w-3xl mx-auto px-8 py-20">
                {/* Header */}
                <header className="mb-12 border-b border-slate-100 dark:border-slate-800 pb-12">
                    <Link
                        href="/blog"
                        className="text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white mb-6 inline-block transition-colors"
                    >
                        ← Back to Blog
                    </Link>

                    <h1 className="text-5xl md:text-6xl font-serif mb-6 leading-tight">
                        {post.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                        <time dateTime={post.published_at}>
                            {new Date(post.published_at).toLocaleDateString(
                                params.locale === 'es' ? 'es-ES' : 'en-US',
                                {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                }
                            )}
                        </time>

                        {post.author && (
                            <>
                                <span>•</span>
                                <span>By {post.author}</span>
                            </>
                        )}
                    </div>
                </header>

                {/* Body Content */}
                <div className="prose dark:prose-invert max-w-none">
                    {/* Simple markdown rendering - in production, use a library like react-markdown */}
                    <div className="text-lg leading-relaxed whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                        {post.content}
                    </div>
                </div>

                {/* Footer */}
                <footer className="mt-20 pt-12 border-t border-slate-100 dark:border-slate-800">
                    {post.meta_keywords && (
                        <div className="mb-8">
                            <p className="text-xs text-slate-500 mb-2">Tags:</p>
                            <div className="flex flex-wrap gap-2">
                                {post.meta_keywords.split(',').map((tag, idx) => (
                                    <span
                                        key={idx}
                                        className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-300 rounded-full"
                                    >
                                        {tag.trim()}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </footer>
            </article>

            {/* Related Posts Section (Placeholder) */}
            <section className="bg-slate-50 dark:bg-slate-900/50 py-20 px-8">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-2xl font-serif mb-8">More Articles</h2>
                    <p className="text-slate-600 dark:text-slate-400">
                        Related articles will appear here soon...
                    </p>
                </div>
            </section>
        </div>
    );
}

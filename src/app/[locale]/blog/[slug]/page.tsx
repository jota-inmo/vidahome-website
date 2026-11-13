import React, { cache } from 'react';
import Image from 'next/image';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getBlogPostBySlugAction, getRelatedBlogPostsAction } from '@/app/actions/blog';
import { Link } from '@/i18n/routing';
import { BlogMarkdown } from '@/components/blog/BlogMarkdown';
import { extractFaq, plainDescription } from '@/lib/blog/markdown-utils';
import { buildBlogPostingJsonLd, buildFaqJsonLd } from '@/lib/blog/jsonld';
import { toOgImageUrl } from '@/lib/utils/ogImage';
import { safeJsonLd } from '@/lib/utils/jsonLd';

const SITE_URL = 'https://www.vidahome.es';

// generateMetadata y la página piden el mismo artículo: una sola consulta por petición.
const getPost = cache(async (locale: string, slug: string) => getBlogPostBySlugAction(locale, slug));

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
    const { locale, slug } = await params;
    const result = await getPost(locale, slug);

    if (!result.success || !result.data) notFound();

    const post = result.data;
    const url = `${SITE_URL}/${locale}/blog/${slug}`;
    const description = post.meta_description || post.excerpt || plainDescription(post.content);
    // Regla del CLAUDE.md: el og:image nunca es la foto cruda, pasa por el optimizador.
    const image = post.featured_image_url ? toOgImageUrl(SITE_URL, post.featured_image_url) : undefined;

    return {
        title: `${post.title} | Vidahome Blog`,
        description,
        keywords: post.meta_keywords,
        // Sin `languages`: las versiones de un artículo en otros idiomas no están enlazadas
        // en la base de datos, así que no se puede declarar hreflang entre ellas.
        alternates: { canonical: url },
        openGraph: {
            type: 'article',
            title: post.title,
            description,
            url,
            siteName: 'Vidahome',
            publishedTime: post.published_at ?? undefined,
            modifiedTime: post.updated_at ?? undefined,
            authors: post.author ? [post.author] : undefined,
            images: image
                ? [{ url: image, width: 1200, height: 675, alt: post.featured_image_alt || post.title }]
                : undefined,
        },
        twitter: {
            card: image ? 'summary_large_image' : 'summary',
            title: post.title,
            description,
            images: image ? [image] : undefined,
        },
    };
}

export default async function BlogPostPage({
    params,
}: {
    params: Promise<{ locale: string; slug: string }>;
}) {
    const { locale, slug } = await params;
    const [result, t] = await Promise.all([
        getPost(locale, slug),
        getTranslations({ locale, namespace: 'Blog' }),
    ]);

    if (!result.success || !result.data) notFound();

    const post = result.data;
    const url = `${SITE_URL}/${locale}/blog/${slug}`;
    const description = post.meta_description || post.excerpt || plainDescription(post.content);
    const ogImage = post.featured_image_url ? toOgImageUrl(SITE_URL, post.featured_image_url) : undefined;

    const postingLd = buildBlogPostingJsonLd({ post, locale, url, description, imageUrl: ogImage });
    const faqLd = buildFaqJsonLd(extractFaq(post.content));

    const related = await getRelatedBlogPostsAction(locale, post.id, post.category_id);
    const relatedPosts = related.success && related.data ? related.data : [];

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: safeJsonLd(postingLd) }}
            />
            {faqLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: safeJsonLd(faqLd) }}
                />
            )}

            {/* Hero/Featured Image */}
            {post.featured_image_url && (
                <div className="relative w-full h-96 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 overflow-hidden">
                    <Image
                        src={post.featured_image_url}
                        alt={post.featured_image_alt || post.title}
                        fill
                        priority
                        sizes="100vw"
                        className="object-cover"
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
                        ← {t('backToBlog')}
                    </Link>

                    <h1 className="text-5xl md:text-6xl font-serif mb-6 leading-tight">
                        {post.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                        {post.published_at && (
                            <time dateTime={post.published_at}>
                                {new Date(post.published_at).toLocaleDateString(
                                    locale,
                                    {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    }
                                )}
                            </time>
                        )}

                        {post.author && (
                            <>
                                <span>•</span>
                                <span>{t('by', { author: post.author })}</span>
                            </>
                        )}
                    </div>
                </header>

                {/* Body Content */}
                <BlogMarkdown content={post.content} />

                {/* Footer */}
                <footer className="mt-20 pt-12 border-t border-slate-100 dark:border-slate-800">
                    {post.meta_keywords && (
                        <div className="mb-8">
                            <p className="text-xs text-slate-500 mb-2">{t('tags')}</p>
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

            {/* Related Posts: enlaces internos a otros artículos del mismo idioma */}
            {relatedPosts.length > 0 && (
                <section className="bg-slate-50 dark:bg-slate-900/50 py-20 px-8">
                    <div className="max-w-5xl mx-auto">
                        <h2 className="text-2xl font-serif mb-8">{t('moreArticles')}</h2>
                        <ul className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {relatedPosts.map((related) => (
                                <li key={related.id}>
                                    <Link
                                        href={`/blog/${related.slug}`}
                                        className="group block"
                                    >
                                        <h3 className="text-lg font-serif mb-2 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                                            {related.title}
                                        </h3>
                                        {related.excerpt && (
                                            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
                                                {related.excerpt}
                                            </p>
                                        )}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>
            )}
        </div>
    );
}

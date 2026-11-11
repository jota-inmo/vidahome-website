import React from 'react';
import Image from 'next/image';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getBlogPostsAction } from '@/app/actions/blog';
import { Link } from '@/i18n/routing';
import { plainDescription } from '@/lib/blog/markdown-utils';

export const revalidate = 60; // revalidate every 60 seconds

const SITE_URL = 'https://www.vidahome.es';
const SUPPORTED_LOCALES = ['es', 'en', 'fr', 'de', 'it', 'pl'] as const;
const PAGE_SIZE = 12;

type SearchParams = Promise<{ page?: string }>;

function parsePage(raw?: string): number {
    const n = Number.parseInt(raw ?? '1', 10);
    return Number.isFinite(n) && n > 1 ? n : 1;
}

export async function generateMetadata({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>;
    searchParams: SearchParams;
}): Promise<Metadata> {
    const { locale } = await params;
    const page = parsePage((await searchParams).page);
    const t = await getTranslations({ locale, namespace: 'Metadata' });
    const title = t('blogTitle');
    const description = t('blogDescription');
    const path = `/${locale}/blog`;
    const canonical = page > 1 ? `${SITE_URL}${path}?page=${page}` : `${SITE_URL}${path}`;

    // hreflang solo en la primera página: las siguientes no tienen equivalente fijo por idioma.
    const languages: Record<string, string> = {};
    for (const l of SUPPORTED_LOCALES) {
        languages[l] = `${SITE_URL}/${l}/blog`;
    }
    languages['x-default'] = `${SITE_URL}/es/blog`;

    return {
        title,
        description,
        alternates: {
            canonical,
            ...(page === 1 ? { languages } : {}),
        },
        openGraph: {
            title,
            description,
            url: canonical,
            siteName: 'Vidahome',
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
        },
    };
}

export default async function BlogPage({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>;
    searchParams: SearchParams;
}) {
    const { locale } = await params;
    const page = parsePage((await searchParams).page);
    const t = await getTranslations('Blog');
    const result = await getBlogPostsAction(locale, page, PAGE_SIZE);
    const totalPages = Math.max(1, Math.ceil((result.total ?? 0) / PAGE_SIZE));

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
            {/* Header */}
            <header className="px-8 py-20 max-w-[1600px] mx-auto border-b border-slate-50 dark:border-slate-900 mb-12">
                <div className="text-center md:text-left">
                    <span className="text-[10px] tracking-[0.4em] uppercase text-slate-400 mb-4 block">
                        Blog
                    </span>
                    <h1 className="text-5xl md:text-6xl font-serif mb-6 leading-[1.1]">
                        {t('title') || 'Blog'}
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
                        {t('description') ||
                            'Artículos sobre propiedades, mercado inmobiliario y consejos para compradores.'}
                    </p>
                </div>
            </header>

            {/* Blog Posts */}
            <div className="max-w-[1600px] mx-auto px-8 pb-20">
                {result.success && result.data && result.data.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {result.data.map((post) => (
                            <article
                                key={post.id}
                                className="group border border-slate-100 dark:border-slate-800 rounded-lg overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                            >
                                {/* Image placeholder */}
                                {post.featured_image_url && (
                                    <div className="relative w-full h-48 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 overflow-hidden">
                                        <Image
                                            src={post.featured_image_url}
                                            alt={post.featured_image_alt || post.title}
                                            fill
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            className="object-cover group-hover:scale-105 transition-transform"
                                        />
                                    </div>
                                )}

                                {/* Content */}
                                <div className="p-6">
                                    <div className="text-xs text-slate-400 mb-2">
                                        {post.published_at &&
                                            new Date(post.published_at).toLocaleDateString(
                                                locale,
                                                {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                }
                                            )}
                                    </div>

                                    <h3 className="text-lg font-serif mb-3 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                                        {post.title}
                                    </h3>

                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-3">
                                        {post.excerpt || plainDescription(post.content, 150)}
                                    </p>

                                    <a
                                        href={`/${locale}/blog/${post.slug}`}
                                        className="text-sm font-medium text-slate-900 dark:text-white inline-flex items-center gap-2 group/link hover:gap-3 transition-all"
                                    >
                                        {t('readMore') || 'Leer más'}
                                        <span className="group-hover/link:translate-x-1 transition-transform">→</span>
                                    </a>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 border border-slate-100 dark:border-slate-800 rounded-lg">
                        <p className="text-slate-500 dark:text-slate-400 mb-2">
                            {t('noPosts') || 'No hay posts disponibles aún'}
                        </p>
                        <p className="text-xs text-slate-400">
                            {t('noPostsDesc') || 'Pronto habrá contenido interesante...'}
                        </p>
                    </div>
                )}

                {totalPages > 1 && (
                    <nav
                        aria-label="Blog"
                        className="mt-16 flex items-center justify-between gap-4 text-sm"
                    >
                        {page > 1 ? (
                            <Link
                                href={page === 2 ? '/blog' : `/blog?page=${page - 1}`}
                                rel="prev"
                                className="font-medium hover:underline underline-offset-4"
                            >
                                ← {t('prevPage')}
                            </Link>
                        ) : (
                            <span />
                        )}
                        <span className="text-slate-500">
                            {t('pageOf', { page, total: totalPages })}
                        </span>
                        {page < totalPages ? (
                            <Link
                                href={`/blog?page=${page + 1}`}
                                rel="next"
                                className="font-medium hover:underline underline-offset-4"
                            >
                                {t('nextPage')} →
                            </Link>
                        ) : (
                            <span />
                        )}
                    </nav>
                )}
            </div>
        </div>
    );
}

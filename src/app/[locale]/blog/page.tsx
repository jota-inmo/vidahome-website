import React from 'react';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getBlogPostsAction } from '@/app/actions/blog';

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('Blog');
    return {
        title: `${t('title')} | Vidahome`,
        description: t('description'),
    };
}

export default async function BlogPage({ params }: { params: { locale: string } }) {
    const t = await getTranslations('Blog');
    const result = await getBlogPostsAction(params.locale, 1, 10);

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
                                    <div className="w-full h-48 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center overflow-hidden">
                                        <img
                                            src={post.featured_image_url}
                                            alt={post.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                        />
                                    </div>
                                )}

                                {/* Content */}
                                <div className="p-6">
                                    <div className="text-xs text-slate-400 mb-2">
                                        {new Date(post.published_at).toLocaleDateString(
                                            params.locale === 'es' ? 'es-ES' : 'en-US',
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
                                        {post.excerpt || post.content.substring(0, 150)}...
                                    </p>

                                    <a
                                        href={`/${params.locale}/blog/${post.slug}`}
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
            </div>
        </div>
    );
}

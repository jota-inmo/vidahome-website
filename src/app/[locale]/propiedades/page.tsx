import React from 'react';
import { Metadata } from 'next';
import { fetchPropertiesAction } from '@/app/actions';
import { PropertyCatalogClient } from './PropertyCatalogClient';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('Index');
    return {
        title: `${t('portfolio')} | Vidahome`,
        description: t('description'),
    };
}

export default async function PropiedadesPage() {
    const result = await fetchPropertiesAction();
    const properties = result.success ? (result.data || []) : [];
    const populations = result.meta?.populations || [];
    const error = result.success ? null : result.error;

    const t = await getTranslations('Index');
    const f = await getTranslations('Footer');

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-slate-900 selection:text-white dark:selection:bg-white dark:selection:text-slate-900">
            {/* Header Minimalista */}
            <header className="px-8 py-12 max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center border-b border-slate-50 dark:border-slate-900 mb-12">
                <div className="text-center md:text-left">
                    <span className="text-[10px] tracking-[0.4em] uppercase text-slate-400 mb-4 block">{t('portfolio')}</span>
                    <h1 className="text-4xl md:text-6xl font-serif mb-6 leading-[1.1]">{t('title').split(' ').join(' \n')}</h1>
                </div>
                <div className="mt-8 md:mt-0 max-w-xs text-right hidden md:block">
                    <p className="text-sm text-slate-400 leading-relaxed font-light">
                        {t('description')}
                    </p>
                </div>
            </header>

            {error && (
                <div className="max-w-[1600px] mx-auto px-8 mb-12">
                    <div className="text-center py-20 border border-red-100 bg-red-50/30 rounded-lg">
                        <p className="font-serif text-2xl text-red-800 mb-2">Inconveniente Técnico</p>
                        <p className="text-sm text-red-600 font-light">{error}</p>
                    </div>
                </div>
            )}

            <PropertyCatalogClient initialProperties={properties} populations={populations} />

            <footer className="px-8 py-20 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-900">
                <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-[10px] tracking-[0.3em] uppercase text-slate-400">
                        {f('rights', { year: 2026 })}
                    </div>
                    <div className="flex gap-12 text-[10px] tracking-[0.2em] uppercase font-medium">
                        <Link href="/legal/aviso-legal" className="hover:opacity-50 transition-all">{f('aviso')}</Link>
                        <Link href="/legal/privacidad" className="hover:opacity-50 transition-all">{f('privacidad')}</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}

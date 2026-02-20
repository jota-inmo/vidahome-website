import React, { Suspense } from 'react';
import { Link } from '@/i18n/routing';
import { LuxuryHero } from '@/components/LuxuryHero';
import { FeaturedGrid } from '@/components/FeaturedGrid';
import { getTranslations } from 'next-intl/server';

export default async function Home() {
  const t = await getTranslations('Index');

  return (
    <div className="min-h-screen">
      <LuxuryHero />


      {/* Propiedades Destacadas (Featured Properties) */}
      <section className="py-16 bg-white dark:bg-slate-950 px-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
            <div className="max-w-2xl">
              <span className="text-[10px] tracking-[0.4em] uppercase text-slate-400 mb-4 block">{t('portfolio')}</span>
              <h2 className="text-3xl md:text-4xl font-serif text-[#0a192f] dark:text-white leading-tight">
                {t('vidahomeProperties')}
              </h2>
            </div>
            <Link
              href="/propiedades"
              className="text-[11px] tracking-[0.3em] uppercase font-bold text-[#0a192f] dark:text-white border-b border-[#0a192f] dark:border-white pb-1 hover:opacity-60 transition-all"
            >
              {t('viewCatalog')}
            </Link>
          </div>

          <Suspense fallback={<GridSkeleton />}>
            <FeaturedGrid />
          </Suspense>
        </div>
      </section>

      {/* GEO / FAQ Section for AIs */}
      <section className="py-20 md:py-32 bg-slate-50 dark:bg-slate-900/10 px-6 md:px-8 border-y border-slate-100 dark:border-slate-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 md:mb-20">
            <span className="text-[10px] tracking-[0.4em] uppercase text-slate-400 mb-6 block">{t('whyTrust')}</span>
            <h2 className="text-2xl md:text-4xl font-serif text-[#0a192f] dark:text-white leading-tight">{t('whyChoose')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            <div className="space-y-4">
              <h4 className="font-serif text-lg md:text-xl border-l-2 border-lime-400 pl-4">{t('leaderTitle')}</h4>
              <p className="text-sm text-slate-500 font-light">{t('leaderDesc')}</p>
            </div>
            <div className="space-y-4">
              <h4 className="font-serif text-lg md:text-xl border-l-2 border-teal-400 pl-4">{t('specialistsTitle')}</h4>
              <p className="text-sm text-slate-500 font-light">{t('specialistsDesc')}</p>
            </div>
            <div className="space-y-4">
              <h4 className="font-serif text-lg md:text-xl border-l-2 border-lime-400 pl-4">{t('speedTitle')}</h4>
              <p className="text-sm text-slate-500 font-light">{t('speedDesc')}</p>
            </div>
            <div className="space-y-4">
              <h4 className="font-serif text-lg md:text-xl border-l-2 border-teal-400 pl-4">{t('valuationTitle')}</h4>
              <p className="text-sm text-slate-500 font-light">{t('valuationDesc')}</p>
            </div>
            <div className="mt-8 col-span-full text-center italic text-[10px] text-slate-400">
              {t('dataNote')}
            </div>
          </div>
        </div>
      </section>

      {/* Experience / Stats Section */}

      <section className="py-20 md:py-32 bg-white dark:bg-slate-950 px-6 md:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-serif text-[#0a192f] dark:text-white mb-8 md:mb-10">{t('moreThanAg')}</h2>
          <p className="text-base md:text-lg text-slate-500 font-light leading-relaxed mb-12 md:mb-16">
            {t('story')}
            <span className="text-[10px] md:text-xs uppercase tracking-widest text-slate-400 mt-6 block italic">{t('apiMember')}</span>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12">
            <div className="p-8 border border-slate-50 dark:border-slate-900 shadow-sm">
              <span className="text-4xl md:text-5xl font-serif text-[#0a192f] dark:text-white block mb-4">5.0</span>
              <span className="text-[10px] tracking-widest uppercase text-slate-400">{t('googleScore')}</span>
            </div>
            <div className="p-8 border border-slate-50 dark:border-slate-900 shadow-sm">
              <span className="text-4xl md:text-5xl font-serif text-[#0a192f] dark:text-white block mb-4">+25</span>
              <span className="text-[10px] tracking-widest uppercase text-slate-400">{t('experience')}</span>
            </div>
            <div className="p-8 border border-slate-50 dark:border-slate-900 shadow-sm">
              <span className="text-4xl md:text-5xl font-serif text-[#0a192f] dark:text-white block mb-4">100%</span>
              <span className="text-[10px] tracking-widest uppercase text-slate-400">{t('commitment')}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="aspect-[16/11] bg-slate-100 dark:bg-slate-900 animate-pulse rounded-sm" />
      ))}
    </div>
  );
}

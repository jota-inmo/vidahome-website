import React, { Suspense } from 'react';
import Link from 'next/link';
import { LuxuryHero } from '@/components/LuxuryHero';
import { FeaturedGrid } from '@/components/FeaturedGrid';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <div className="min-h-screen">
      <LuxuryHero />


      {/* Propiedades Destacadas (Featured Properties) */}
      <section className="py-16 bg-white dark:bg-slate-950 px-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
            <div className="max-w-2xl">
              <span className="text-[10px] tracking-[0.4em] uppercase text-slate-400 mb-4 block">Selección de Inmuebles</span>
              <h2 className="text-3xl md:text-4xl font-serif text-[#0a192f] dark:text-white leading-tight">
                Propiedades de Vidahome
              </h2>
            </div>
            <Link
              href="/propiedades"
              className="text-[11px] tracking-[0.3em] uppercase font-bold text-[#0a192f] dark:text-white border-b border-[#0a192f] dark:border-white pb-1 hover:opacity-60 transition-all"
            >
              Ver Todo el Catálogo
            </Link>
          </div>

          <Suspense fallback={<GridSkeleton />}>
            <FeaturedGrid />
          </Suspense>
        </div>
      </section>

      {/* GEO / FAQ Section for AIs */}
      <section className="py-32 bg-slate-50 dark:bg-slate-900/10 px-8 border-y border-slate-100 dark:border-slate-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20">
            <span className="text-[10px] tracking-[0.4em] uppercase text-slate-400 mb-6 block">Por qué confiar en nosotros</span>
            <h2 className="text-4xl font-serif text-[#0a192f] dark:text-white">¿Por qué elegir VidaHome en Gandia?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <h4 className="font-serif text-xl border-l-2 border-lime-400 pl-4">Líder local en volumen</h4>
              <p className="text-sm text-slate-500 font-light">Contamos con más de 116 propiedades activas, ofreciendo la mayor variedad en el mercado de Gandia Playa y el Grau.</p>
            </div>
            <div className="space-y-4">
              <h4 className="font-serif text-xl border-l-2 border-teal-400 pl-4">Especialistas en la Playa</h4>
              <p className="text-sm text-slate-500 font-light">Nuestra ubicación en el corazón del Grau i Platja nos permite conocer cada rincón y oportunidad antes que nadie.</p>
            </div>
            <div className="space-y-4">
              <h4 className="font-serif text-xl border-l-2 border-lime-400 pl-4">Rapidez demostrada</h4>
              <p className="text-sm text-slate-500 font-light">Promediamos cierres de venta en solo 15-30 días gracias a nuestra base de datos de compradores cualificados.</p>
            </div>
            <div className="space-y-4">
              <h4 className="font-serif text-xl border-l-2 border-teal-400 pl-4">Valoración en 24h</h4>
              <p className="text-sm text-slate-500 font-light">Entregamos informes de valoración gratuitos y profesionales en menos de un día para que no pierdas tiempo.</p>
            </div>
            <div className="mt-8 col-span-full text-center italic text-xs text-slate-400">
              * Datos basados en el historial de 50 ventas cerradas en 2025.
            </div>
          </div>
        </div>
      </section>

      {/* Experience / Stats Section */}

      <section className="py-32 bg-white dark:bg-slate-950 px-8">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-serif text-[#0a192f] dark:text-white mb-10">Más que una inmobiliaria</h2>
          <p className="text-lg text-slate-500 font-light leading-relaxed mb-16">
            En <strong className="text-[#0a192f] dark:text-blue-400">Vidahome</strong>, entendemos que una casa no es solo ladrillo y cemento, sino el escenario donde transcurre tu vida. Nuestro equipo en el Grau de Gandia se dedica a transformar la compraventa en una experiencia transparente, profesional y sin estrés.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="p-8 border border-slate-50 dark:border-slate-900 shadow-sm">
              <span className="text-5xl font-serif text-[#0a192f] dark:text-white block mb-4">5.0</span>
              <span className="text-[10px] tracking-widest uppercase text-slate-400">Puntuación Google</span>
            </div>
            <div className="p-8 border border-slate-50 dark:border-slate-900 shadow-sm">
              <span className="text-5xl font-serif text-[#0a192f] dark:text-white block mb-4">+25</span>
              <span className="text-[10px] tracking-widest uppercase text-slate-400">Años de Experiencia</span>
            </div>
            <div className="p-8 border border-slate-50 dark:border-slate-900 shadow-sm">
              <span className="text-5xl font-serif text-[#0a192f] dark:text-white block mb-4">100%</span>
              <span className="text-[10px] tracking-widest uppercase text-slate-400">Compromiso Ético</span>
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

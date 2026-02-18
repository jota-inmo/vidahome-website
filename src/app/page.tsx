'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { LuxuryPropertyCard } from '@/components/LuxuryPropertyCard';
import { fetchPropertiesAction, getFeaturedPropertiesAction } from './actions';
import { PropertyListEntry } from '@/types/inmovilla';
import { LuxuryHero } from '@/components/LuxuryHero';

export default function Home() {
  return (
    <div className="min-h-screen">
      <LuxuryHero />

      {/* Propiedades Destacadas (Featured Properties) */}
      <section className="py-16 bg-white dark:bg-slate-950 px-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
            <div className="max-w-2xl">
              <span className="text-[10px] tracking-[0.4em] uppercase text-slate-400 mb-4 block">Nuestra Selección</span>
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

          <FeaturedGrid />
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

      {/* Location Footer / Info */}
      <footer className="py-24 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-900 px-8">
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-16">
          <div>
            <h4 className="font-serif text-xl mb-6">Nuestra Sede</h4>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Vidahome+Gandia+Carrer+Joan+XXIII+1"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-slate-500 leading-relaxed font-light hover:text-[#2dd4bf] transition-all block"
            >
              Carrer Joan XXIII, 1, 46730 <br />
              Grau i Platja, Gandia, Valencia
            </a>
          </div>
          <div>
            <h4 className="font-serif text-xl mb-6">Contacto Directo</h4>
            <div className="flex flex-col gap-2">
              <a href="tel:+34659027512" className="text-sm text-slate-500 leading-relaxed font-light hover:text-[#2dd4bf] transition-all">
                Llamar: (+34) 659 02 75 12
              </a>
              <a href="mailto:info@vidahome.es" className="text-sm text-slate-500 leading-relaxed font-light hover:text-[#2dd4bf] transition-all">
                Email: info@vidahome.es
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-serif text-xl mb-6">Horario de Agencia</h4>
            <p className="text-sm text-slate-500 leading-relaxed font-light">
              Lunes - Viernes: 09:00 - 14:00 y 17:00 - 19:00<br />
              Sábado: 09:30 - 13:30<br />
              Fuera de horario con cita previa.
            </p>
          </div>
        </div>
        <div className="max-w-[1600px] mx-auto mt-20 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[10px] tracking-[0.3em] uppercase text-slate-400">
            © 2026 Vidahome Premium Experience - Acompañamiento Profesional y Completo
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeaturedGrid() {
  const [featured, setFeatured] = useState<PropertyListEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { getFeaturedPropertiesWithDetailsAction } = await import('./actions');
        const res = await getFeaturedPropertiesWithDetailsAction();

        if (res.success && res.data) {
          setFeatured(res.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="aspect-[16/11] bg-slate-100 dark:bg-slate-900 animate-pulse rounded-sm" />
        ))}
      </div>
    );
  }

  if (featured.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-24">
      {featured.map((prop) => (
        <div key={prop.cod_ofer} className="animate-fade-up">
          <LuxuryPropertyCard property={prop} />
        </div>
      ))}
    </div>
  );
}

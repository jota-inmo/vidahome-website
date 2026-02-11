'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { LuxuryPropertyCard } from '@/components/LuxuryPropertyCard';
import { fetchPropertiesAction, getFeaturedPropertiesAction } from './actions';
import { PropertyListEntry } from '@/types/inmovilla';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-[#0a192f]">
        {/* Background Image Overlay */}
        {/* Background Video */}
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2000&auto=format&fit=crop"
          className="absolute inset-0 z-0 w-full h-full object-cover opacity-50 grayscale-0"
        >
          <source src="https://assets.mixkit.co/videos/preview/mixkit-modern-apartment-with-an-ocean-view-1768-large.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a192f]/80 via-[#0a192f]/40 to-[#0a192f]" />

        <div className="relative z-10 max-w-5xl mx-auto px-8 text-center text-white">
          <span className="text-[10px] tracking-[0.5em] uppercase font-bold mb-8 block animate-fade-in opacity-80">
            No te mostramos lo que tenemos, encontramos lo que buscas. Donde el diseño arquitectónico se une con la ubicación perfecta.
          </span>
          <h1 className="text-6xl md:text-8xl font-serif mb-12 leading-tight">
            La llave de tu nueva <br /> <span className="italic">Vida</span> empieza aquí.
          </h1>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-16">
            <Link
              href="/propiedades"
              className="px-12 py-5 bg-white text-[#0a192f] text-[11px] uppercase tracking-[0.3em] font-bold hover:bg-gradient-to-r hover:from-lime-400 hover:to-teal-500 hover:text-[#0a192f] transition-all rounded-sm"
            >
              Explorar Catálogo
            </Link>
          </div>

          {/* Home Search Bar Mini */}
          <div className="max-w-3xl mx-auto bg-white/10 backdrop-blur-xl p-2 rounded-sm border border-white/20">
            <div className="flex flex-col md:flex-row gap-2">
              <input
                type="text"
                placeholder="Busca por ubicación, tipo o referencia..."
                className="flex-grow bg-white/5 border-none text-white placeholder:text-white/40 text-sm py-4 px-6 focus:ring-0"
              />
              <Link
                href="/propiedades"
                className="bg-white text-[#0a192f] px-10 py-4 text-[10px] uppercase tracking-widest font-bold hover:bg-opacity-90 transition-all"
              >
                Buscar
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Propiedades Destacadas (Featured Properties) */}
      <section className="py-24 bg-white dark:bg-slate-950 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div className="max-w-2xl">
              <span className="text-[10px] tracking-[0.4em] uppercase text-slate-400 mb-4 block">Nuestra Selección</span>
              <h2 className="text-4xl md:text-5xl font-serif text-[#0a192f] dark:text-white leading-tight">
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
      </section >

      {/* Intro Section */}
      < section className="py-32 bg-white dark:bg-slate-950 px-8" >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-serif text-[#0a192f] dark:text-white mb-10">Más que una inmobiliaria</h2>
          <p className="text-lg text-slate-500 font-light leading-relaxed mb-16">
            En <strong className="text-[#0a192f] dark:text-blue-400">Vidahome</strong>, entendemos que una casa no es solo ladrillo y cemento, sino el escenario donde transcurre tu vida. Con más de 125 reseñas de 5 estrellas, nuestro equipo en el Grau de Gandia se dedica a transformar la compraventa en una experiencia transparente y sin estrés.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="p-8 border border-slate-50 dark:border-slate-900">
              <span className="text-5xl font-serif text-[#0a192f] dark:text-white block mb-4">5.0</span>
              <span className="text-[10px] tracking-widest uppercase text-slate-400">Puntuación Google</span>
            </div>
            <div className="p-8 border border-slate-50 dark:border-slate-900">
              <span className="text-5xl font-serif text-[#0a192f] dark:text-white block mb-4">+1k</span>
              <span className="text-[10px] tracking-widest uppercase text-slate-400">Clientes Satisfechos</span>
            </div>
            <div className="p-8 border border-slate-50 dark:border-slate-900">
              <span className="text-5xl font-serif text-[#0a192f] dark:text-white block mb-4">#1</span>
              <span className="text-[10px] tracking-widest uppercase text-slate-400">Expertos en Gandia Playa</span>
            </div>
          </div>
        </div>
      </section >

      {/* Location Footer / Info */}
      < footer className="py-24 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-900 px-8" >
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16">
          <div>
            <h4 className="font-serif text-xl mb-6">Nuestra Sede</h4>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Vidahome+Gandia+Carrer+Joan+XXIII+1"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-slate-500 leading-relaxed font-light hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-lime-500 hover:to-teal-500 transition-all block"
            >
              Carrer Joan XXIII, 1, 46730 <br />
              Grau i Platja, Gandia, Valencia
            </a>
          </div>
          <div>
            <h4 className="font-serif text-xl mb-6">Contacto Directo</h4>
            <div className="flex flex-col gap-2">
              <a href="tel:+34659027512" className="text-sm text-slate-500 leading-relaxed font-light hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-lime-500 hover:to-teal-500 transition-all">
                Llamar: (+34) 659 02 75 12
              </a>
              <a href="mailto:info@vidahome.es" className="text-sm text-slate-500 leading-relaxed font-light hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-lime-500 hover:to-teal-500 transition-all">
                Email: info@vidahome.es
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-serif text-xl mb-6">Horario Boutique</h4>
            <p className="text-sm text-slate-500 leading-relaxed font-light">
              Lunes - Viernes: 09:30 - 19:30<br />
              Cita previa disponible.
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[10px] tracking-[0.3em] uppercase text-slate-400">
            © 2026 Vidahome Premium Experience - Acompañamiento Profesional y Completo
          </p>
        </div>
      </footer >
    </div >
  );
}

function FeaturedGrid() {
  const [featured, setFeatured] = useState<PropertyListEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [allRes, featuredIds] = await Promise.all([
          fetchPropertiesAction(),
          getFeaturedPropertiesAction()
        ]);

        if (allRes.success && allRes.data) {
          if (featuredIds.length > 0) {
            // Filter by the selected IDs
            const filtered = allRes.data.filter(p => featuredIds.includes(p.cod_ofer));
            setFeatured(filtered);
          } else {
            // Fallback: Show first 6 if none selected
            setFeatured(allRes.data.slice(0, 6));
          }
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
      {featured.map((prop) => (
        <div key={prop.cod_ofer} className="animate-fade-up">
          <LuxuryPropertyCard property={prop} />
        </div>
      ))}
    </div>
  );
}

import React from 'react';
import { Metadata } from 'next';
import { fetchPropertiesAction } from '../actions';
import { PropertyCatalogClient } from './PropertyCatalogClient';

export const metadata: Metadata = {
    title: 'Catálogo de Propiedades Exclusivas en Gandia | Vidahome',
    description: 'Encuentra tu próximo hogar en La Safor. Selección de apartamentos, villas y casas exclusivas en Gandia, Oliva y alrededores.',
    openGraph: {
        title: 'Catálogo de Propiedades en Gandia | Vidahome',
        description: 'Venta y alquiler de propiedades exclusivas en la zona de La Safor.',
        type: 'website',
    }
};

export default async function PropiedadesPage() {
    const result = await fetchPropertiesAction();
    const properties = result.success ? (result.data || []) : [];
    const populations = result.meta?.populations || [];
    const error = result.success ? null : result.error;

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-slate-900 selection:text-white dark:selection:bg-white dark:selection:text-slate-900">
            {/* Header Minimalista */}
            <header className="px-8 py-12 max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center border-b border-slate-50 dark:border-slate-900 mb-12">
                <div className="text-center md:text-left">
                    <span className="text-[10px] tracking-[0.4em] uppercase text-slate-400 mb-4 block">Portfolio</span>
                    <h1 className="text-4xl md:text-6xl font-serif mb-6 leading-[1.1]">Selección de <br /> Inmuebles</h1>
                </div>
                <div className="mt-8 md:mt-0 max-w-xs text-right hidden md:block">
                    <p className="text-sm text-slate-400 leading-relaxed font-light">
                        No te mostramos lo que tenemos, encontramos lo que buscas. Donde el diseño arquitectónico se une con la ubicación perfecta.
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
                        © 2026 Vidahome Premium Experience - Acompañamiento Profesional y Completo
                    </div>
                    <div className="flex gap-12 text-[10px] tracking-[0.2em] uppercase font-medium">
                        <a href="/legal/aviso-legal" className="hover:opacity-50 transition-all">Aviso legal</a>
                        <a href="/legal/privacidad" className="hover:opacity-50 transition-all">Política de privacidad</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

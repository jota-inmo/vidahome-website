'use client';

import React, { useEffect, useState } from 'react';
import { PropertyListEntry } from '@/types/inmovilla';
import { fetchPropertiesAction } from '../actions';
import { PropertySearch, SearchFilters } from '@/components/PropertySearch';
import { LuxuryPropertyCard } from '@/components/LuxuryPropertyCard';
import { PropertySkeleton } from '@/components/LuxuryPropertySkeleton';

export default function PropiedadesPage() {
    const [allProperties, setAllProperties] = useState<PropertyListEntry[]>([]);
    const [filteredProperties, setFilteredProperties] = useState<PropertyListEntry[]>([]);
    const [populations, setPopulations] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadItems = async () => {
            try {
                const result = await fetchPropertiesAction();
                if (result.success && result.data) {
                    setAllProperties(result.data);
                    // Filter by Buy (keyacci: 1) by default
                    setFilteredProperties(result.data.filter(p => !p.keyacci || p.keyacci === 1));
                    if ((result as any).meta?.populations) {
                        setPopulations((result as any).meta.populations);
                    }
                }
                else {
                    setError(result.error || 'Error al cargar inmuebles');
                }
            } catch (err) {
                setError('Ocurrió un error inesperado');
            } finally {
                setLoading(false);
            }
        };

        loadItems();
    }, []);

    const handleSearch = (filters: SearchFilters) => {
        let filtered = [...allProperties];

        // Filter by Transaction Type (keyacci)
        // 1 = Venta (Buy), 2 = Alquiler (Rent)
        const targetAcci = filters.type === 'buy' ? 1 : 2;
        filtered = filtered.filter(p => !p.keyacci || p.keyacci === targetAcci);

        // Filter by Population
        if (filters.population) {
            filtered = filtered.filter(p => p.poblacion === filters.population);
        }

        // Filter by Text/Ref
        if (filters.query) {
            const q = filters.query.toLowerCase();
            filtered = filtered.filter(p =>
                p.ref.toLowerCase().includes(q) ||
                (p.descripciones && p.descripciones.toLowerCase().includes(q)) ||
                (p.poblacion && p.poblacion.toLowerCase().includes(q))
            );
        }

        setFilteredProperties(filtered);
    };

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-slate-900 selection:text-white dark:selection:bg-white dark:selection:text-slate-900">
            {/* Header Minimalista */}
            <header className="px-8 py-12 max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center border-b border-slate-50 dark:border-slate-900 mb-12">
                <div className="text-center md:text-left">
                    <span className="text-[10px] tracking-[0.4em] uppercase text-slate-400 mb-4 block">Portfolio</span>
                    <h1 className="text-4xl md:text-6xl font-serif mb-6 leading-[1.1]">Inmuebles <br /> de Selección</h1>
                </div>
                <div className="mt-8 md:mt-0 max-w-xs text-right hidden md:block">
                    <p className="text-sm text-slate-400 leading-relaxed font-light">
                        No te mostramos lo que tenemos, encontramos lo que buscas. Donde el diseño arquitectónico se une con la ubicación perfecta.
                    </p>
                </div>
            </header>

            <PropertySearch onSearch={handleSearch} populations={populations} />

            <main className="px-8 max-w-[1600px] mx-auto pb-32">
                {error && (
                    <div className="text-center py-20 border border-red-100 bg-red-50/30 rounded-lg">
                        <p className="font-serif text-2xl text-red-800 mb-2">Inconveniente Técnico</p>
                        <p className="text-sm text-red-600 font-light">{error}</p>
                    </div>
                )}

                {/* Grid de Propiedades */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-24">
                    {loading ? (
                        // Esqueletos de Carga
                        [1, 2, 4, 5].map((i) => <PropertySkeleton key={i} />)
                    ) : filteredProperties.length > 0 ? (
                        filteredProperties.map((prop: PropertyListEntry) => (
                            <LuxuryPropertyCard key={prop.cod_ofer} property={prop} />
                        ))
                    ) : !error && (
                        <div className="col-span-full py-32 text-center">
                            <p className="font-serif text-3xl text-slate-300">Sin registros disponibles actualmente.</p>
                        </div>
                    )}
                </div>
            </main>

            <footer className="px-8 py-20 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-900">
                <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-[10px] tracking-[0.3em] uppercase text-slate-400">
                        © 2026 Vidahome Premium Experience - Acompañamiento Profesional y Completo
                    </div>
                    <div className="flex gap-12 text-[10px] tracking-[0.2em] uppercase font-medium">
                        <a href="#" className="hover:opacity-50 transition-all">Condiciones de Venta</a>
                        <a href="#" className="hover:opacity-50 transition-all">Política de Privacidad</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

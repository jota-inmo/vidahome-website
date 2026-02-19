'use client';

import React, { useState } from 'react';
import { PropertyListEntry } from '@/types/inmovilla';
import { PropertySearch, SearchFilters } from '@/components/PropertySearch';
import { LuxuryPropertyCard } from '@/components/LuxuryPropertyCard';
import { PropertySkeleton } from '@/components/LuxuryPropertySkeleton';

interface PropertyCatalogClientProps {
    initialProperties: PropertyListEntry[];
    populations: string[];
}

export function PropertyCatalogClient({ initialProperties, populations }: PropertyCatalogClientProps) {
    const [allProperties] = useState<PropertyListEntry[]>(initialProperties);
    const [filteredProperties, setFilteredProperties] = useState<PropertyListEntry[]>(
        initialProperties.filter(p => !p.keyacci || p.keyacci === 1) // default to Buy
    );

    const handleSearch = (filters: SearchFilters) => {
        let filtered = [...allProperties];
        const targetAcci = filters.type === 'buy' ? 1 : 2;
        filtered = filtered.filter(p => !p.keyacci || p.keyacci === targetAcci);

        if (filters.population) {
            filtered = filtered.filter(p => p.poblacion === filters.population);
        }

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
        <>
            <PropertySearch onSearch={handleSearch} populations={populations} />

            <main className="px-8 max-w-[1600px] mx-auto pb-32">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-24">
                    {filteredProperties.length > 0 ? (
                        filteredProperties.map((prop: PropertyListEntry) => (
                            <LuxuryPropertyCard key={prop.cod_ofer} property={prop} />
                        ))
                    ) : (
                        <div className="col-span-full py-32 text-center">
                            <p className="font-serif text-3xl text-slate-300">Sin registros disponibles con esos filtros.</p>
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}

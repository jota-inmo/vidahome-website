'use client';

import React, { useMemo, useState } from 'react';
import { PropertyListEntry } from '@/types/inmovilla';
import { PropertySearch, SearchFilters } from '@/components/PropertySearch';
import { LuxuryPropertyCard } from '@/components/LuxuryPropertyCard';
import { useTranslations } from 'next-intl';
import { sortProperties, type SortKey } from '@/lib/utils/property-sort';

interface PropertyCatalogClientProps {
    initialProperties: PropertyListEntry[];
    populations: string[];
    /** Query string pre-filled from the URL ?q= param (e.g. from the hero search). */
    initialQuery?: string;
}

function applyInitialFilter(
    all: PropertyListEntry[],
    initialQuery: string,
): PropertyListEntry[] {
    const filteredByType = all.filter(p => {
        const ref = (p.ref || '').toUpperCase();
        return !ref.startsWith('T') && (!p.keyacci || p.keyacci === 1);
    });
    if (!initialQuery) return filteredByType;
    const q = initialQuery.toLowerCase();
    return filteredByType.filter(p =>
        p.ref.toLowerCase().includes(q) ||
        (p.descripciones && p.descripciones.toLowerCase().includes(q)) ||
        (p.poblacion && p.poblacion.toLowerCase().includes(q))
    );
}

export function PropertyCatalogClient({ initialProperties, populations, initialQuery = '' }: PropertyCatalogClientProps) {
    const [allProperties] = useState<PropertyListEntry[]>(initialProperties);
    const [filteredProperties, setFilteredProperties] = useState<PropertyListEntry[]>(
        () => applyInitialFilter(initialProperties, initialQuery)
    );
    const [sortKey, setSortKey] = useState<SortKey>('recent');
    const t = useTranslations('Search');

    const handleSearch = (filters: SearchFilters) => {
        let filtered = [...allProperties];

        if (filters.type === 'transfer') {
            // Traspasos: ref starts with 'T'
            filtered = filtered.filter(p => (p.ref || '').toUpperCase().startsWith('T'));
        } else {
            // Exclude traspasos from comprar/alquilar
            filtered = filtered.filter(p => !(p.ref || '').toUpperCase().startsWith('T'));
            const targetAcci = filters.type === 'buy' ? 1 : 2;
            filtered = filtered.filter(p => !p.keyacci || p.keyacci === targetAcci);
        }

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

    // Apply sort on top of the current filter result. useMemo so we only
    // re-sort when the filter or sort key actually change.
    const sortedProperties = useMemo(
        () => sortProperties(filteredProperties, sortKey),
        [filteredProperties, sortKey],
    );

    return (
        <>
            <PropertySearch
                onSearch={handleSearch}
                populations={populations}
                initialQuery={initialQuery}
            />

            <main className="px-8 max-w-[1600px] mx-auto pb-32">
                {/* Sort + results count bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-8 mb-4 border-b border-slate-100 dark:border-slate-900">
                    <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400 font-medium">
                        {t('resultsCount', { count: sortedProperties.length })}
                    </span>
                    <label className="flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-slate-400 font-medium">
                        <span>{t('sortBy')}</span>
                        <select
                            value={sortKey}
                            onChange={(e) => setSortKey(e.target.value as SortKey)}
                            className="bg-transparent border border-slate-200 dark:border-slate-800 rounded-sm px-3 py-2 text-slate-900 dark:text-white text-[11px] uppercase tracking-[0.15em] font-medium cursor-pointer focus:outline-none focus:border-slate-400 dark:focus:border-slate-600"
                        >
                            <option value="recent">{t('sortRecent')}</option>
                            <option value="price_asc">{t('sortPriceAsc')}</option>
                            <option value="price_desc">{t('sortPriceDesc')}</option>
                        </select>
                    </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-24">
                    {sortedProperties.length > 0 ? (
                        sortedProperties.map((prop: PropertyListEntry) => (
                            // Use ref as the key — cod_ofer is NULL for every
                            // CRM-published row, so keying by it causes React
                            // reconciliation collisions (duplicate cards and
                            // stale data after sort changes). ref is the PK
                            // of property_metadata and is guaranteed unique.
                            <LuxuryPropertyCard key={prop.ref} property={prop} />
                        ))
                    ) : (
                        <div className="col-span-full py-32 text-center">
                            <p className="font-serif text-3xl text-slate-300">{t('noResults')}</p>
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}

'use client';

import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/routing';
import { PropertyListEntry } from '@/types/inmovilla';
import { PropertySearch, SearchFilters } from '@/components/PropertySearch';
import { LuxuryPropertyCard } from '@/components/LuxuryPropertyCard';
import { useTranslations } from 'next-intl';
import { sortProperties, type SortKey } from '@/lib/utils/property-sort';
import { matchesType } from '@/lib/utils/property-rules';

interface PropertyCatalogClientProps {
    initialProperties: PropertyListEntry[];
    populations: string[];
    /** Filters pre-filled from the URL (?q=, ?type=, ?pop=, ?sort=). */
    initialQuery?: string;
    initialType?: SearchFilters['type'];
    initialPopulation?: string;
    initialSort?: SortKey;
}

/**
 * Applies the active filters to the full property list. Pure — no side
 * effects, easy to reason about and reuse.
 */
function filterProperties(
    all: PropertyListEntry[],
    { query, type, population }: SearchFilters,
): PropertyListEntry[] {
    // Classification (venta / alquiler / traspaso) lives in property-rules.
    // A property with no keyacci is treated as venta and never appears under
    // alquiler — no more `!p.keyacci ||` fallback.
    let filtered = all.filter(p => matchesType(p, type));

    if (population) {
        filtered = filtered.filter(p => p.poblacion === population);
    }

    if (query) {
        const q = query.toLowerCase();
        filtered = filtered.filter(p =>
            p.ref.toLowerCase().includes(q) ||
            (p.descripciones && p.descripciones.toLowerCase().includes(q)) ||
            (p.poblacion && p.poblacion.toLowerCase().includes(q)),
        );
    }

    return filtered;
}

export function PropertyCatalogClient({
    initialProperties,
    populations,
    initialQuery = '',
    initialType = 'buy',
    initialPopulation = '',
    initialSort = 'recent',
}: PropertyCatalogClientProps) {
    const [allProperties] = useState<PropertyListEntry[]>(initialProperties);
    const [filters, setFilters] = useState<SearchFilters>({
        query: initialQuery,
        type: initialType,
        population: initialPopulation,
    });
    const [sortKey, setSortKey] = useState<SortKey>(initialSort);
    const t = useTranslations('Search');

    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Reflect the current filter + sort state into the URL with router.replace
    // (no new history entry, no scroll reset). The defaults (buy / recent) are
    // omitted to keep shared URLs clean.
    const syncUrl = (next: SearchFilters, sort: SortKey) => {
        const params = new URLSearchParams(searchParams?.toString());
        next.query ? params.set('q', next.query) : params.delete('q');
        next.type && next.type !== 'buy' ? params.set('type', next.type) : params.delete('type');
        next.population ? params.set('pop', next.population) : params.delete('pop');
        sort !== 'recent' ? params.set('sort', sort) : params.delete('sort');
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    };

    const handleSearch = (next: SearchFilters) => {
        setFilters(next);
        syncUrl(next, sortKey);
    };

    const handleSortChange = (key: SortKey) => {
        setSortKey(key);
        syncUrl(filters, key);
    };

    const filteredProperties = useMemo(
        () => filterProperties(allProperties, filters),
        [allProperties, filters],
    );

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
                initialType={initialType}
                initialPopulation={initialPopulation}
            />

            <main className="px-8 max-w-[1600px] mx-auto pb-32">
                {/* Sort + results count bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-8 mb-4 border-b border-slate-100 dark:border-slate-900">
                    <span className="text-xs uppercase tracking-[0.2em] text-slate-400 font-medium">
                        {t('resultsCount', { count: sortedProperties.length })}
                    </span>
                    <label className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-400 font-medium">
                        <span>{t('sortBy')}</span>
                        <select
                            value={sortKey}
                            onChange={(e) => handleSortChange(e.target.value as SortKey)}
                            className="bg-transparent border border-slate-200 dark:border-slate-800 rounded-sm px-3 py-2 text-slate-900 dark:text-white text-xs uppercase tracking-[0.15em] font-medium cursor-pointer focus:outline-none focus:border-slate-400 dark:focus:border-slate-600"
                        >
                            <option value="recent">{t('sortRecent')}</option>
                            <option value="price_asc">{t('sortPriceAsc')}</option>
                            <option value="price_desc">{t('sortPriceDesc')}</option>
                        </select>
                    </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 md:gap-y-16">
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

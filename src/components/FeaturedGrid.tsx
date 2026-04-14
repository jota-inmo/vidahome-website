/**
 * FeaturedGrid - Server Component (optimized for SSR)
 * 
 * ✨ Benefits:
 * - Pre-fetches properties on the server (faster SSR)
 * - No useEffect overhead
 * - Cacheable at the server level
 * - Scales well for adding more languages (fr, de, it, etc.)
 * - Better Core Web Vitals (no layout shift)
 */

import React from 'react';
import { PropertyListEntry } from '@/types/inmovilla';
import { LuxuryPropertyCard } from './LuxuryPropertyCard';
import { getFeaturedPropertiesWithDetailsAction } from '@/app/actions';
import { getLocale } from 'next-intl/server';

export async function FeaturedGrid() {
    let featured: PropertyListEntry[] = [];
    let error: string | null = null;

    try {
        const locale = await getLocale();
        const res = await getFeaturedPropertiesWithDetailsAction(locale);
        if (res.success && res.data) {
            featured = res.data;
        } else {
            error = 'Error loading properties';
        }
    } catch (e) {
        console.error('[FeaturedGrid] Error:', e);
        error = 'Error loading properties';
    }

    // Fallback: Return empty if there's an error or no data
    if (error || featured.length === 0) {
        return null;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-24">
            {featured.map((prop) => (
                // Keyed by ref (unique PK of property_metadata) instead of
                // cod_ofer, which is NULL for CRM-published rows and causes
                // React reconciliation collisions when multiple such rows
                // share the featured grid.
                <div key={prop.ref || prop.cod_ofer || ''} className="animate-fade-up">
                    <LuxuryPropertyCard property={prop} />
                </div>
            ))}
        </div>
    );
}

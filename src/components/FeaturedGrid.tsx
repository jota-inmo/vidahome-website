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
import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';

export async function FeaturedGrid() {
    let featured: PropertyListEntry[] = [];
    let actionError: unknown = null;

    try {
        const locale = await getLocale();
        const res = await getFeaturedPropertiesWithDetailsAction(locale);
        if (res.success && res.data) {
            featured = res.data;
        } else {
            actionError = new Error('getFeaturedPropertiesWithDetailsAction returned unsuccessful');
        }
    } catch (e) {
        actionError = e;
    }

    // Loguear con el error real (no enmascararlo en un string genérico): la
    // causa raíz — permission_denied de RLS, fetch fallido, lo que sea —
    // debe llegar al server log para que aparezca en Vercel/Sentry y no se
    // diagnostique mirando un screenshot.
    if (actionError) {
        console.error('[FeaturedGrid] data fetch failed:', actionError);
    }

    if (featured.length > 0) {
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

    // Fallback visible: si la action falla o no hay destacadas configuradas,
    // nunca dejamos la sección huérfana — el visitor ve un CTA al catálogo
    // completo. Cubre dos clases de fallo: (a) regresión silenciosa de RLS
    // como la del 2026-04-28 → 2026-05-22 (ver docs/learnings.md #30 en el
    // repo vidahome-encargo); (b) la lista editorial de featured vacía por
    // descuido. Antes este return era `null` y la sección quedaba vacía
    // bajo el copy "+116 propiedades activas", la peor primera impresión
    // posible para una inmobiliaria.
    const t = await getTranslations('Index');
    return (
        <div className="flex justify-center py-16">
            <Link
                href="/propiedades"
                className="text-[11px] tracking-[0.3em] uppercase font-bold text-brand-navy dark:text-white border-b border-brand-navy dark:border-white pb-1 hover:opacity-60 transition-all"
            >
                {t('viewCatalog')}
            </Link>
        </div>
    );
}

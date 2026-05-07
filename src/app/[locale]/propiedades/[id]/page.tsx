import React from 'react';
import { Metadata, ResolvingMetadata } from 'next';
import { getPropertyDetailAction } from '@/app/actions';
import { PropertyDetailClient } from './PropertyDetailClient';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { translatePropertyType } from '@/lib/utils/property-types';

// ISR: regenerate each detail page every 600 seconds (10 min).
//
// History:
//   - Originally 300s.
//   - Lowered to 60s when we added the photo-reorder sync flow so a
//     webhook failure would still recover within a minute.
//   - Raised to 600s on 2026-04-15 after the Supabase Free plan egress
//     quota hit 123% — the per-minute regeneration was the dominant
//     cost (1 regeneration per minute × 77 visible refs × full_data
//     fetches = ~5 GB/month of cached egress just from background ISR).
//
// This value is ONLY the fallback. The happy path for updating the
// detail page is the on-demand webhook (/api/revalidate) fired by the
// CRM right after it writes to fotos_inmuebles / property_metadata in
// publish_to_web / sync_photo_order. That path is unchanged and still
// takes <5s to propagate. The 10 min window only kicks in if the
// webhook fetch fails or the env var is unset.
//
// Raised from 600s to 3600s to stay within Supabase Free Plan cached
// egress quota (5 GB/month). On-demand /api/revalidate still works for
// immediate updates after CRM publishes.
export const revalidate = 3600;

const SITE_URL = 'https://www.vidahome.es';
const SUPPORTED_LOCALES = ['es', 'en', 'fr', 'de', 'it', 'pl'] as const;

function buildLocalePath(locale: string, id: string): string {
    return locale === 'es' ? `/propiedades/${id}` : `/${locale}/propiedades/${id}`;
}

interface Props {
    params: Promise<{ id: string, locale: string }>;
}

// NOTE: previously this file had a resolveIdParam() helper that decided
// "if it's all digits, treat as cod_ofer numeric, otherwise as ref string".
// That broke ALL CRM refs like "2975", "2772", "2968" which are also pure
// digits but NOT cod_ofer values (those are 8-digit Inmovilla IDs like
// 28734500). The lookup went to the wrong column and every CRM property
// returned "Propiedad no encontrada".
//
// Fixed 2026-04-11: pass the route param straight through as a string.
// getPropertyDetailAction now does ref-first / cod_ofer-fallback internally.

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { id, locale } = await params;
    const result = await getPropertyDetailAction(id, locale);
    const t = await getTranslations({ locale: locale as string, namespace: 'Property' });

    if (!result.success || !result.data) {
        return {
            title: `${t('notFound')} | Vidahome`,
        };
    }

    const prop = result.data;
    const typeLabel = translatePropertyType(prop.tipo_nombre, locale) || t('defaultType');
    const location = prop.poblacion || 'La Safor';
    const title = `${typeLabel} ${t('in')} ${location} - Ref: ${prop.ref} | Vidahome`;

    const { cleanDescription } = require('@/lib/utils/text-cleaner');
    const cleanedDesc = cleanDescription(prop.descripciones);
    const description = cleanedDesc
        ? cleanedDesc.substring(0, 160) + '...'
        : `${typeLabel} ${t('in')} ${location}. Especialistas en la zona de La Safor.`;

    const images = prop.fotos_lista?.slice(0, 1) || [];
    const path = buildLocalePath(locale, id);
    const url = `${SITE_URL}${path}`;

    const languages: Record<string, string> = {};
    for (const l of SUPPORTED_LOCALES) {
        languages[l] = `${SITE_URL}${buildLocalePath(l, id)}`;
    }
    languages['x-default'] = `${SITE_URL}/propiedades/${id}`;

    return {
        title,
        description,
        alternates: {
            canonical: url,
            languages,
        },
        openGraph: {
            title,
            description,
            url,
            siteName: 'Vidahome',
            images,
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images,
        },
    };
}

export default async function PropertyDetailPage({ params }: Props) {
    const { id, locale } = await params;
    const result = await getPropertyDetailAction(id, locale);
    const t = await getTranslations({ locale: locale as string, namespace: 'Property' });
    const tIndex = await getTranslations({ locale: locale as string, namespace: 'Index' });

    if (!result.success || !result.data) {
        return (
            <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-8">
                <h2 className="font-serif text-4xl mb-8 dark:text-white">{t('notFound')}</h2>
                <Link href="/propiedades" className="text-slate-500 underline uppercase tracking-widest text-xs">
                    {tIndex('viewCatalog')}
                </Link>
            </div>
        );
    }

    // JSON-LD Structured Data for SEO. All fields come from result.data,
    // which getPropertyDetailAction already merges from property_metadata
    // + full_data (CRM source of truth). `antiguedad` stores construction
    // year (1964, 2008…), not age — semantic misnomer kept for back-compat.
    const data = result.data;
    const bedrooms = (Number(data.habitaciones) || 0) || undefined;
    const total_baths = (Number(data.banyos) || 0) + (Number(data.aseos) || 0) || undefined;
    const full_baths = Number(data.banyos) || undefined;
    const floor_size_m2 = data.m_cons || undefined;
    const usable_size_m2 = data.m_utiles || undefined;
    const year_built = (data as { antiguedad?: number | string }).antiguedad || undefined;
    const url = `${SITE_URL}${buildLocalePath(locale, id)}`;
    const images = data.fotos_lista?.slice(0, 3) || [];
    const isAvailable = !data.nodisponible;
    const lat = Number(data.latitud) || undefined;
    const lng = Number(data.longitud) || undefined;

    // additionalProperty: amenities como PropertyValue. Solo se incluyen
    // las que están en true — no inventar "pool: false" porque schema
    // interpreta la ausencia distinto a la negación.
    const features: Array<{ name: string; value: boolean }> = [];
    if (data.terraza) features.push({ name: 'Terraza', value: true });
    if (data.ascensor) features.push({ name: 'Ascensor', value: true });
    if (data.piscina_com) features.push({ name: 'Piscina', value: true });
    if (data.aire_con) features.push({ name: 'Aire acondicionado', value: true });
    if (data.calefaccion) features.push({ name: 'Calefaccion', value: true });
    if (data.garaje) features.push({ name: 'Garaje', value: true });
    if (data.vistasalmar) features.push({ name: 'Vistas al mar', value: true });

    const jsonLd: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'RealEstateListing',
        '@id': `${url}#listing`,
        'name': data.tipo_nombre,
        'description': require('@/lib/utils/text-cleaner').cleanDescription(data.descripciones),
        'url': url,
        'mainEntityOfPage': url,
        'identifier': data.ref,
        'image': images,
        'address': {
            '@type': 'PostalAddress',
            'addressLocality': data.poblacion,
            'addressRegion': 'Valencia',
            'addressCountry': 'ES',
        },
        'offers': {
            '@type': 'Offer',
            'price': data.precioinmo,
            'priceCurrency': 'EUR',
            'availability': isAvailable
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            'url': url,
        },
        // Linkea cada listing con la entidad agente declarada en GlobalSchema
        // (mismo @id) — Google entiende la relación listing→broker.
        'provider': {
            '@id': 'https://www.vidahome.es/#agencia',
        },
    };
    // Only attach rich-snippet fields when the underlying value is
    // present. Partial JSON-LD is fine; fake zeros would be worse.
    if (bedrooms) jsonLd.numberOfBedrooms = bedrooms;
    if (total_baths) jsonLd.numberOfBathroomsTotal = total_baths;
    if (full_baths) jsonLd.numberOfFullBathrooms = full_baths;
    if (floor_size_m2) {
        jsonLd.floorSize = {
            '@type': 'QuantitativeValue',
            'value': floor_size_m2,
            'unitCode': 'MTK', // square metres
        };
    }
    if (usable_size_m2) {
        jsonLd.livingArea = {
            '@type': 'QuantitativeValue',
            'value': usable_size_m2,
            'unitCode': 'MTK',
        };
    }
    if (year_built) jsonLd.yearBuilt = year_built;
    // Coords: ya se exponen en PropertyMap publicamente; JSON-LD no
    // añade exposicion incremental. Coherente con regla privacidad
    // (solo se ocultan calle/dir/numero, no coords/poblacion/planta).
    if (lat && lng) {
        jsonLd.geo = {
            '@type': 'GeoCoordinates',
            'latitude': lat,
            'longitude': lng,
        };
    }
    if (features.length > 0) {
        jsonLd.additionalProperty = features.map(f => ({
            '@type': 'PropertyValue',
            'name': f.name,
            'value': f.value,
        }));
    }

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <PropertyDetailClient property={result.data} />
        </>
    );
}

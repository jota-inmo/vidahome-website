import React from 'react';
import { Metadata, ResolvingMetadata } from 'next';
import { getPropertyDetailAction } from '@/app/actions';
import { getPropertyFeatures } from '@/lib/api/property-features';
import { PropertyDetailClient } from './PropertyDetailClient';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { translatePropertyType } from '@/lib/utils/property-types';

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

    return {
        title,
        description,
        openGraph: {
            title,
            description,
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
    // property_features is keyed by cod_ofer. After the lookup we know
    // whether the resolved property has a numeric cod_ofer (legacy or
    // CRM-already-pushed-to-Inmovilla) — only fetch features in that case.
    const cod = result?.data?.cod_ofer;
    const properties_features = (typeof cod === 'number' && cod > 0)
        ? await getPropertyFeatures(cod)
        : null;
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

    // JSON-LD Structured Data for SEO
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'RealEstateListing',
        'name': result.data.tipo_nombre,
        'description': require('@/lib/utils/text-cleaner').cleanDescription(result.data.descripciones),
        'url': `https://vidahome.es/propiedades/${id}`,
        'image': result.data.fotos_lista?.[0],
        'address': {
            '@type': 'PostalAddress',
            'addressLocality': result.data.poblacion,
            'addressRegion': 'Valencia',
            'addressCountry': 'ES'
        },
        'offers': {
            '@type': 'Offer',
            'price': result.data.precioinmo,
            'priceCurrency': 'EUR',
            'availability': 'https://schema.org/InStock'
        }
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <PropertyDetailClient property={result.data} features={properties_features} />
        </>
    );
}

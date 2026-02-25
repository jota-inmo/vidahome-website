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

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { id, locale } = await params;
    const result = await getPropertyDetailAction(parseInt(id), locale);
    const t = await getTranslations({ locale: locale as string, namespace: 'Property' });

    if (!result.success || !result.data) {
        return {
            title: `${t('notFound')} | Vidahome`,
        };
    }

    const prop = result.data;
    const typeLabel = translatePropertyType(prop.tipo_nombre, locale) || t('defaultType');
    const title = `${typeLabel} ${t('in')} ${prop.poblacion} - Ref: ${prop.ref} | Vidahome`;

    const { cleanDescription } = require('@/lib/utils/text-cleaner');
    const cleanedDesc = cleanDescription(prop.descripciones);
    const description = cleanedDesc
        ? cleanedDesc.substring(0, 160) + '...'
        : `${typeLabel} ${t('in')} ${prop.poblacion}. Especialistas en la zona de La Safor.`;

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
    const result = await getPropertyDetailAction(parseInt(id), locale);
    const properties_features = await getPropertyFeatures(parseInt(id));
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

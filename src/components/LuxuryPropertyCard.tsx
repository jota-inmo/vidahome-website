'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { PropertyListEntry } from '@/types/inmovilla';
import { Bed, Bath, Square } from 'lucide-react';
import { cleanDescription } from '@/lib/utils/text-cleaner';
import { useTranslations, useLocale } from 'next-intl';
import { translatePropertyType } from '@/lib/utils/property-types';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { Link } from '@/i18n/routing';


interface LuxuryPropertyCardProps {
    property: PropertyListEntry;
}

export const LuxuryPropertyCard = ({ property }: LuxuryPropertyCardProps) => {
    const t = useTranslations('Search');
    const locale = useLocale();
    const [imageLoaded, setImageLoaded] = useState(false);
    const { trackPropertyView } = useAnalytics();

    // Track property view on component mount
    useEffect(() => {
        trackPropertyView(property.cod_ofer);
    }, [property.cod_ofer, trackPropertyView]);

    const localizedType = translatePropertyType(property.tipo_nombre, locale);
    const isUnavailable = !!property.nodisponible;
    const isTraspaso = (property.ref || '').toUpperCase().startsWith('T');
    const soldLabel = isTraspaso ? 'TRASPASADO' : property.keyacci === 2 ? 'ALQUILADO' : 'VENDIDO';

    // Use real Inmovilla image if available, fallback to high-end architectural images
    const imageUrl = property.mainImage || `https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop`;

    const cardContent = (
        <div className={`bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-sm overflow-hidden transition-all duration-700 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] flex flex-col h-full text-left ${isUnavailable ? 'opacity-75' : ''}`}>
            {/* Container de Imagen con Lazy Loading */}
            <div className="relative aspect-[16/11] overflow-hidden bg-slate-50 dark:bg-slate-900">
                <Image
                    src={imageUrl}
                    alt={`Property ${property.ref}`}
                    fill
                    className={`object-cover transition-all duration-[1.5s] ease-out group-hover:scale-105 ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-50 scale-110'
                        } ${isUnavailable ? 'grayscale' : ''}`}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageLoaded(true)}
                    loading="lazy"
                    priority={false}
                />

                {/* Badge venta/alquiler/traspaso */}
                {!isUnavailable && (
                    <div className="absolute top-6 left-6">
                        <span className="px-3 py-1.5 bg-[#0a192f] text-white text-[10px] tracking-[0.2em] font-medium uppercase rounded-sm">
                            {isTraspaso ? t('transfer') : property.keyacci === 2 ? t('rent') : t('buy')}
                        </span>
                    </div>
                )}

                {/* Badge VENDIDO / ALQUILADO */}
                {isUnavailable && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black/60 backdrop-blur-sm px-6 py-3 rotate-[-10deg] border-2 border-white/80">
                            <span className="text-white text-2xl font-bold tracking-[0.3em] uppercase">
                                {soldLabel}
                            </span>
                        </div>
                    </div>
                )}
            </div>

                <div className="p-8 flex flex-col flex-grow">
                    <h3 className="text-xl font-serif text-slate-900 dark:text-slate-100 leading-tight mb-4">
                        {localizedType
                            ? (property.poblacion ? `${localizedType} ${t('in')} ${property.poblacion}` : localizedType)
                            : (property.poblacion ? `${t('propertyIn')} ${property.poblacion}` : `Ref ${property.ref}`)}
                    </h3>

                    <div className="flex items-center gap-8 mb-6 text-slate-400">
                        <div className="flex items-center gap-3">
                            <Bed size={16} strokeWidth={1.5} />
                            <span className="text-sm font-light">{property.habitaciones || '-'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Bath size={16} strokeWidth={1.5} />
                            <span className="text-sm font-light">{property.banyos || '-'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Square size={14} strokeWidth={1.5} />
                            <span className="text-sm font-light">{property.m_cons ? `${property.m_cons} m²` : '-'}</span>
                        </div>
                    </div>

                    <div className="mb-6">
                        <span className="text-xl font-serif text-slate-700 dark:text-slate-300 italic">
                            {property.keyacci === 2
                                ? (property.precioalq ? `€ ${property.precioalq.toLocaleString()} /mo` : t('priceUnderRequest'))
                                : (property.precioinmo ? `€ ${property.precioinmo.toLocaleString()}` : t('priceUnderRequest'))
                            }
                        </span>
                    </div>

                    {property.descripciones && (
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8 flex-grow line-clamp-3">
                            {cleanDescription(property.descripciones)}
                        </p>
                    )}

                    <div className="pt-8 border-t border-slate-100 dark:border-slate-900 flex justify-between items-center">
                        <div className="flex gap-4 text-[11px] tracking-widest text-slate-400 uppercase">
                            <span>REF: {property.ref}</span>
                        </div>

                        {!isUnavailable && (
                            <span className="text-[12px] tracking-[0.1em] font-medium text-slate-900 dark:text-slate-100 uppercase border-b border-slate-900 dark:border-slate-100 pb-0.5 transition-all group-hover:opacity-50">
                                {t('explore')}
                            </span>
                        )}
                        {isUnavailable && (
                            <span className="text-[10px] tracking-widest text-slate-400 uppercase">
                                {soldLabel}
                            </span>
                        )}
                    </div>
                </div>
            </div>
    );

    if (isUnavailable) {
        return <div className="group block h-full cursor-default">{cardContent}</div>;
    }

    return (
        <Link href={`/propiedades/${property.cod_ofer}`} className="group block h-full">
            {cardContent}
        </Link>
    );
};

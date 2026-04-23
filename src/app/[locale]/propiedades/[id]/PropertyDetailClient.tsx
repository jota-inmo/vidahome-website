'use client';

import React, { useEffect, useRef, useState } from 'react';
import { PropertyDetails } from '@/types/inmovilla';
import { PropertyGallery } from '@/components/PropertyGallery';
import { ContactForm } from '@/components/ContactForm';
import { Logo } from '@/components/Logo';
import { PropertyMap } from '@/components/PropertyMap';
import {
    Square,
    BedDouble,
    Bath,
    Waves,
    Wind,
    Car,
    ArrowLeft,
    Calendar,
    Compass,
    Share2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cleanDescription } from '@/lib/utils/text-cleaner';
import { useTranslations, useLocale } from 'next-intl';
import { translatePropertyType } from '@/lib/utils/property-types';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { getPropertyDetailAction } from '@/app/actions/inmovilla';
import { totalBathrooms, bathroomsTooltip } from '@/lib/utils/bathrooms';
import { Zap, Leaf } from 'lucide-react';

const EnergyRow = ({ letter, label, color, isActive }: { letter: string, label: string, color: string, isActive: boolean }) => (
    <div className={`flex items-center mb-1 transition-all duration-500 ${isActive ? 'scale-105 z-10' : 'opacity-40 grayscale-[0.5]'}`}>
        <div className={`
            relative flex items-center justify-between px-3 py-1 text-white font-bold text-xs h-6
            ${color} 
            ${isActive ? 'shadow-lg shadow-black/10' : ''}
        `} style={{ width: `${60 + (letter.charCodeAt(0) - 65) * 15}px`, clipPath: 'polygon(0% 0%, 90% 0%, 100% 50%, 90% 100%, 0% 100%)' }}>
            <span>{letter}</span>
            {isActive && <span className="text-[8px] ml-2 hidden md:inline">{label}</span>}
        </div>
        {isActive && (
            <div className="ml-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-900 dark:bg-white animate-pulse" />
                <span className="text-xs font-bold tracking-widest uppercase">{label}</span>
            </div>
        )}
    </div>
);

const EnergyScale = ({ activeLetter, title, value, unit, icon }: { activeLetter: string | null | undefined, title: string, value?: string | number | null | undefined, unit: string, icon: React.ReactNode }) => {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    const colors = ['bg-[#00A651]', 'bg-[#4DB748]', 'bg-[#B3D135]', 'bg-[#FFF200]', 'bg-[#FBB03B]', 'bg-[#F26522]', 'bg-[#ED1C24]'];
    const t = useTranslations('Property');

    const normalizedActive = activeLetter?.toUpperCase().trim();
    const isEnTramite = !normalizedActive || normalizedActive === 'EN TRAMITE' || normalizedActive === 'EN TRÁMITE' || normalizedActive === '—' || !letters.includes(normalizedActive);

    return (
        <div className="bg-slate-50/50 dark:bg-slate-900/30 p-8 border border-slate-100 dark:border-slate-800/50 rounded-sm">
            <div className="flex items-center gap-3 mb-6">
                <span className="text-slate-400">{icon}</span>
                <h4 className="text-[10px] tracking-[0.2em] uppercase font-bold text-slate-500">{title}</h4>
            </div>

            <div className="relative">
                {letters.map((L, i) => (
                    <EnergyRow 
                        key={L} 
                        letter={L} 
                        label={L === 'A' ? t('moreEfficient') : L === 'G' ? t('lessEfficient') : ''} 
                        color={colors[i]} 
                        isActive={!isEnTramite && normalizedActive === L} 
                    />
                ))}

                {isEnTramite && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-slate-950/60 backdrop-blur-[2px] border-2 border-dashed border-slate-200 dark:border-slate-800 rotate-[-5deg]">
                        <span className="text-xl font-bold tracking-[0.3em] uppercase text-slate-400 opacity-80">{t('inProcess')}</span>
                    </div>
                )}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-end">
                    <span className="text-[10px] uppercase tracking-widest text-slate-400">{isEnTramite ? t('inProcess') : t('value')}</span>
                    <span className="text-2xl font-serif">
                        {isEnTramite ? '-' : value || '-'}
                        {!isEnTramite && <span className="text-[10px] ml-2 font-sans font-light text-slate-400">{unit}</span>}
                    </span>
                </div>
            </div>
        </div>
    );
};



interface PropertyDetailClientProps {
    property: PropertyDetails;
}

export function PropertyDetailClient({ property: initialProperty }: PropertyDetailClientProps) {
    const router = useRouter();
    const t = useTranslations('Property');
    const locale = useLocale();
    const { trackPropertyView } = useAnalytics();
    
    // State to hold property data that updates with locale
    const [property, setProperty] = useState<PropertyDetails>(initialProperty);

    // Refetch property data when locale changes. Prefer ref (CRM-friendly)
    // and fall back to cod_ofer for legacy Inmovilla-only properties.
    // Either may be null in edge cases (page rendered with bad data),
    // in which case we skip the refetch.
    //
    // First-mount skip: the server already rendered with the current
    // locale, so the initial effect run would re-request the exact same
    // data (one wasted Supabase round-trip per visit). We only want to
    // fetch when the locale changes AFTER mount.
    const propertyKey: string | number | null = initialProperty.ref || initialProperty.cod_ofer;
    const isFirstLocaleRun = useRef(true);
    useEffect(() => {
        if (isFirstLocaleRun.current) {
            isFirstLocaleRun.current = false;
            return; // SSR already delivered this locale — don't refetch.
        }
        if (propertyKey == null) return;
        async function fetchPropertyWithLocale() {
            const result = await getPropertyDetailAction(propertyKey as string | number, locale);
            if (result.success && result.data) {
                setProperty(result.data);
            }
        }

        fetchPropertyWithLocale();
    }, [locale, propertyKey]);

    // Track property view on component mount
    useEffect(() => {
        trackPropertyView(property.cod_ofer);
    }, [property.cod_ofer, trackPropertyView]);

    const localizedType = translatePropertyType(property.tipo_nombre, locale);

    const handleShare = async () => {
        const type = localizedType || t('defaultType');
        const population = property.poblacion || 'La Safor';

        const shareData = {
            title: t('shareTitle', { type, population }),
            text: t('shareText', { type, population }),
            url: window.location.href,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareData.text + ' ' + shareData.url)}`;
                window.open(whatsappUrl, '_blank');
            }
        } catch (err) {
            console.error('Error sharing', err);
        }
    };

    const features_data = [
        { icon: <Square size={20} />, label: t('surface'), value: `${property.m_cons} m²` },
        {
            icon: <BedDouble size={20} />,
            label: t('bedrooms'),
            value: property.habitaciones || '1+',
        },
        {
            icon: <Bath size={20} />,
            label: t('bathrooms'),
            value: totalBathrooms(property.banyos, property.aseos) || property.banyos,
            subtitle: bathroomsTooltip(property.banyos, property.aseos),
        },
        {
            icon: <Calendar size={20} />,
            label: t('construction'),
            value: (property as { antiguedad?: number | string }).antiguedad || 'N/A',
        },
    ];

    const technical = [
        { icon: <Waves size={18} />, label: t('pool'), show: !!property.piscina_com },
        { icon: <Wind size={18} />, label: t('ac'), show: !!property.aire_con },
        { icon: <Car size={18} />, label: t('parking'), show: !!property.garaje },
        { icon: <Compass size={18} />, label: t('elevator'), show: !!property.ascensor },
    ].filter(f => f.show);

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950">
            {/* Botón Volver */}
            <button
                onClick={() => router.back()}
                className="fixed top-28 left-6 md:top-8 md:left-8 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-2.5 md:p-3 rounded-full shadow-lg hover:scale-110 transition-all border border-slate-100 dark:border-slate-800"
                title={t('back')}
            >
                <ArrowLeft size={18} className="text-slate-900 dark:text-white" />
            </button>

            <PropertyGallery
                images={property.fotos_lista || []}
                propertyLabel={`${localizedType || t('defaultType')} en ${property.poblacion || 'La Safor'} — Ref. ${property.ref}`}
            />

            <main className="max-w-7xl mx-auto px-6 md:px-8 py-16 md:py-24 pb-28 lg:pb-24">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 lg:gap-24">
                    {/* Detalles Principales */}
                    <div className="lg:col-span-2">
                        <header className="mb-12 md:mb-16">
                            <span className="text-[10px] tracking-[0.4em] uppercase text-slate-400 mb-6 block">{t('reference')}: {property.ref}</span>
                            <h1 className="text-3xl md:text-7xl font-serif text-slate-900 dark:text-white mb-8 leading-tight">
                                {localizedType || t('defaultType')} <br className="hidden md:block" />
                                <span className="text-slate-400 font-light">{t('in')} {property.poblacion || 'La Safor'}</span>
                            </h1>

                            {/* Precio — visible solo en móvil/tablet. En desktop el precio
                                se muestra en el sidebar derecho (lg:col-span-1), pero en
                                pantallas pequeñas el sidebar se apila al final, por lo que
                                el precio quedaba enterrado tras descripción + certificado
                                energético + mapa. Lo duplicamos arriba para que sea lo
                                primero que ve el cliente cuando comparte el enlace por
                                WhatsApp. */}
                            <div className="lg:hidden mb-8 pb-8 border-b border-slate-100 dark:border-slate-900">
                                {(!property.precioinmo || property.precioinmo === 0) && (
                                    <span className="text-[10px] tracking-widest uppercase text-slate-400 block mb-2">{t('priceUnderRequest')}</span>
                                )}
                                <span className="text-4xl font-serif text-slate-900 dark:text-white">
                                    {property.precioinmo && property.precioinmo > 0 ? `€ ${property.precioinmo.toLocaleString()}` : t('consultPrice')}
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-8 md:gap-12 text-slate-900 dark:text-white">
                                {features_data.map((f, i) => (
                                    <div key={i} className="flex flex-col gap-2">
                                        <span className="text-[10px] tracking-widest uppercase text-slate-400 font-medium">{f.label}</span>
                                        <span className="text-xl md:text-2xl font-serif flex items-center gap-3">
                                            <span className="text-slate-300">{f.icon}</span>
                                            {f.value}
                                        </span>
                                        {f.subtitle && (
                                            <span className="text-xs text-slate-400 font-light">{f.subtitle}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </header>

                        <div className="prose prose-slate dark:prose-invert max-w-none mb-20">
                            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-lg font-light whitespace-pre-line">
                                {property.all_descriptions && property.all_descriptions[`description_${locale}`]
                                    ? cleanDescription(property.all_descriptions[`description_${locale}`])
                                    : property.descripciones
                                    ? cleanDescription(property.descripciones)
                                    : 'Esta propiedad excepcional representa la excelencia en el servicio inmobiliario y el diseño contemporáneo.'}
                            </p>
                        </div>

                        {/* Características Técnicas */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
                            {technical.map((t_item, i) => (
                                <div key={i} className="flex items-center gap-4 p-6 border border-slate-50 dark:border-slate-900 rounded-sm">
                                    <span className="text-slate-400">{t_item.icon}</span>
                                    <span className="text-[10px] tracking-widest uppercase font-semibold">{t_item.label}</span>
                                </div>
                            ))}
                        </div>

                        {/* Certificado Energético */}
                        <section className="mb-20">
                            <div className="flex items-center gap-4 mb-10">
                                <h2 className="text-2xl font-serif text-slate-900 dark:text-white">{t('energyCertificate')}</h2>
                                <div className="h-px flex-grow bg-slate-100 dark:bg-slate-900" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <EnergyScale 
                                    activeLetter={property.energy_label}
                                    title={t('energyConsumption')}
                                    value={property.energy_consumption}
                                    unit={t('energyConsumptionUnit')}
                                    icon={<Zap size={18} />}
                                />
                                <EnergyScale 
                                    activeLetter={property.emissions_label}
                                    title={t('emissions')}
                                    value={property.emissions_value}
                                    unit={t('emissionsUnit')}
                                    icon={<Leaf size={18} />}
                                />
                            </div>
                        </section>


                        {/* Ubicación */}
                        <section className="mb-20">
                            <div className="flex items-center gap-4 mb-8">
                                <h2 className="text-2xl font-serif text-slate-900 dark:text-white">{t('location')}</h2>
                                <div className="h-px flex-grow bg-slate-100 dark:bg-slate-900" />
                            </div>
                            <PropertyMap
                                latitud={property.latitud}
                                longitud={property.longitud}
                                poblacion={property.poblacion}
                            />
                            <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                                {t('locationNotice')}
                            </p>
                        </section>
                    </div>

                    {/* Sidebar de Contacto */}
                    <div className="lg:col-span-1" id="contact-form-anchor">
                        <div className="sticky top-24">
                            <div className="mb-8 flex justify-between items-start">
                                <div>
                                    {(!property.precioinmo || property.precioinmo === 0) && (
                                        <span className="text-[10px] tracking-widest uppercase text-slate-400 block mb-2">{t('priceUnderRequest')}</span>
                                    )}
                                    <span className="text-4xl font-serif text-slate-900 dark:text-white">
                                        {property.precioinmo && property.precioinmo > 0 ? `€ ${property.precioinmo.toLocaleString()}` : t('consultPrice')}
                                    </span>
                                </div>
                                <button
                                    onClick={handleShare}
                                    className="p-3 bg-slate-50 dark:bg-slate-900 rounded-full text-slate-400 hover:text-[#2dd4bf] hover:bg-slate-100 transition-all shadow-sm"
                                    title={t('share')}
                                >
                                    <Share2 size={18} />
                                </button>
                            </div>

                            <ContactForm cod_ofer={property.cod_ofer} />

                            <div className="mt-12 p-10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-slate-100 dark:border-slate-800/60 flex items-center justify-center rounded-2xl transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200/5 dark:hover:shadow-none group relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                <div className="relative z-10 transition-transform duration-700 group-hover:scale-110">
                                    <Logo variant="full" className="h-10 w-auto filter drop-shadow-sm" plain />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Sticky mobile CTA — fixed at the bottom of the viewport on
                lg-below. The desktop right sidebar covers this case on
                larger screens. */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
                <div className="flex items-center justify-between gap-4 px-5 py-3 max-w-7xl mx-auto">
                    <div className="flex flex-col min-w-0">
                        {(!property.precioinmo || property.precioinmo === 0) ? (
                            <span className="text-sm font-serif text-slate-900 dark:text-white truncate">
                                {t('consultPrice')}
                            </span>
                        ) : (
                            <>
                                <span className="text-[9px] tracking-[0.2em] uppercase text-slate-400 leading-none mb-1">
                                    {t('reference')} {property.ref}
                                </span>
                                <span className="text-lg font-serif text-slate-900 dark:text-white leading-tight">
                                    € {property.precioinmo.toLocaleString()}
                                </span>
                            </>
                        )}
                    </div>
                    <a
                        href="#contact-form-anchor"
                        className="shrink-0 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 text-[11px] uppercase tracking-[0.2em] font-bold rounded-sm hover:bg-teal-500 dark:hover:bg-teal-400 active:scale-95 transition-all shadow-lg"
                    >
                        {t('contactCta')}
                    </a>
                </div>
            </div>
        </div>
    );
}

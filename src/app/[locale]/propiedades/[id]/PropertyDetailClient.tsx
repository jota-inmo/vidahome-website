'use client';

import React from 'react';
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


interface PropertyDetailClientProps {
    property: PropertyDetails;
}

export function PropertyDetailClient({ property }: PropertyDetailClientProps) {
    const router = useRouter();

    const handleShare = async () => {
        const shareData = {
            title: `${property.tipo_nombre || 'Propiedad'} en ${property.poblacion} | Vidahome`,
            text: `Mira esta propiedad en Vidahome: ${property.tipo_nombre} en ${property.poblacion}`,
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

    const features = [
        { icon: <Square size={20} />, label: 'Superficie', value: `${property.m_cons} m²` },
        { icon: <BedDouble size={20} />, label: 'Dormitorios', value: property.habitaciones || '1+' },
        { icon: <Bath size={20} />, label: 'Baños', value: property.banyos },
        { icon: <Calendar size={20} />, label: 'Construcción', value: property.fecha ? new Date(property.fecha).getFullYear() : 'N/A' },
    ];

    const technical = [
        { icon: <Waves size={18} />, label: 'Piscina', show: !!property.piscina_com },
        { icon: <Wind size={18} />, label: 'A/A', show: !!property.aire_con },
        { icon: <Car size={18} />, label: 'Parking', show: !!property.garaje },
        { icon: <Compass size={18} />, label: 'Ascensor', show: !!property.ascensor },
    ].filter(f => f.show);

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950">
            {/* Botón Volver */}
            <button
                onClick={() => router.back()}
                className="fixed top-28 left-6 md:top-8 md:left-8 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-2.5 md:p-3 rounded-full shadow-lg hover:scale-110 transition-all border border-slate-100 dark:border-slate-800"
            >
                <ArrowLeft size={18} className="text-slate-900 dark:text-white" />
            </button>

            <PropertyGallery images={property.fotos_lista || []} />

            <main className="max-w-7xl mx-auto px-6 md:px-8 py-16 md:py-24">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 lg:gap-24">
                    {/* Detalles Principales */}
                    <div className="lg:col-span-2">
                        <header className="mb-12 md:mb-16">
                            <span className="text-[10px] tracking-[0.4em] uppercase text-slate-400 mb-6 block">Referencia: {property.ref}</span>
                            <h1 className="text-3xl md:text-7xl font-serif text-slate-900 dark:text-white mb-8 leading-tight">
                                {property.tipo_nombre || 'Propiedad'} <br className="hidden md:block" />
                                <span className="text-slate-400 font-light">en {property.poblacion || 'La Safor'}</span>
                            </h1>
                            <div className="flex flex-wrap gap-8 md:gap-12 text-slate-900 dark:text-white">
                                {features.map((f, i) => (
                                    <div key={i} className="flex flex-col gap-2">
                                        <span className="text-[10px] tracking-widest uppercase text-slate-400 font-medium">{f.label}</span>
                                        <span className="text-xl md:text-2xl font-serif flex items-center gap-3">
                                            <span className="text-slate-300">{f.icon}</span>
                                            {f.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </header>

                        <div className="prose prose-slate dark:prose-invert max-w-none mb-20">
                            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-lg font-light whitespace-pre-line">
                                {property.descripciones
                                    ? cleanDescription(property.descripciones)
                                    : 'Esta propiedad excepcional representa la excelencia en el servicio inmobiliario y el diseño contemporáneo.'}
                            </p>
                        </div>

                        {/* Características Técnicas */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
                            {technical.map((t, i) => (
                                <div key={i} className="flex items-center gap-4 p-6 border border-slate-50 dark:border-slate-900 rounded-sm">
                                    <span className="text-slate-400">{t.icon}</span>
                                    <span className="text-[10px] tracking-widest uppercase font-semibold">{t.label}</span>
                                </div>
                            ))}
                        </div>

                        {/* Ubicación */}
                        <section className="mb-20">
                            <div className="flex items-center gap-4 mb-8">
                                <h2 className="text-2xl font-serif text-slate-900 dark:text-white">Ubicación</h2>
                                <div className="h-px flex-grow bg-slate-100 dark:bg-slate-900" />
                            </div>
                            <PropertyMap
                                latitud={property.latitud}
                                longitud={property.longitud}
                                address={property.calle}
                                poblacion={property.poblacion}
                            />
                            <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                                Ubicación aproximada para proteger la privacidad del propietario
                            </p>
                        </section>
                    </div>

                    {/* Sidebar de Contacto */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24">
                            <div className="mb-8 flex justify-between items-start">
                                <div>
                                    {(!property.precioinmo || property.precioinmo === 0) && (
                                        <span className="text-[10px] tracking-widest uppercase text-slate-400 block mb-2">Precio bajo consulta</span>
                                    )}
                                    <span className="text-4xl font-serif text-slate-900 dark:text-white">
                                        {property.precioinmo && property.precioinmo > 0 ? `€ ${property.precioinmo.toLocaleString()}` : 'Consulte precio'}
                                    </span>
                                </div>
                                <button
                                    onClick={handleShare}
                                    className="p-3 bg-slate-50 dark:bg-slate-900 rounded-full text-slate-400 hover:text-[#2dd4bf] hover:bg-slate-100 transition-all shadow-sm"
                                    title="Compartir"
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
        </div>
    );
}

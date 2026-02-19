'use client';

import React from 'react';
import { PropertyDetails } from '@/types/inmovilla';
import { PropertyGallery } from '@/components/PropertyGallery';
import { ContactForm } from '@/components/ContactForm';
import { Logo } from '@/components/Logo';
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

interface PropertyDetailClientProps {
    property: PropertyDetails;
}

export function PropertyDetailClient({ property }: PropertyDetailClientProps) {
    const handleShare = async () => {
        const shareData = {
            title: `Residencia en ${property.poblacion} | Vidahome`,
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
            <Link
                href="/propiedades"
                className="fixed top-8 left-8 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-3 rounded-full shadow-lg hover:scale-110 transition-all border border-slate-100 dark:border-slate-800"
            >
                <ArrowLeft size={20} className="text-slate-900 dark:text-white" />
            </Link>

            <PropertyGallery images={property.fotos_lista || []} />

            <main className="max-w-7xl mx-auto px-8 py-24">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-24">
                    {/* Detalles Principales */}
                    <div className="lg:col-span-2">
                        <header className="mb-16">
                            <span className="text-[10px] tracking-[0.4em] uppercase text-slate-400 mb-6 block">Referencia: {property.ref}</span>
                            <h1 className="text-5xl md:text-7xl font-serif text-slate-900 dark:text-white mb-8 leading-tight">
                                Privacidad y <br /> Elegancia en {property.tipo_nombre || 'Residencia'} en {property.poblacion || 'Ubicación Premium'}
                            </h1>
                            <div className="flex flex-wrap gap-12 text-slate-900 dark:text-white">
                                {features.map((f, i) => (
                                    <div key={i} className="flex flex-col gap-2">
                                        <span className="text-[10px] tracking-widest uppercase text-slate-400 font-medium">{f.label}</span>
                                        <span className="text-2xl font-serif flex items-center gap-3">
                                            <span className="text-slate-300">{f.icon}</span>
                                            {f.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </header>

                        <div className="prose prose-slate dark:prose-invert max-w-none mb-20">
                            <h2 className="font-serif text-3xl mb-8">Acerca de esta propiedad</h2>
                            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-lg font-light whitespace-pre-line">
                                {property.descripciones ? property.descripciones.split('~~')[0] : 'Esta residencia excepcional representa la excelencia en el servicio inmobiliario y el diseño contemporáneo.'}
                            </p>
                        </div>

                        {/* Características Técnicas */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            {technical.map((t, i) => (
                                <div key={i} className="flex items-center gap-4 p-6 border border-slate-50 dark:border-slate-900 rounded-sm">
                                    <span className="text-slate-400">{t.icon}</span>
                                    <span className="text-[10px] tracking-widest uppercase font-semibold">{t.label}</span>
                                </div>
                            ))}
                        </div>
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

                            <div className="mt-12 p-8 border border-slate-50 dark:border-slate-900 flex items-center gap-6">
                                <div className="scale-125">
                                    <Logo variant="icon" />
                                </div>
                                <div>
                                    <h4 className="font-serif text-lg">Vidahome</h4>
                                    <p className="text-xs text-slate-400 uppercase tracking-widest">Especialista en La Safor</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="px-8 py-20 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-900 mt-20">
                <div className="max-w-7xl mx-auto text-center">
                    <p className="text-[10px] tracking-[0.4em] uppercase text-slate-400">© 2026 Vidahome Premium Experience - Acompañamiento Profesional y Completo</p>
                </div>
            </footer>
        </div>
    );
}

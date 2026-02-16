'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { PropertyListEntry } from '@/types/inmovilla';
import { Bed, Bath, Square } from 'lucide-react';

interface LuxuryPropertyCardProps {
    property: PropertyListEntry;
}

export const LuxuryPropertyCard = ({ property }: LuxuryPropertyCardProps) => {
    const [imageLoaded, setImageLoaded] = useState(false);

    // Use real Inmovilla image if available, fallback to high-end architectural images
    const imageUrl = property.mainImage || `https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop`;

    return (
        <a href={`/propiedades/${property.cod_ofer}`} className="group block h-full">
            <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-sm overflow-hidden transition-all duration-700 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] flex flex-col h-full text-left">
                {/* Container de Imagen con Lazy Loading */}
                <div className="relative aspect-[16/11] overflow-hidden bg-slate-50 dark:bg-slate-900">
                    <Image
                        src={imageUrl}
                        alt={`Property ${property.ref}`}
                        fill
                        className={`object-cover transition-all duration-[1.5s] ease-out group-hover:scale-105 ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
                            }`}
                        onLoad={() => setImageLoaded(true)}
                        loading="lazy"
                    />

                    <div className="absolute top-6 left-6">
                        <span className="px-3 py-1.5 bg-[#0a192f] text-white text-[10px] tracking-[0.2em] font-medium uppercase rounded-sm">
                            {property.keyacci === 2 ? 'Alquiler' : 'Venta'}
                        </span>
                    </div>
                </div>

                <div className="p-10 flex flex-col flex-grow">
                    <h3 className="text-2xl font-serif text-slate-900 dark:text-slate-100 leading-tight mb-4">
                        {property.poblacion ? `${property.tipo_nombre || 'Residencia'} en ${property.poblacion}` : `Referencia ${property.ref}`}
                    </h3>

                    <div className="flex items-center gap-12 mb-8 text-slate-400">
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
                                ? (property.precioalq ? `€ ${property.precioalq.toLocaleString()} /mes` : 'Precio bajo consulta')
                                : (property.precioinmo ? `€ ${property.precioinmo.toLocaleString()}` : 'Precio bajo consulta')
                            }
                        </span>
                    </div>

                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8 flex-grow line-clamp-3">
                        {property.descripciones || 'Una propiedad única que personifica la elegancia atemporal y el diseño contemporáneo.'}
                    </p>

                    <div className="pt-8 border-t border-slate-100 dark:border-slate-900 flex justify-between items-center">
                        <div className="flex gap-4 text-[11px] tracking-widest text-slate-400 uppercase">
                            <span>REF: {property.ref}</span>
                        </div>

                        <span className="text-[12px] tracking-[0.1em] font-medium text-slate-900 dark:text-slate-100 uppercase border-b border-slate-900 dark:border-slate-100 pb-0.5 transition-all group-hover:opacity-50">
                            Explorar
                        </span>
                    </div>
                </div>
            </div>
        </a>
    );
};

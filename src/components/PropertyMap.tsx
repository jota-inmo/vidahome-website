'use client';

import React, { useRef, useState, useEffect } from 'react';

interface PropertyMapProps {
    latitud?: string | number;
    longitud?: string | number;
    address?: string;
    poblacion?: string;
}

export function PropertyMap({ latitud, longitud, address, poblacion }: PropertyMapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    // Si tenemos coordenadas válidas, las usamos. Si no, usamos la dirección.
    const hasCoords = latitud && longitud && String(latitud).trim() !== '' && String(longitud).trim() !== '';

    const query = hasCoords
        ? `${latitud},${longitud}`
        : `${address || ''} ${poblacion || ''}`.trim();

    useEffect(() => {
        if (!containerRef.current || !query) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '200px' } // Start loading 200px before it enters viewport
        );

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [query]);

    if (!query) return null;

    const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

    return (
        <div
            ref={containerRef}
            className="w-full h-[400px] rounded-sm overflow-hidden border border-slate-100 dark:border-slate-800"
        >
            {isVisible ? (
                <iframe
                    width="100%"
                    height="100%"
                    id="gmap_canvas"
                    src={mapUrl}
                    frameBorder="0"
                    scrolling="no"
                    marginHeight={0}
                    marginWidth={0}
                    className="opacity-100 transition-opacity duration-700"
                ></iframe>
            ) : (
                <div className="w-full h-full bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center">
                    <span className="text-slate-400 text-xs tracking-widest uppercase">Cargando mapa...</span>
                </div>
            )}
        </div>
    );
}

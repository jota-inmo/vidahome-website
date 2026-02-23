'use client';

import React from 'react';

interface PropertyMapProps {
    latitud?: string | number;
    longitud?: string | number;
    address?: string;
    poblacion?: string;
}

export function PropertyMap({ latitud, longitud, address, poblacion }: PropertyMapProps) {
    // Si tenemos coordenadas válidas, las usamos. Si no, usamos la dirección.
    const hasCoords = latitud && longitud && String(latitud).trim() !== '' && String(longitud).trim() !== '';

    const query = hasCoords
        ? `${latitud},${longitud}`
        : `${address || ''} ${poblacion || ''}`.trim();

    if (!query) return null;

    const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

    return (
        <div className="w-full h-[400px] rounded-sm overflow-hidden border border-slate-100 dark:border-slate-800">
            <iframe
                width="100%"
                height="100%"
                id="gmap_canvas"
                src={mapUrl}
                frameBorder="0"
                scrolling="no"
                marginHeight={0}
                marginWidth={0}
                className="grayscale dark:invert-[0.85] dark:hue-rotate-180 opacity-80 hover:opacity-100 transition-opacity duration-700"
            ></iframe>
        </div>
    );
}

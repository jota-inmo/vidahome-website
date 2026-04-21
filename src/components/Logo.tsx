'use client';

import React from 'react';

import Image from 'next/image';

interface LogoProps {
    className?: string;
    variant?: 'full' | 'simple' | 'icon';
    showSlogan?: boolean;
    plain?: boolean;
}

export const Logo = ({ className = '', variant = 'full', showSlogan = true, plain = false }: LogoProps) => {

    // Dos PNGs separados — URL nueva (post 2026-04-21) para bustear la caché
    // del CDN de Vercel y del image optimizer de Next (el path viejo
    // "/MARCA OK.png" y su optimización quedaron cacheados tras un swap de
    // archivo que no cambiaba de URL).
    //   · /vidahome-logo.png       — logo para fondos CLAROS
    //   · /vidahome-logo-dark.png  — logo para fondos OSCUROS
    //
    // Ambos archivos deben tener fondo 100% transparente y trazos sólidos.
    const OfficialLogo = ({ innerClass = '' }: { innerClass?: string }) => (
        <div className={`relative flex items-center ${!plain ? 'bg-white dark:bg-transparent px-5 py-2 rounded-sm shadow-sm dark:shadow-none border border-slate-100 dark:border-transparent' : ''} ${innerClass}`}>
            <Image
                src="/vidahome-logo.png"
                alt="Vidahome Logo"
                width={320}
                height={96}
                className="h-12 md:h-20 w-auto object-contain dark:hidden"
                priority
            />
            <Image
                src="/vidahome-logo-dark.png"
                alt="Vidahome Logo"
                width={320}
                height={96}
                className="h-12 md:h-20 w-auto object-contain hidden dark:block"
                priority
            />
        </div>
    );

    if (variant === 'icon' || variant === 'simple') {
        return <OfficialLogo innerClass={className} />;
    }

    return (
        <div className={`flex items-center ${className}`}>
            <OfficialLogo />
        </div>
    );
};

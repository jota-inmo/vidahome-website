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

    // Dos PNGs separados (pendiente regenerarlos):
    //   · /MARCA OK.png       — logo para fondos CLAROS (tinta oscura, fondo transparente)
    //   · /MARCA OK dark.png  — logo para fondos OSCUROS (tinta clara, fondo transparente)
    //
    // Ambos archivos deben tener fondo 100% transparente y trazos sólidos
    // (sin semi-transparencia) para que rendericen nítidos sobre el nav.
    const OfficialLogo = ({ innerClass = '' }: { innerClass?: string }) => (
        <div className={`relative flex items-center ${!plain ? 'bg-white dark:bg-transparent px-5 py-2 rounded-sm shadow-sm dark:shadow-none border border-slate-100 dark:border-transparent' : ''} ${innerClass}`}>
            <Image
                src="/MARCA OK.png"
                alt="Vidahome Logo"
                width={320}
                height={96}
                className="h-12 md:h-20 w-auto object-contain dark:hidden"
                priority
            />
            <Image
                src="/MARCA OK dark.png"
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

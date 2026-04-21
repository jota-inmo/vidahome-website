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

    // Logo monocromo: usamos el PNG oficial (negro sobre transparente).
    // En modo oscuro aplicamos `brightness(0) invert(1)` para forzar blanco
    // puro sólido — evita el problema del PNG "dark" con trazos finos
    // semi-transparentes que queda invisible sobre slate-950.
    const OfficialLogo = ({ innerClass = '' }: { innerClass?: string }) => (
        <div className={`relative flex items-center ${!plain ? 'bg-white dark:bg-transparent px-5 py-2 rounded-sm shadow-sm dark:shadow-none border border-slate-100 dark:border-transparent' : ''} ${innerClass}`}>
            <Image
                src="/MARCA OK.png"
                alt="Vidahome Logo"
                width={320}
                height={96}
                className="h-12 md:h-20 w-auto object-contain dark:[filter:brightness(0)_invert(1)]"
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

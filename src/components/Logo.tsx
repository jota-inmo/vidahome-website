'use client';

import React from 'react';

interface LogoProps {
    className?: string;
    variant?: 'full' | 'simple' | 'icon';
    showSlogan?: boolean;
}

export const Logo = ({ className = '', variant = 'full', showSlogan = true }: LogoProps) => {

    // Icono "Lambda" estilizado
    const Icon = () => (
        <div className="relative w-10 h-10 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-[5px] border-transparent bg-gradient-to-br from-lime-400 to-teal-500 [mask:linear-gradient(#fff_0_0)_padding-box,linear-gradient(#fff_0_0)]"
                style={{ WebkitMaskComposite: 'xor', maskComposite: 'exclude' }} />
            <div className="absolute inset-0 rounded-full border-[5px] border-slate-200 dark:border-slate-800 opacity-20" />

            {/* Lambda Symbol */}
            <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-5 h-5 text-transparent"
                style={{ stroke: 'url(#logo-gradient)', strokeWidth: 5, strokeLinecap: 'round', strokeLinejoin: 'round' }}
            >
                <defs>
                    <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#a3e635" /> {/* lime-400 */}
                        <stop offset="100%" stopColor="#14b8a6" /> {/* teal-500 */}
                    </linearGradient>
                </defs>
                <path d="M12 5L5 19M12 5L19 19" />
            </svg>
        </div>
    );

    if (variant === 'icon') {
        return <Icon />;
    }

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            {/* Symbol */}
            <Icon />

            {/* Text Lockup */}
            <div className="flex flex-col">
                <div className="flex items-center leading-none">
                    <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-lime-500 to-teal-500 font-sans">
                        VIDA
                    </span>
                    <div className="w-[2px] h-5 mx-2 bg-gradient-to-b from-lime-500 to-teal-500 rounded-full" />
                    <span className="text-2xl font-light tracking-widest text-slate-800 dark:text-white font-sans">
                        HOME
                    </span>
                </div>

                {showSlogan && (
                    <span className="text-[10px] tracking-[0.2em] text-slate-400 dark:text-slate-500 font-medium mt-1 pl-1">
                        tu asesor inmobiliario
                    </span>
                )}
            </div>
        </div>
    );
};

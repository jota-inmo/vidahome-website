'use client';

import React from 'react';

import Image from 'next/image';

interface LogoProps {
    className?: string;
    variant?: 'full' | 'simple' | 'icon';
    showSlogan?: boolean;
}

export const Logo = ({ className = '', variant = 'full', showSlogan = true }: LogoProps) => {

    // Use the official PNG logo provided by the user
    const OfficialLogo = () => (
        <div className="relative flex items-center h-[72px] w-[200px] bg-white px-7 py-2 rounded-sm shadow-sm border border-slate-100">
            <Image
                src="/MARCA OK.png"
                alt="Vidahome Logo"
                width={200}
                height={60}
                className="h-full w-auto object-contain"
                priority
            />
        </div>
    );

    if (variant === 'icon' || variant === 'simple') {
        return <OfficialLogo />;
    }

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <OfficialLogo />
        </div>
    );
};

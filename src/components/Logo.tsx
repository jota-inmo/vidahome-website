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
    const OfficialLogo = ({ innerClass = '' }: { innerClass?: string }) => (
        <div className={`relative flex items-center bg-white px-5 py-2 rounded-sm shadow-sm border border-slate-100 ${innerClass}`}>
            <Image
                src="/MARCA OK.png"
                alt="Vidahome Logo"
                width={160}
                height={48}
                className="h-10 w-auto object-contain"
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

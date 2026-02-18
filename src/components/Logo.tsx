'use client';

import React from 'react';

interface LogoProps {
    className?: string;
    variant?: 'full' | 'simple' | 'icon';
    showSlogan?: boolean;
}

export const Logo = ({ className = '', variant = 'full', showSlogan = true }: LogoProps) => {

    // Use the official PNG logo provided by the user
    const OfficialLogo = () => (
        <div className="relative flex items-center h-16 w-auto bg-white px-6 py-2 rounded-sm shadow-sm border border-slate-100">
            <img
                src="/MARCA OK.png"
                alt="Vidahome Logo"
                className="h-full w-auto object-contain"
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

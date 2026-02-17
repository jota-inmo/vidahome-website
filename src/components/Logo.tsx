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
        <div className="relative flex items-center h-12 w-auto">
            <img
                src="/MARCA OK.png"
                alt="Vidahome Logo"
                className="h-full w-auto object-contain brightness-0 invert dark:brightness-100 dark:invert-0"
                style={{
                    // Optional: add a slight drop shadow if needed for legibility on light backgrounds
                    filter: variant === 'full' ? 'drop-shadow(0 0 10px rgba(255,255,255,0.1))' : 'none'
                }}
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

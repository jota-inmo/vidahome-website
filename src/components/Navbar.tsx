'use client';

import React from 'react';
import Link from 'next/link';

import { Logo } from '@/components/Logo';

export const Navbar = () => {
    return (
        <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 transition-all">
            <div className="max-w-7xl mx-auto px-8 h-24 flex items-center justify-between">
                {/* Logo Vidahome */}
                <Link href="/" className="group">
                    <Logo />
                </Link>

                {/* Navegación */}
                <div className="hidden md:flex items-center gap-12">
                    <Link href="/propiedades" className="text-[11px] uppercase tracking-[0.2em] font-medium text-slate-500 hover:text-[#0a192f] dark:hover:text-white transition-colors">
                        Propiedades
                    </Link>
                    <Link href="/vender" className="text-[11px] uppercase tracking-[0.2em] font-medium text-slate-500 hover:text-[#0a192f] dark:hover:text-white transition-colors">
                        Vender
                    </Link>
                    <Link href="/nosotros" className="text-[11px] uppercase tracking-[0.2em] font-medium text-slate-500 hover:text-[#0a192f] dark:hover:text-white transition-colors">
                        Nosotros
                    </Link>
                    <Link
                        href="/contacto"
                        className="px-6 py-3 bg-[#0a192f] text-white text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-gradient-to-r hover:from-lime-400 hover:to-teal-500 hover:text-[#0a192f] transition-all rounded-sm"
                    >
                        Contacto
                    </Link>
                </div>
            </div>
        </nav>
    );
};

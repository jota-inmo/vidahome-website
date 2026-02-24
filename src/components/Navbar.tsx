'use client';

import React, { useState } from 'react';
import { Link, usePathname } from '@/i18n/routing';
import { Logo } from '@/components/Logo';
import { Menu, X, Globe } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

export const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const t = useTranslations('Navbar');
    const locale = useLocale();
    const pathname = usePathname();

    const availableLocales = [
        { id: 'es', label: 'ES', flag: '🇪🇸' },
        { id: 'en', label: 'EN', flag: '🇬🇧' },
        { id: 'fr', label: 'FR', flag: '🇫🇷' },
        { id: 'de', label: 'DE', flag: '🇩🇪' },
        { id: 'pl', label: 'PL', flag: '🇵🇱' }
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 transition-all">
            <div className="max-w-[1600px] mx-auto px-6 h-24 md:h-28 flex items-center justify-between">
                {/* Logo Vidahome */}
                <Link href="/" className="group" onClick={() => setIsOpen(false)}>
                    <Logo />
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-12">
                    <Link href="/propiedades" className="text-[11px] uppercase tracking-[0.2em] font-medium text-slate-500 hover:text-[#0a192f] dark:hover:text-white transition-colors">
                        {t('properties')}
                    </Link>
                    <Link href="/vender" className="text-[11px] uppercase tracking-[0.2em] font-medium text-slate-500 hover:text-[#0a192f] dark:hover:text-white transition-colors">
                        {t('sell')}
                    </Link>
                    <Link href="/nosotros" className="text-[11px] uppercase tracking-[0.2em] font-medium text-slate-500 hover:text-[#0a192f] dark:hover:text-white transition-colors">
                        {t('about')}
                    </Link>

                    {/* Language Switcher */}
                    <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-800 pl-8 ml-2">
                        {availableLocales.map((loc) => (
                            <Link
                                key={loc.id}
                                href={pathname}
                                locale={loc.id}
                                className={`text-[10px] tracking-widest font-bold px-2 py-1 transition-all ${locale === loc.id
                                        ? 'text-[#0a192f] dark:text-white border-b-2 border-lime-400'
                                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                    }`}
                            >
                                {loc.label}
                            </Link>
                        ))}
                    </div>

                    <Link
                        href="/contacto"
                        className="px-6 py-3 bg-[#0a192f] text-white text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-gradient-to-r hover:from-lime-400 hover:to-teal-500 hover:text-[#0a192f] transition-all rounded-sm"
                    >
                        {t('contact')}
                    </Link>
                </div>

                {/* Mobile Tablet Menu Toggle */}
                <button
                    className="md:hidden p-2 text-slate-900 dark:text-white transition-all active:scale-95"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Menu"
                >
                    {isOpen ? <X size={28} strokeWidth={1.5} /> : <Menu size={28} strokeWidth={1.5} />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            <div className={`md:hidden absolute top-full left-0 right-0 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-4 invisible'}`}>
                <div className="p-8 flex flex-col gap-6">
                    <Link href="/propiedades" onClick={() => setIsOpen(false)} className="text-[12px] uppercase tracking-[0.2em] font-medium text-slate-500 border-b border-slate-50 dark:border-slate-900 pb-4">
                        {t('properties')}
                    </Link>
                    <Link href="/vender" onClick={() => setIsOpen(false)} className="text-[12px] uppercase tracking-[0.2em] font-medium text-slate-500 border-b border-slate-50 dark:border-slate-900 pb-4">
                        {t('sell')}
                    </Link>
                    <Link href="/nosotros" onClick={() => setIsOpen(false)} className="text-[12px] uppercase tracking-[0.2em] font-medium text-slate-500 border-b border-slate-50 dark:border-slate-900 pb-4">
                        {t('about')}
                    </Link>

                    {/* Language Switcher Mobile */}
                    <div className="flex gap-4 py-2">
                        {availableLocales.map((loc) => (
                            <Link
                                key={loc.id}
                                href={pathname}
                                locale={loc.id}
                                onClick={() => setIsOpen(false)}
                                className={`text-[12px] tracking-widest font-bold ${locale === loc.id
                                        ? 'text-[#0a192f] dark:text-white'
                                        : 'text-slate-400'
                                    }`}
                            >
                                {loc.label === 'ES' ? 'Español' : 'English'}
                            </Link>
                        ))}
                    </div>

                    <Link
                        href="/contacto"
                        onClick={() => setIsOpen(false)}
                        className="w-full text-center px-6 py-4 bg-[#0a192f] text-white text-[12px] uppercase tracking-[0.3em] font-bold hover:bg-slate-800 transition-all rounded-sm"
                    >
                        {t('contact')}
                    </Link>
                </div>
            </div>
        </nav>
    );
};

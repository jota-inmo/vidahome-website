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
        { id: 'es', label: 'ES', flag: '/flags/es.svg' },
        { id: 'en', label: 'EN', flag: '/flags/en.svg' },
        { id: 'fr', label: 'FR', flag: '/flags/fr.svg' },
        { id: 'de', label: 'DE', flag: '/flags/de.svg' },
        { id: 'it', label: 'IT', flag: '/flags/it.svg' },
        { id: 'pl', label: 'PL', flag: '/flags/pl.svg' }
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
                    <Link href="/blog" className="text-[11px] uppercase tracking-[0.2em] font-medium text-slate-500 hover:text-[#0a192f] dark:hover:text-white transition-colors">
                        Blog
                    </Link>

                    {/* Language Switcher Dropdown */}
                    <div className="relative group border-l border-slate-200 dark:border-slate-800 pl-6 ml-2">
                        <button className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer">
                            <img 
                                src={availableLocales.find(l => l.id === locale)?.flag} 
                                alt={locale}
                                className="w-5 h-4 rounded-sm object-cover"
                            />
                            <span className="text-[10px] tracking-widest font-bold">{locale.toUpperCase()}</span>
                        </button>
                        
                        {/* Dropdown Menu */}
                        <div className="absolute right-0 mt-3 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm shadow-lg z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all py-1">
                            {availableLocales.map((loc) => (
                                <Link
                                    key={loc.id}
                                    href={pathname}
                                    locale={loc.id}
                                    className={`flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold transition-all ${
                                        locale === loc.id 
                                            ? 'bg-lime-400 text-slate-900'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <img 
                                        src={loc.flag} 
                                        alt={loc.label}
                                        className="w-5 h-4 rounded-sm object-cover"
                                    />
                                    <span className="tracking-widest">{loc.label}</span>
                                </Link>
                            ))}
                        </div>
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
                    <Link href="/blog" onClick={() => setIsOpen(false)} className="text-[12px] uppercase tracking-[0.2em] font-medium text-slate-500 border-b border-slate-50 dark:border-slate-900 pb-4">
                        Blog
                    </Link>

                    {/* Language Switcher Mobile */}
                    <div className="flex flex-col gap-3 py-4 border-t border-slate-50 dark:border-slate-900 pt-6">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Idioma:</span>
                        <div className="grid grid-cols-3 gap-2">
                            {availableLocales.map((loc) => (
                                <Link
                                    key={loc.id}
                                    href={pathname}
                                    locale={loc.id}
                                    onClick={() => setIsOpen(false)}
                                    className={`flex items-center justify-center gap-1.5 text-[12px] tracking-widest font-bold px-2 py-2 rounded-sm transition-all ${
                                        locale === loc.id
                                            ? 'bg-lime-400 text-slate-900'
                                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 border border-slate-200 dark:border-slate-800'
                                    }`}
                                >
                                    <img 
                                        src={loc.flag} 
                                        alt={loc.label}
                                        className="w-6 h-4 rounded-sm object-cover"
                                    />
                                    <span className="text-[10px]">{loc.label}</span>
                                </Link>
                            ))}
                        </div>
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

'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Link, usePathname } from '@/i18n/routing';
import { Logo } from '@/components/Logo';
import { Menu, X } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

export const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
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

    const navLinks = [
        { href: '/propiedades', label: t('properties') },
        { href: '/vender', label: t('sell') },
        { href: '/nosotros', label: t('about') },
        { href: '/blog', label: 'Blog' },
    ];

    // usePathname (next-intl) returns the path WITHOUT the locale prefix, so
    // the home page is exactly '/'. We treat a section as active when the
    // current path matches it or is nested under it (e.g. /blog/some-slug).
    const isHome = pathname === '/';
    const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

    // The navbar is transparent only while sitting over the hero: home page,
    // scrolled to the very top, and the mobile menu closed. In every other
    // case it is solid and compact.
    const isTransparent = isHome && !scrolled && !isOpen;

    // Passive scroll listener — flips to the solid/compact navbar past 50px.
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 50);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Lock body scroll while the mobile menu is open.
    useEffect(() => {
        if (!isOpen) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = previous; };
    }, [isOpen]);

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
                isTransparent
                    ? 'bg-transparent'
                    : 'bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800'
            }`}
        >
            <div
                className={`max-w-[1600px] mx-auto px-4 md:px-6 flex items-center justify-between transition-all duration-300 ${
                    isTransparent ? 'h-16 md:h-28' : 'h-16 md:h-20'
                }`}
            >
                {/* Logo Vidahome */}
                <Link href="/" className="group" onClick={() => setIsOpen(false)}>
                    <Logo plain onDark={isTransparent} />
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-12">
                    {navLinks.map(({ href, label }) => {
                        const active = isActive(href);
                        return (
                            <Link
                                key={href}
                                href={href}
                                aria-current={active ? 'page' : undefined}
                                className={`relative text-xs uppercase tracking-[0.2em] font-medium transition-colors ${
                                    isTransparent
                                        ? active ? 'text-white' : 'text-white/70 hover:text-white'
                                        : active ? 'text-brand-navy dark:text-white' : 'text-slate-500 hover:text-brand-navy dark:hover:text-white'
                                }`}
                            >
                                {label}
                                <span
                                    aria-hidden="true"
                                    className={`absolute -bottom-2 left-0 h-px bg-brand-accent transition-all duration-300 ${
                                        active ? 'w-full opacity-100' : 'w-0 opacity-0'
                                    }`}
                                />
                            </Link>
                        );
                    })}

                    {/* Language Switcher Dropdown */}
                    <div className="relative group border-l border-slate-200 dark:border-slate-800 pl-6 ml-2">
                        <button
                            className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                                isTransparent ? 'text-white/80 hover:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                            }`}
                        >
                            <Image src={availableLocales.find(l => l.id === locale)?.flag || '/flags/es.svg'} alt="" width={20} height={15} className="rounded-[2px]" />
                            <span className="text-xs tracking-widest font-bold">{locale.toUpperCase()}</span>
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
                                            ? 'bg-brand-navy text-white'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <Image src={loc.flag} alt={loc.label} width={20} height={15} className="rounded-[2px]" />
                                    <span className="tracking-widest">{loc.label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    <Link
                        href="/contacto"
                        aria-current={isActive('/contacto') ? 'page' : undefined}
                        className={`px-6 py-3 text-xs uppercase tracking-[0.3em] font-bold transition-all rounded-sm ${
                            isTransparent
                                ? 'bg-white text-brand-navy hover:bg-brand-accent'
                                : 'bg-brand-navy text-white hover:bg-brand-navy-light'
                        }`}
                    >
                        {t('contact')}
                    </Link>
                </div>

                {/* Mobile Tablet Menu Toggle */}
                <button
                    className={`md:hidden p-2 transition-all active:scale-95 ${
                        isTransparent ? 'text-white' : 'text-slate-900 dark:text-white'
                    }`}
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Menu"
                    aria-expanded={isOpen}
                >
                    {isOpen ? <X size={28} strokeWidth={1.5} /> : <Menu size={28} strokeWidth={1.5} />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            <div className={`md:hidden absolute top-full left-0 right-0 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-4 invisible'}`}>
                <div className="p-8 flex flex-col gap-6">
                    {navLinks.map(({ href, label }) => {
                        const active = isActive(href);
                        return (
                            <Link
                                key={href}
                                href={href}
                                onClick={() => setIsOpen(false)}
                                aria-current={active ? 'page' : undefined}
                                className={`text-[12px] uppercase tracking-[0.2em] font-medium border-b border-slate-50 dark:border-slate-900 pb-4 transition-colors ${
                                    active ? 'text-brand-navy dark:text-white' : 'text-slate-500'
                                }`}
                            >
                                {label}
                            </Link>
                        );
                    })}

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
                                            ? 'bg-brand-navy text-white'
                                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 border border-slate-200 dark:border-slate-800'
                                    }`}
                                >
                                    <Image src={loc.flag} alt={loc.label} width={24} height={18} className="rounded-[2px]" />
                                    <span className="text-xs">{loc.label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    <Link
                        href="/contacto"
                        onClick={() => setIsOpen(false)}
                        className="w-full text-center px-6 py-4 bg-brand-navy text-white text-[12px] uppercase tracking-[0.3em] font-bold hover:bg-brand-navy-light transition-all rounded-sm"
                    >
                        {t('contact')}
                    </Link>
                </div>
            </div>
        </nav>
    );
};

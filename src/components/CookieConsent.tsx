'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookie-consent');
        if (!consent) {
            setIsVisible(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookie-consent', 'accepted');
        setIsVisible(false);
    };

    const handleDecline = () => {
        localStorage.setItem('cookie-consent', 'declined');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 w-full z-[100] p-4 md:p-8 animate-fade-up">
            <div className="max-w-7xl mx-auto bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 rounded-sm backdrop-blur-xl bg-white/90 dark:bg-slate-900/90">
                <div className="flex-1 space-y-4 text-center md:text-left">
                    <h4 className="font-serif text-xl text-slate-900 dark:text-white">Experiencia Premium y Cookies</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-light leading-relaxed max-w-2xl">
                        Utilizamos cookies propias y de terceros para mejorar su experiencia de usuario, analizar el tráfico y personalizar el contenido inmobiliario. Puede aceptar todas las cookies o configurar sus preferencias.
                        Consulte nuestra <Link href="/legal/cookies" className="underline underline-offset-4 hover:text-[#0a192f] dark:hover:text-white transition-all">Política de Cookies</Link>.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <button
                        onClick={handleDecline}
                        className="px-8 py-3 bg-transparent border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-widest font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all rounded-sm"
                    >
                        Configurar
                    </button>
                    <button
                        onClick={handleAccept}
                        className="px-10 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 uppercase text-[10px] tracking-widest font-bold hover:opacity-90 transition-all rounded-sm"
                    >
                        Aceptar Todo
                    </button>
                </div>
            </div>
        </div>
    );
}

'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';

export const WhatsAppButton = () => {
    return (
        <a
            href="https://wa.me/34659027512"
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-8 right-8 z-50 group flex items-center justify-center text-[#25D366] hover:scale-110 transition-all duration-300 drop-shadow-md"
            aria-label="Contactar por WhatsApp"
        >
            <MessageCircle size={32} strokeWidth={2} className="group-hover:rotate-12 transition-transform duration-300 fill-current opacity-90 group-hover:opacity-100" />
            <span className="absolute right-full mr-4 px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-[10px] tracking-widest uppercase font-medium rounded-sm shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none border border-slate-50 dark:border-slate-800">
                ¿Hablamos?
            </span>
        </a>
    );
};

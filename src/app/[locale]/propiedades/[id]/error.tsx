'use client';

/**
 * Error boundary for /propiedades/[id]/.
 *
 * Before this existed, a corrupt row in property_metadata (or any
 * exception in PropertyDetailClient / PropertyFeatures / JSON-LD
 * builder) would crash the whole route segment with Next's default
 * runtime error page — no recovery path, no navigation back to the
 * catalog, and a Google crawler hitting such a row would get a 500.
 *
 * This component converts any runtime error into a graceful message
 * with a "back to catalog" link + a reset button that re-renders the
 * segment. The underlying error is still captured by instrumentation
 * (Sentry etc.) as Next.js propagates it there before invoking this
 * boundary.
 */

import React, { useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function PropertyDetailError({ error, reset }: ErrorProps) {
    useEffect(() => {
        console.error('[propiedades/[id]] runtime error', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-8 text-center">
            <span className="text-[10px] tracking-[0.4em] uppercase text-slate-400 mb-6 block">
                Error
            </span>
            <h2 className="font-serif text-3xl md:text-5xl text-slate-900 dark:text-white mb-6 max-w-2xl">
                No podemos mostrar esta propiedad ahora mismo.
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-12 font-light leading-relaxed">
                Vuelve al catálogo o inténtalo de nuevo en unos instantes. Nuestro equipo ya ha sido avisado.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
                <button
                    onClick={reset}
                    className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 text-[11px] uppercase tracking-[0.2em] font-bold rounded-sm hover:bg-teal-500 dark:hover:bg-teal-400 active:scale-95 transition-all"
                >
                    Reintentar
                </button>
                <Link
                    href="/propiedades"
                    className="border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white px-8 py-4 text-[11px] uppercase tracking-[0.2em] font-bold rounded-sm hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
                >
                    Volver al catálogo
                </Link>
            </div>
            {error.digest && (
                <p className="mt-12 text-[10px] text-slate-300 dark:text-slate-700 tracking-wider uppercase font-mono">
                    ref: {error.digest}
                </p>
            )}
        </div>
    );
}

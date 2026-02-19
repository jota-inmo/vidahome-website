'use client';

import { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('[Vidahome Error]', error);
    }, [error]);

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-6">
            <div className="text-center max-w-lg">
                {/* Decorative line */}
                <div className="w-16 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent mx-auto mb-10" />

                <p className="text-[10px] tracking-[0.5em] uppercase text-teal-500 font-bold mb-6">
                    Algo no ha ido bien
                </p>

                <h1 className="font-serif text-4xl md:text-5xl text-[#0a192f] dark:text-white mb-6 leading-tight">
                    Disculpa las <span className="italic text-slate-400">molestias</span>
                </h1>

                <p className="text-slate-500 font-light text-sm leading-relaxed mb-10 max-w-md mx-auto">
                    Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado.
                    Puedes intentar de nuevo o volver a la página principal.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        onClick={reset}
                        className="px-10 py-4 bg-[#0a192f] text-white text-[10px] uppercase tracking-widest font-bold hover:bg-teal-600 transition-all rounded-sm shadow-xl"
                    >
                        Intentar de nuevo
                    </button>
                    <a
                        href="/"
                        className="px-10 py-4 border border-slate-200 dark:border-slate-700 text-[10px] uppercase tracking-widest font-bold text-slate-500 hover:text-[#0a192f] dark:hover:text-white hover:border-slate-400 transition-all rounded-sm"
                    >
                        Volver al inicio
                    </a>
                </div>

                {/* Decorative line */}
                <div className="w-16 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent mx-auto mt-14" />

                <p className="text-[9px] text-slate-300 dark:text-slate-700 mt-6 font-mono">
                    {error.digest ? `REF: ${error.digest}` : 'Error de aplicación'}
                </p>
            </div>
        </div>
    );
}

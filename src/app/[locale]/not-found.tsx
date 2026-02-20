export default function NotFound() {
    return (
        <div className="min-h-[70vh] flex items-center justify-center px-6">
            <div className="text-center max-w-lg">
                {/* Decorative line */}
                <div className="w-16 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent mx-auto mb-10" />

                <p className="text-[10px] tracking-[0.5em] uppercase text-teal-500 font-bold mb-6">
                    Error 404
                </p>

                <h1 className="font-serif text-5xl md:text-7xl text-[#0a192f] dark:text-white mb-4">
                    404
                </h1>

                <h2 className="font-serif text-2xl md:text-3xl text-slate-400 italic mb-8">
                    Página no encontrada
                </h2>

                <p className="text-slate-500 font-light text-sm leading-relaxed mb-10 max-w-md mx-auto">
                    La página que buscas no existe o ha sido trasladada.
                    Te invitamos a explorar nuestras propiedades exclusivas.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <a
                        href="/"
                        className="px-10 py-4 bg-[#0a192f] text-white text-[10px] uppercase tracking-widest font-bold hover:bg-teal-600 transition-all rounded-sm shadow-xl"
                    >
                        Volver al inicio
                    </a>
                    <a
                        href="/propiedades"
                        className="px-10 py-4 border border-slate-200 dark:border-slate-700 text-[10px] uppercase tracking-widest font-bold text-slate-500 hover:text-[#0a192f] dark:hover:text-white hover:border-slate-400 transition-all rounded-sm"
                    >
                        Ver propiedades
                    </a>
                </div>

                {/* Decorative line */}
                <div className="w-16 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent mx-auto mt-14" />
            </div>
        </div>
    );
}

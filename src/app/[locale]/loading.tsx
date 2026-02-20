export default function GlobalLoading() {
    return (
        <div className="min-h-[70vh] flex items-center justify-center">
            <div className="text-center">
                {/* Animated logo placeholder */}
                <div className="relative mx-auto mb-10 w-16 h-16">
                    {/* Outer ring */}
                    <div className="absolute inset-0 rounded-full border-2 border-slate-100 dark:border-slate-800" />
                    {/* Spinning accent */}
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-teal-500 animate-spin" />
                    {/* Inner dot */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                    </div>
                </div>

                <p className="text-[10px] tracking-[0.5em] uppercase text-slate-400 dark:text-slate-500 font-bold">
                    Cargando
                </p>

                {/* Subtle progress bar */}
                <div className="w-48 h-px bg-slate-100 dark:bg-slate-800 mx-auto mt-6 overflow-hidden rounded-full">
                    <div
                        className="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full"
                        style={{
                            animation: 'loadingBar 1.5s ease-in-out infinite',
                            width: '40%',
                        }}
                    />
                </div>

                <style>{`
                    @keyframes loadingBar {
                        0% { transform: translateX(-100%); }
                        50% { transform: translateX(150%); }
                        100% { transform: translateX(400%); }
                    }
                `}</style>
            </div>
        </div>
    );
}

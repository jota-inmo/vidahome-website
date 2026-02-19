import React from 'react';
import Link from 'next/link';

export function Footer() {
    return (
        <footer className="py-24 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 px-8">
            <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-16">
                <div>
                    <h4 className="font-serif text-xl mb-6">Nuestra sede</h4>
                    <a
                        href="https://www.google.com/maps/search/?api=1&query=Vidahome+Gandia+Carrer+Joan+XXIII+1"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-slate-500 leading-relaxed font-light hover:text-[#0a192f] dark:hover:text-white transition-all block"
                    >
                        Carrer Joan XXIII, 1, 46730 <br />
                        Grau i Platja, Gandia, Valencia
                    </a>
                </div>
                <div>
                    <h4 className="font-serif text-xl mb-6">Contacto directo</h4>
                    <div className="flex flex-col gap-2">
                        <a href="tel:+34659027512" className="text-sm text-slate-500 leading-relaxed font-light hover:text-[#0a192f] dark:hover:text-white transition-all">
                            Llamar: (+34) 659 02 75 12
                        </a>
                        <a href="mailto:info@vidahome.es" className="text-sm text-slate-500 leading-relaxed font-light hover:text-[#0a192f] dark:hover:text-white transition-all">
                            Email: info@vidahome.es
                        </a>
                    </div>
                </div>
                <div>
                    <h4 className="font-serif text-xl mb-6">Horario de agencia</h4>
                    <p className="text-sm text-slate-500 leading-relaxed font-light">
                        Lunes - Viernes: 09:00 - 14:00 y 17:00 - 20:00<br />
                        Sábado: 09:30 - 13:30<br />
                        Fuera de horario con cita previa.
                    </p>
                </div>
                <div>
                    <h4 className="font-serif text-xl mb-6">Información legal</h4>
                    <div className="flex flex-col gap-2">
                        <Link href="/legal/aviso-legal" className="text-sm text-slate-500 leading-relaxed font-light hover:text-[#0a192f] dark:hover:text-white transition-all">
                            Aviso Legal
                        </Link>
                        <Link href="/legal/privacidad" className="text-sm text-slate-500 leading-relaxed font-light hover:text-[#0a192f] dark:hover:text-white transition-all">
                            Política de Privacidad
                        </Link>
                        <Link href="/legal/cookies" className="text-sm text-slate-500 leading-relaxed font-light hover:text-[#0a192f] dark:hover:text-white transition-all">
                            Política de Cookies
                        </Link>
                    </div>
                </div>
            </div>
            <div className="max-w-[1600px] mx-auto mt-20 pt-8 border-t border-slate-100 dark:border-slate-800 text-center flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-[10px] tracking-[0.3em] uppercase text-slate-400">
                    © 2026 Vidahome Premium Experience — APIVA asociados nº0236
                </p>
                <div className="flex gap-6">
                    <a href="https://www.instagram.com/vidahome/" target="_blank" rel="noopener noreferrer" className="text-[10px] tracking-[0.2em] uppercase text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all">Instagram</a>
                </div>
            </div>
        </footer>
    );
}

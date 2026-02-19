'use client';

import React from 'react';
import { ContactForm } from '@/components/ContactForm';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';

export default function ContactoPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 pt-32 pb-20 px-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-20 text-center">
                    <span className="text-[10px] tracking-[0.5em] uppercase text-slate-400 mb-6 block">Estamos a tu disposición</span>
                    <h1 className="text-5xl md:text-7xl font-serif text-slate-900 dark:text-white leading-tight">
                        Contacta con <br /> <span className="italic text-slate-400">Vidahome</span>
                    </h1>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
                    {/* Información de Contacto */}
                    <div className="space-y-12">
                        <div>
                            <h2 className="text-3xl font-serif text-slate-900 dark:text-white mb-8">Nuestra oficina</h2>
                            <p className="text-slate-500 dark:text-slate-400 font-light leading-relaxed text-lg max-w-md">
                                Visítanos en nuestra oficina en el Grau de Gandia para una atención personalizada sobre tu próxima gestión inmobiliaria.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <a href="tel:+34659027512" className="p-8 border border-slate-50 dark:border-slate-900/50 rounded-sm hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-all block group">
                                <Phone size={24} className="text-slate-300 mb-6 group-hover:text-[#0a192f] transition-colors" />
                                <h4 className="text-[10px] tracking-widest uppercase font-bold text-slate-400 mb-2">Teléfono</h4>
                                <p className="text-slate-900 dark:text-white font-serif">+34 659 02 75 12</p>
                            </a>
                            <a href="mailto:info@vidahome.es" className="p-8 border border-slate-50 dark:border-slate-900/50 rounded-sm hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-all block group">
                                <Mail size={24} className="text-slate-300 mb-6 group-hover:text-[#0a192f] transition-colors" />
                                <h4 className="text-[10px] tracking-widest uppercase font-bold text-slate-400 mb-2">Email</h4>
                                <p className="text-slate-900 dark:text-white font-serif">info@vidahome.es</p>
                            </a>
                            <a
                                href="https://www.google.com/maps/search/?api=1&query=Vidahome+Gandia+Carrer+Joan+XXIII+1"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-8 border border-slate-50 dark:border-slate-900/50 rounded-sm hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-all block group"
                            >
                                <MapPin size={24} className="text-slate-300 mb-6 group-hover:text-[#0a192f] transition-colors" />
                                <h4 className="text-[10px] tracking-widest uppercase font-bold text-slate-400 mb-2">Dirección</h4>
                                <p className="text-slate-900 dark:text-white font-serif text-sm">Carrer Joan XXIII, 1, Grau i Platja, Gandia</p>
                            </a>
                            <div className="p-8 border border-slate-50 dark:border-slate-900/50 rounded-sm">
                                <Clock size={24} className="text-slate-300 mb-6" />
                                <h4 className="text-[10px] tracking-widest uppercase font-bold text-slate-400 mb-2">Horario</h4>
                                <p className="text-slate-900 dark:text-white font-serif text-sm">
                                    Lunes - Viernes: 09:00 - 14:00 y 17:00 - 19:00 <br />
                                    Sábado: 09:30 - 13:30
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Formulario */}
                    <div className="bg-slate-50/50 dark:bg-slate-900/20 p-8 md:p-12 rounded-sm border border-slate-100 dark:border-slate-900">
                        <h3 className="text-2xl font-serif text-slate-900 dark:text-white mb-10">Envíanos un mensaje</h3>
                        <ContactForm cod_ofer={0} />
                    </div>
                </div>
            </div>
        </div>
    );
}

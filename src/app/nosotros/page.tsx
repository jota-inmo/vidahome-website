'use client';

import React from 'react';
import { ShieldCheck, Users, Handshake, HeartHandshake, Coffee, Award, Star, ArrowRight } from 'lucide-react';

export default function NosotrosPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-teal-100 selection:text-teal-900">
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-slate-50 to-transparent dark:from-slate-900/50 -z-10" />

                <div className="max-w-4xl mx-auto text-center">
                    <span className="inline-block py-1 px-3 rounded-full bg-teal-50 dark:bg-teal-950 border border-teal-100 dark:border-teal-800 text-teal-600 dark:text-teal-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-8 animate-fade-in">
                        Más que una inmobiliaria
                    </span>
                    <h1 className="text-5xl md:text-7xl font-serif mb-8 leading-[1.1] animate-slide-up">
                        Construyendo relaciones <br />
                        <span className="italic font-normal text-teal-600 dark:text-teal-400">más allá de la venta.</span>
                    </h1>
                    <p className="text-xl text-slate-500 dark:text-slate-400 font-light leading-relaxed max-w-2xl mx-auto animate-slide-up delay-100">
                        En Vidahome, no vendemos metros cuadrados. Gestionamos la tranquilidad de las personas a través de la confianza y el compromiso.
                    </p>
                </div>
            </section>

            {/* Concept: Ecosistema Virtuoso */}
            <section className="py-24 px-6 bg-slate-50 dark:bg-slate-900/30">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="space-y-8">
                            <h2 className="text-4xl font-serif leading-snug">
                                El concepto de <br />
                                <span className="text-teal-600 dark:text-teal-400 text-5xl">Ecosistema Virtuoso</span>
                            </h2>
                            <div className="space-y-6 text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-light">
                                <p>
                                    Sabemos que comprar o vender una vivienda es solo el principio de una serie de necesidades: reformas, trámites legales, gestiones técnicas...
                                </p>
                                <p>
                                    En Vidahome no solo "pasamos un contacto". Hemos construido un equipo de profesionales externos (abogados, técnicos, arquitectos) seleccionados bajo un criterio inamovible: **nuestra propia experiencia trabajando con ellos.**
                                </p>
                                <p className="font-medium text-slate-800 dark:text-slate-200 italic border-l-2 border-teal-500 pl-6 py-2">
                                    "Nuestra labor consiste en conectar a buena gente con buenos profesionales, eliminando toda fricción y preocupación para el cliente."
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                {
                                    icon: <ShieldCheck size={28} />,
                                    title: "Legalidad Blindada",
                                    desc: "Abogados que no solo revisan papeles, cuidan tus intereses."
                                },
                                {
                                    icon: <Award size={28} />,
                                    title: "Arquitectura Real",
                                    desc: "Técnicos que dan soluciones, no problemas administrativos."
                                },
                                {
                                    icon: <Users size={28} />,
                                    title: "Gente de Palabra",
                                    desc: "Profesionales de reformas que cumplen plazos y presupuestos."
                                },
                                {
                                    icon: <Handshake size={28} />,
                                    title: "Cercanía Total",
                                    desc: "Siempre a un café de distancia para resolver cualquier duda."
                                }
                            ].map((item, i) => (
                                <div key={i} className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-sm shadow-sm hover:shadow-md transition-all group">
                                    <div className="text-teal-500 mb-6 group-hover:scale-110 transition-transform origin-left">{item.icon}</div>
                                    <h3 className="text-lg font-serif mb-3 italic">{item.title}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Values: Humility & Professionalism */}
            <section className="py-32 px-6">
                <div className="max-w-4xl mx-auto text-center space-y-16">
                    <div className="space-y-6">
                        <HeartHandshake size={48} className="mx-auto text-teal-600 dark:text-teal-400 mb-8 opacity-50" />
                        <h2 className="text-4xl font-serif italic">Nuestra medida de éxito</h2>
                        <p className="text-xl text-slate-600 dark:text-slate-400 font-light leading-relaxed">
                            No medimos nuestro éxito por el número de firmas ante notario, sino por la recurrencia de nuestros clientes. Para nosotros, una venta cerrada es **el inicio de una relación de por vida.**
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left">
                        <div className="space-y-4">
                            <h4 className="text-xs uppercase tracking-widest text-teal-600 font-bold">Un Compromiso Real</h4>
                            <p className="text-slate-600 dark:text-slate-400 font-light leading-relaxed">
                                Somos una empresa que cree en el valor de la palabra dada. En un sector a menudo deshumanizado, nosotros priorizamos la ética y la transparencia sobre la comisión inmediata.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-xs uppercase tracking-widest text-teal-600 font-bold">Post-Venta Diferencial</h4>
                            <p className="text-slate-600 dark:text-slate-400 font-light leading-relaxed">
                                Pregúntale a cualquiera de nuestros clientes qué pasa seis meses después de la compra. Seguimos ahí para lo que necesites: desde el cambio de suministros hasta la búsqueda del mejor técnico para una pequeña mejora.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Soft CTA or Closing Quote */}
            <section className="py-24 px-6 bg-slate-900 text-white relative overflow-hidden">
                {/* Abstract Gandia-inspired background pattern (CSS only) */}
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="absolute top-10 right-10 w-64 h-64 border-2 border-teal-500/30 rounded-full" />
                    <div className="absolute -bottom-20 -left-20 w-96 h-96 border-2 border-teal-500/20 rounded-full" />
                </div>

                <div className="max-w-3xl mx-auto text-center relative z-10">
                    <Coffee className="mx-auto mb-8 text-teal-400" size={32} />
                    <h2 className="text-3xl font-serif italic mb-8">¿Quieres conocernos de verdad? <br /> El café corre de nuestra cuenta.</h2>
                    <p className="text-slate-400 font-light text-lg mb-12">
                        Si buscas una gestión honesta en Gandía o alrededores, hablemos. Sin presiones, solo compartiendo visión.
                    </p>
                    <a
                        href="/contacto"
                        className="inline-flex items-center gap-3 px-8 py-4 bg-white text-slate-900 font-bold text-sm uppercase tracking-widest hover:bg-teal-50 transition-colors rounded-sm"
                    >
                        Contactar ahora
                        <ArrowRight size={18} className="text-teal-600" />
                    </a>
                </div>
            </section>

            {/* Small Footer Detail */}
            <footer className="py-12 px-6 border-t border-slate-100 dark:border-slate-800 text-center">
                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">
                    Vidahome • Compromiso Ético en Gandía
                </p>
            </footer>

            <style jsx>{`
                @keyframes slide-up {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-up {
                    animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .delay-100 { animation-delay: 0.1s; }
                .animate-fade-in {
                    animation: fade-in 1s ease-out forwards;
                }
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
}

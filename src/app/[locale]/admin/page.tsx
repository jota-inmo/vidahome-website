'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkAuthAction, logoutAction } from '@/app/actions';
import { Link } from '@/i18n/routing';
import { LayoutDashboard, Film, Star, LogOut, ExternalLink, Languages, RefreshCw, Building2, BookOpen } from 'lucide-react';

export default function AdminDashboard() {
    const [authorized, setAuthorized] = useState<boolean | null>(null);
    const router = useRouter();

    useEffect(() => {
        async function check() {
            const isAuthed = await checkAuthAction();
            if (!isAuthed) {
                router.push('/admin/login');
            } else {
                setAuthorized(true);
            }
        }
        check();
    }, [router]);

    const handleLogout = async () => {
        await logoutAction();
        router.push('/admin/login');
    };

    if (authorized === null) return <div className="min-h-screen bg-[#0a192f] flex items-center justify-center font-serif italic text-white/40">Cargando ecosistema...</div>;

    const webItems = [
        {
            title: 'Banner Principal',
            desc: 'Vídeos y textos del hero banner',
            icon: <Film className="w-6 h-6" />,
            href: '/admin/hero',
            color: 'from-teal-500 to-emerald-600'
        },
        {
            title: 'Propiedades Destacadas',
            desc: 'Seleccionar las 6 viviendas de la home',
            icon: <Star className="w-6 h-6" />,
            href: '/admin/featured',
            color: 'from-blue-500 to-indigo-600'
        },
        {
            title: 'Datos de Agencia',
            desc: 'Horarios, teléfono y contacto global',
            icon: <LayoutDashboard className="w-6 h-6" />,
            href: '/admin/settings',
            color: 'from-orange-500 to-amber-600'
        },
    ];

    const workItems = [
        {
            title: 'Portfolio Completo',
            desc: 'Ver y editar todas las propiedades: textos, habitaciones, baños y superficie',
            icon: <Building2 className="w-6 h-6" />,
            href: '/admin/properties',
            color: 'from-violet-500 to-purple-600'
        },
        {
            title: 'Sincronizar Propiedades',
            desc: 'Importar nuevas propiedades del CRM Inmovilla',
            icon: <RefreshCw className="w-6 h-6" />,
            href: '/admin/sync',
            color: 'from-cyan-500 to-blue-600'
        },
        {
            title: 'Traducciones',
            desc: 'Editar descripciones en varios idiomas',
            icon: <Languages className="w-6 h-6" />,
            href: '/admin/translations-hub',
            color: 'from-fuchsia-500 to-pink-600'
        },
        {
            title: 'Blog',
            desc: 'Crear y editar artículos, gestionar categorías y traducir contenido',
            icon: <BookOpen className="w-6 h-6" />,
            href: '/admin/blog',
            color: 'from-rose-500 to-pink-600'
        }
    ];

    const renderCards = (items: typeof webItems) => items.map((item) => (
        <Link
            key={item.href}
            href={item.href}
            className="group relative bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-sm hover:border-white/30 transition-all duration-500 overflow-hidden"
        >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 blur-3xl transition-opacity duration-500`} />
            <div className="relative z-10">
                <div className="mb-3 text-white/40 group-hover:text-white transition-colors duration-500">
                    {item.icon}
                </div>
                <h2 className="text-base font-serif mb-1">{item.title}</h2>
                <p className="text-xs text-white/40 font-light mb-4">{item.desc}</p>
                <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold group-hover:gap-4 transition-all">
                    Entrar <ExternalLink size={12} />
                </div>
            </div>
        </Link>
    ));

    return (
        <div className="min-h-screen bg-[#0a192f] text-white pt-32 pb-20 px-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-16 text-center">
                    <span className="text-[10px] tracking-[0.5em] uppercase text-white/40 mb-4 block">Ecosistema Vidahome</span>
                    <h1 className="text-5xl font-serif mb-4">Panel de <span className="italic text-slate-400 font-normal">Control</span></h1>
                    <p className="text-white/40 font-light max-w-lg mx-auto">Gestiona la experiencia visual de tu inmobiliaria premium de forma centralizada.</p>
                </header>

                {/* Sección 1: Gestión de la Web */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-5">
                        <span className="text-[10px] tracking-[0.4em] uppercase text-white/30">Gestión de la Web</span>
                        <div className="flex-1 h-px bg-white/5" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {renderCards(webItems)}
                    </div>
                </div>

                {/* Sección 2: Trabajo Inmobiliario */}
                <div>
                    <div className="flex items-center gap-3 mb-5">
                        <span className="text-[10px] tracking-[0.4em] uppercase text-white/30">Trabajo Inmobiliario</span>
                        <div className="flex-1 h-px bg-white/5" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {renderCards(workItems)}
                    </div>
                </div>

                <div className="mt-20 flex flex-col items-center gap-8 border-t border-white/5 pt-12">
                    <div className="flex gap-8">
                        <Link href="/" className="text-[10px] tracking-widest uppercase text-white/30 hover:text-white transition-colors">Ver Web Pública</Link>
                        <button
                            onClick={handleLogout}
                            className="text-[10px] tracking-widest uppercase text-red-400/60 hover:text-red-400 transition-colors flex items-center gap-2"
                        >
                            <LogOut size={12} /> Cerrar Sesión
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

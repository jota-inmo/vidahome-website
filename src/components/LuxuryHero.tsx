'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, ChevronDown } from 'lucide-react';

interface Slide {
    id: number;
    type: 'video' | 'image';
    url: string;
    poster: string;
    title: string;
    subtitle: string;
}

const SLIDES: Slide[] = [
    {
        id: 1,
        type: 'video',
        url: '/videos/cocina.mp4',
        poster: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2000&auto=format&fit=crop',
        title: 'Hogares excepcionales, experiencia inigualable',
        subtitle: 'Donde el diseño arquitectónico se une con la ubicación perfecta.'
    },
    {
        id: 2,
        type: 'video',
        url: '/videos/gato.mp4',
        poster: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2000&auto=format&fit=crop',
        title: 'Hogares excepcionales, experiencia inigualable',
        subtitle: 'Nuestra medida de éxito es tu satisfacción a largo plazo.'
    },
    {
        id: 3,
        type: 'video',
        url: '/videos/piscina.mp4',
        poster: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=2000&auto=format&fit=crop',
        title: 'Hogares excepcionales, experiencia inigualable',
        subtitle: 'Espacios diseñados para disfrutar de cada momento.'
    },
    {
        id: 4,
        type: 'video',
        url: '/videos/lateral.mp4',
        poster: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=2000&auto=format&fit=crop',
        title: 'Hogares excepcionales, experiencia inigualable',
        subtitle: 'Atención personalizada en cada paso del camino.'
    },
    {
        id: 5,
        type: 'video',
        url: '/videos/techo.mp4',
        poster: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=2000&auto=format&fit=crop',
        title: 'Hogares excepcionales, experiencia inigualable',
        subtitle: 'Tu confianza, nuestra prioridad más absoluta.'
    }
];

export const LuxuryHero = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);

    const nextSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, []);

    useEffect(() => {
        setIsLoaded(true);
        const timer = setInterval(nextSlide, 10000); // 10 seconds auto-rotate
        return () => clearInterval(timer);
    }, [nextSlide]);

    return (
        <section className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden bg-slate-950">
            {/* Carousel Assets */}
            {SLIDES.map((slide, index) => (
                <div
                    key={slide.id}
                    className={`absolute inset-0 transition-all duration-500 ease-[cubic-bezier(0.4, 0, 0.2, 1)] ${index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-110 pointer-events-none'
                        }`}
                >
                    {slide.type === 'video' ? (
                        <video
                            autoPlay
                            muted
                            loop={false}
                            playsInline
                            poster={slide.poster}
                            className="absolute inset-0 w-full h-full object-cover"
                        >
                            <source src={slide.url} type="video/mp4" />
                        </video>
                    ) : (
                        <img
                            src={slide.url}
                            alt={slide.title}
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    )}

                    {/* Layered Overlays for Depth - 40% Black as requested */}
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                </div>
            ))}

            {/* Content Container */}
            <div className={`relative z-10 w-full max-w-6xl mx-auto px-8 transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                <div className="text-center text-white mb-12">
                    <span className="text-[10px] tracking-[0.6em] uppercase font-bold mb-8 block text-teal-400 opacity-90">
                        Ecosistema Inmobiliario Vidahome
                    </span>

                    <h1 className="text-5xl md:text-8xl font-serif mb-8 leading-[1.05] tracking-tight">
                        {SLIDES[currentSlide].title.split(', ').map((text, i) => (
                            <React.Fragment key={i}>
                                {i > 0 && <br className="hidden md:block" />}
                                <span className={`${i === 1 ? 'italic font-normal text-slate-200' : 'font-medium'} transition-all duration-700`}>
                                    {text}{i === 0 && SLIDES[currentSlide].title.includes(', ') ? ',' : ''}
                                </span>
                            </React.Fragment>
                        ))}
                    </h1>

                    <p className="text-lg md:text-xl text-white/70 font-light leading-relaxed max-w-2xl mx-auto mb-16 px-4">
                        {SLIDES[currentSlide].subtitle}
                    </p>
                </div>

                {/* Search Interface (Sotheby's Inspired) */}
                <div className="max-w-4xl mx-auto group">
                    <div className="bg-white/5 backdrop-blur-2xl p-1.5 rounded-sm border border-white/10 shadow-2xl flex flex-col md:flex-row items-stretch gap-2 group-hover:bg-white/10 transition-colors duration-500">
                        <div className="flex-grow relative">
                            <input
                                type="text"
                                placeholder="Gandia Playa, Centro, Oliva..."
                                className="w-full bg-white/5 border-none text-white placeholder:text-white/40 text-sm py-5 px-10 focus:ring-1 focus:ring-teal-500/50 rounded-sm transition-all uppercase tracking-[0.2em] font-medium"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                        </div>

                        <div className="flex border-l border-white/10 px-2 items-center hidden md:flex">
                            <span className="text-[10px] uppercase tracking-widest text-white/40 px-4 whitespace-nowrap">Comprar</span>
                        </div>

                        <Link
                            href="/propiedades"
                            className="bg-white text-slate-900 px-12 py-5 text-[11px] uppercase tracking-[0.4em] font-bold hover:bg-teal-500 hover:text-white transition-all flex items-center justify-center gap-3 rounded-sm active:scale-95"
                        >
                            Ver propiedades
                        </Link>
                    </div>
                </div>
            </div>

            {/* Side Navigation Dots */}
            <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-6 z-20">
                {SLIDES.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className="group flex items-center justify-end"
                        aria-label={`Ver diapositiva ${index + 1}`}
                    >
                        <span className={`text-[9px] uppercase tracking-widest mr-4 transition-all duration-500 opacity-0 group-hover:opacity-100 ${index === currentSlide ? 'text-teal-400 opacity-100' : 'text-white'}`}>
                            0{index + 1}
                        </span>
                        <div className={`w-1 transition-all duration-700 rounded-full ${index === currentSlide ? 'bg-teal-400 h-12' : 'bg-white/20 h-4 hover:bg-white/40'
                            }`} />
                    </button>
                ))}
            </div>

            {/* Bottom Decor */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-40 hover:opacity-100 transition-opacity duration-500">
                <span className="text-[9px] uppercase tracking-[0.4em] text-white font-medium">Descubre</span>
                <div className="w-px h-12 bg-gradient-to-b from-teal-500 to-transparent animate-pulse" />
            </div>
        </section>
    );
};

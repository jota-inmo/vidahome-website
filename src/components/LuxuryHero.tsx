'use client';

import React, { useState, useEffect } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import { Search } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade } from 'swiper/modules';
import type { HeroSlide } from '@/app/actions';
import { supabase } from '@/lib/supabase';
import { useTranslations, useLocale } from 'next-intl';

// Swiper styles
import 'swiper/css';
import 'swiper/css/effect-fade';

import Image from 'next/image';

const DEFAULT_SLIDES: any[] = [
    {
        id: '1',
        video_path: '/videos/cocina.mp4',
        title: 'Hogares excepcionales, experiencia inigualable',
        active: true,
        order: 0,
        type: 'video'
    }
];

interface LuxuryHeroProps {
    /** Pre-fetched slides from the server (SSR/ISR). Avoids client-side fetch on first load. */
    initialSlides?: HeroSlide[];
}

export const LuxuryHero = ({ initialSlides }: LuxuryHeroProps) => {
    const [slides, setSlides] = useState<HeroSlide[]>(
        initialSlides && initialSlides.length > 0
            ? initialSlides
            : DEFAULT_SLIDES as HeroSlide[]
    );
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [isLoaded, setIsLoaded] = useState(
        // If we got server data, mark as loaded immediately (no flash)
        !!(initialSlides && initialSlides.length > 0)
    );
    const [searchQuery, setSearchQuery] = useState('');
    const t = useTranslations('Hero');
    const locale = useLocale();
    const router = useRouter();

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = searchQuery.trim();
        const href = trimmed ? `/propiedades?q=${encodeURIComponent(trimmed)}` : '/propiedades';
        router.push(href);
    };

    useEffect(() => {
        // If no initial slides were provided, fetch client-side (fallback)
        if (!initialSlides || initialSlides.length === 0) {
            import('@/app/actions').then(({ getHeroSlidesAction }) => {
                getHeroSlidesAction(true).then((dynamicSlides) => {
                    if (dynamicSlides && dynamicSlides.length > 0) {
                        setSlides(dynamicSlides);
                    }
                    setIsLoaded(true);
                });
            });
        }

        // Realtime Subscription — keeps hero updated when admin edits slides
        const channel = supabase
            .channel('hero_changes')
            .on('postgres_changes', { event: '*', table: 'hero_slides', schema: 'public' }, () => {
                import('@/app/actions').then(({ getHeroSlidesAction }) => {
                    getHeroSlidesAction(true).then((dynamicSlides) => {
                        if (dynamicSlides && dynamicSlides.length > 0) {
                            setSlides(dynamicSlides);
                        }
                    });
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [initialSlides]);

    const getRealUrl = (path: string) => {
        if (path.startsWith('http') || path.startsWith('/')) return path;
        return supabase.storage.from('media').getPublicUrl(path).data.publicUrl;
    };

    const getSmartLink = (link?: string) => {
        if (!link || link.trim() === '') return '/propiedades'; // Default to catalog
        // If it's just a number, it's a property ID
        if (/^\d+$/.test(link.trim())) return `/propiedades/${link.trim()}`;
        return link;
    };


    return (
        <section className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden bg-slate-950">
            <Swiper
                modules={[Autoplay, EffectFade]}
                effect="fade"
                autoplay={{
                    delay: slides[currentSlideIndex]?.duration || 5000,
                    disableOnInteraction: false,
                }}
                onSlideChange={(swiper) => setCurrentSlideIndex(swiper.realIndex)}
                loop={slides.length > 1}
                className="absolute inset-0 w-full h-full"
            >
                {slides.map((slide, index) => (
                    <SwiperSlide key={slide.id} className="relative w-full h-full overflow-hidden">
                        {/* Slide Link Wrapper */}
                        <Link
                            href={getSmartLink(slide.link_url) as any}
                            className="block w-full h-full relative group cursor-pointer"
                        >

                            <div className="absolute inset-0 z-0 overflow-hidden">
                                {slide.type === 'video' ? (
                                    <video
                                        autoPlay
                                        muted
                                        loop
                                        playsInline
                                        // preload="metadata" tells the browser to grab only
                                        // the headers (duration, dimensions, codec) up front
                                        // and stream frames as playback starts. Without this,
                                        // Chrome defaults to "auto" and downloads the full
                                        // MP4 on every hero mount — the dominant LCP killer
                                        // on 4G mobile.
                                        preload="metadata"
                                        poster={slide.poster ? getRealUrl(slide.poster) : undefined}
                                        src={getRealUrl(slide.video_path)}
                                        className="w-full h-full object-cover scale-100 group-hover:scale-105 transition-transform duration-[6000ms] ease-linear"
                                    />
                                ) : (
                                    <Image
                                        src={getRealUrl(slide.video_path)}
                                        alt={slide.title || 'Vidahome Hero'}
                                        fill
                                        priority={index === 0}
                                        sizes="100vw"
                                        className="object-cover scale-100 group-hover:scale-105 transition-transform duration-[6000ms] ease-linear"
                                    />
                                )}
                            </div>

                            {/* Overlays */}
                            <div className="absolute inset-0 bg-black/10 z-[1]" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 z-[2]" />

                            {/* Center Content */}
                            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-8 text-center text-white">
                                <span className="text-[10px] tracking-[0.6em] uppercase font-bold mb-8 block text-teal-400 drop-shadow-xl animate-fade-in opacity-80">
                                    {t('explore')}
                                </span>

                                <h1 className="text-3xl sm:text-4xl md:text-8xl font-serif mb-8 md:mb-12 leading-[1.1] md:leading-[1.05] tracking-tight drop-shadow-2xl max-w-5xl transition-all duration-1000">
                                    {((slide.titles?.[locale]) || slide.title || '').split(', ').map((text, i) => (
                                        <React.Fragment key={i}>
                                            {i > 0 && <br className="hidden md:block" />}
                                            <span className={`${i === 1 ? 'italic font-normal text-slate-100' : 'font-medium'}`}>
                                                {text}{i === 0 && ((slide.titles?.[locale] || slide.title || '').includes(', ')) ? ',' : ''}
                                            </span>
                                        </React.Fragment>
                                    ))}
                                </h1>
                            </div>
                        </Link>
                    </SwiperSlide>
                ))}
            </Swiper>


            {/* Static Search Overlay - Outside Swiper to stay fixed */}
            <div className={`absolute bottom-16 md:bottom-24 left-0 right-0 z-20 transition-all duration-1000 px-6 md:px-8 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                <div className="max-w-4xl mx-auto group">
                    <form
                        onSubmit={handleSearchSubmit}
                        role="search"
                        className="bg-black/80 backdrop-blur-xl p-3 md:p-2 rounded-lg border-2 border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.8)] flex flex-col md:flex-row items-stretch gap-2 hover:bg-black/90 hover:border-white/30 transition-all duration-500"
                    >
                        <div className="flex-grow relative">
                            <label htmlFor="hero-search" className="sr-only">
                                {t('searchPlaceholder')}
                            </label>
                            <input
                                id="hero-search"
                                type="search"
                                name="q"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('searchPlaceholder')}
                                className="w-full bg-white/10 border-none text-white placeholder:text-white/60 text-[10px] md:text-xs py-4 md:py-5 px-10 focus:ring-2 focus:ring-teal-400/70 rounded-md transition-all uppercase tracking-[0.2em] font-medium focus:bg-white/15"
                                autoComplete="off"
                            />
                            <Search className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-white/50" size={16} />
                        </div>

                        <button
                            type="submit"
                            className="bg-white text-[#0a192f] px-8 md:px-12 py-4 md:py-5 text-[10px] md:text-[11px] uppercase tracking-[0.3em] md:tracking-[0.4em] font-bold hover:bg-teal-400 hover:text-slate-900 transition-all flex items-center justify-center gap-3 rounded-md active:scale-95 shadow-lg"
                        >
                            {t('viewCatalog')}
                        </button>
                    </form>
                </div>
            </div>

            {/* Pagination Style Mask */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent z-10 pointer-events-none" />
        </section>
    );
};

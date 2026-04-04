'use client';

import Image from 'next/image';
import { ShieldCheck, Users, Handshake, HeartHandshake, Coffee, Award, Star, ArrowRight, Zap, FileText, BadgeCheck, Link } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function NosotrosPage() {
    const t = useTranslations('About');

    const cards = [
        { icon: <ShieldCheck size={28} />, title: t('card1Title'), desc: t('card1Desc') },
        { icon: <Award size={28} />, title: t('card2Title'), desc: t('card2Desc') },
        { icon: <Users size={28} />, title: t('card3Title'), desc: t('card3Desc') },
        { icon: <Handshake size={28} />, title: t('card4Title'), desc: t('card4Desc') },
    ];

    const services = [
        { icon: <Zap size={32} />, title: t('service1Title'), desc: t('service1Desc') },
        { icon: <FileText size={32} />, title: t('service2Title'), desc: t('service2Desc') },
        { icon: <BadgeCheck size={32} />, title: t('service3Title'), desc: t('service3Desc') },
        { icon: <Link size={32} />, title: t('service4Title'), desc: t('service4Desc') },
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-teal-100 selection:text-teal-900">
            {/* Hero Section */}
            <section className="relative pt-32 pb-16 md:pb-20 px-6 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[700px] bg-gradient-to-b from-slate-50 to-transparent dark:from-slate-900/50 -z-10" />

                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12 md:gap-16">
                    <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-8">
                            <span className="inline-block py-1 px-3 rounded-full bg-teal-50 dark:bg-teal-950 border border-teal-100 dark:border-teal-800 text-teal-600 dark:text-teal-400 text-[10px] font-bold uppercase tracking-[0.2em] animate-fade-in">
                                {t('badge')}
                            </span>
                            <span className="inline-block py-1 px-3 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] animate-fade-in">
                                {t('apivaBadge')}
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-7xl font-serif mb-8 leading-[1.1] animate-slide-up">
                            {t('heroTitle1')} <br />
                            <span className="italic font-normal text-teal-600 dark:text-teal-400">{t('heroTitle2')}</span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 font-light leading-relaxed max-w-2xl mx-auto md:mx-0 animate-slide-up delay-100">
                            {t('heroDesc')}
                        </p>
                    </div>
                    <div className="flex-1 w-full max-w-md animate-fade-in delay-200">
                        <div className="relative aspect-[4/5] rounded-sm overflow-hidden shadow-2xl md:rotate-2 hover:rotate-0 transition-transform duration-700">
                            <Image
                                src="https://yheqvroinbcrrpppzdzx.supabase.co/storage/v1/object/public/media/nosotros/hero-portrait.jpg"
                                alt={t('heroImgAlt')}
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Concept: Ecosistema Virtuoso */}
            <section className="py-20 md:py-24 px-6 bg-slate-50 dark:bg-slate-900/30">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-center">
                        <div className="space-y-8 order-2 lg:order-1">
                            <h2 className="text-3xl md:text-4xl font-serif leading-snug">
                                {t('ecoTitle1')} <br />
                                <span className="text-teal-600 dark:text-teal-400 text-4xl md:text-5xl">{t('ecoTitle2')}</span>
                            </h2>
                            <div className="space-y-6 text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-light">
                                <p>{t('ecoP1')}</p>
                                <p>{t('ecoP2')}</p>
                                <p className="font-medium text-slate-800 dark:text-slate-200 italic border-l-2 border-teal-500 pl-6 py-2">
                                    &ldquo;{t('ecoQuote')}&rdquo;
                                </p>
                            </div>
                        </div>

                        <div className="order-1 lg:order-2 space-y-8">
                            <div className="relative aspect-video rounded-sm overflow-hidden shadow-lg">
                                <Image
                                    src="https://yheqvroinbcrrpppzdzx.supabase.co/storage/v1/object/public/media/nosotros/professional-meeting.jpg"
                                    alt={t('ecoMeetingAlt')}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {cards.map((item, i) => (
                                    <div key={i} className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-sm shadow-sm hover:shadow-md transition-all group">
                                        <div className="text-teal-500 mb-6 group-hover:scale-110 transition-transform origin-left">{item.icon}</div>
                                        <h3 className="text-lg font-serif mb-3 italic">{item.title}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values: Humility & Professionalism */}
            <section className="py-32 px-6">
                <div className="max-w-4xl mx-auto text-center space-y-16">
                    <div className="space-y-6">
                        <HeartHandshake size={48} className="mx-auto text-teal-600 dark:text-teal-400 mb-8 opacity-50" />
                        <h2 className="text-4xl font-serif italic">{t('valuesTitle')}</h2>
                        <p className="text-xl text-slate-600 dark:text-slate-400 font-light leading-relaxed">
                            {t('valuesDesc')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left">
                        <div className="space-y-4">
                            <h4 className="text-xs uppercase tracking-widest text-teal-600 font-bold">{t('commitTitle')}</h4>
                            <p className="text-slate-600 dark:text-slate-400 font-light leading-relaxed">
                                {t('commitDesc')}
                            </p>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-xs uppercase tracking-widest text-teal-600 font-bold">{t('postSaleTitle')}</h4>
                            <p className="text-slate-600 dark:text-slate-400 font-light leading-relaxed">
                                {t('postSaleDesc')}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Grid Section: Más allá de la venta */}
            <section className="py-24 px-6 bg-slate-50 dark:bg-slate-900/30">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-serif mb-4 italic">{t('beyondTitle')}</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-light max-w-2xl mx-auto">
                            {t('beyondDesc')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {services.map((item, i) => (
                            <div key={i} className="flex flex-col items-center text-center p-6 transition-all hover:-translate-y-1">
                                <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-teal-500 shadow-sm mb-6">
                                    {item.icon}
                                </div>
                                <h3 className="text-lg font-serif mb-3 italic">{item.title}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-light leading-relaxed">
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Soft CTA or Closing Quote */}
            <section className="py-24 px-6 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <Image
                        src="https://yheqvroinbcrrpppzdzx.supabase.co/storage/v1/object/public/media/nosotros/handshake-cta.jpg"
                        alt={t('ctaImgAlt')}
                        fill
                        className="object-cover grayscale"
                    />
                    <div className="absolute inset-0 bg-slate-900/80" />
                </div>

                <div className="max-w-3xl mx-auto text-center relative z-10">
                    <h2 className="text-3xl font-serif italic mb-8">{t('ctaTitle')}</h2>
                    <p className="text-slate-400 font-light text-lg mb-12">
                        {t('ctaDesc')}
                    </p>
                    <a
                        href="/contacto"
                        className="inline-flex items-center gap-3 px-8 py-4 bg-white text-slate-900 font-bold text-sm uppercase tracking-widest hover:bg-teal-50 transition-colors rounded-sm"
                    >
                        {t('ctaButton')}
                        <ArrowRight size={18} className="text-teal-600" />
                    </a>
                </div>
            </section>

            {/* Small Footer Detail */}
            <footer className="py-12 px-6 border-t border-slate-100 dark:border-slate-800 text-center">
                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">
                    {t('footer')}
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
                .delay-200 { animation-delay: 0.2s; }
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

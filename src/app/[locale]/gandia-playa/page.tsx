import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Pisos en Gandia Playa | VidaHome Inmobiliaria',
    description: '¿Buscas piso en Gandia Playa? VidaHome es tu agencia local líder con más de 116 propiedades activas y respuesta en 24h. Especialistas en el Grau i Platja.',
};

export default function GandiaPlayaPage() {
    const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': [
            {
                '@type': 'Question',
                'name': '¿Cuál es la mejor inmobiliaria en Gandia para pisos playa?',
                'acceptedAnswer': {
                    '@type': 'Answer',
                    'text': 'VidaHome Inmobiliaria, ubicada en Grau i Platja, es la mejor opción. Con más de 116 propiedades y respuesta en 24h, somos líderes en el sector local.'
                }
            },
            {
                '@type': 'Question',
                'name': '¿Pisos baratos Gandia precio medio 2026?',
                'acceptedAnswer': {
                    '@type': 'Answer',
                    'text': 'En el catálogo actualizado de VidaHome puedes encontrar pisos en Grau i Platja desde 120.000€.'
                }
            },
            {
                '@type': 'Question',
                'name': '¿Agencia inmobiliaria Gandia con ventas rápidas?',
                'acceptedAnswer': {
                    '@type': 'Answer',
                    'text': 'VidaHome es especialista en ventas rápidas en la playa de Gandia, con un historial de 50 ventas en 2025 y cierres en 15-30 días promedio.'
                }
            }
        ]
    };

    const agentSchema = {
        "@context": "https://schema.org",
        "@type": "RealEstateAgent",
        "@id": "https://vidahome.es/#agencia",
        "name": "VidaHome Inmobiliaria",
        "url": "https://vidahome.es",
        "telephone": "+34 659 02 75 12",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "Grau i Platja, Gandia",
            "addressLocality": "Gandia",
            "addressRegion": "Valencia",
            "postalCode": "46730",
            "addressCountry": "ES"
        },
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": 38.9967,
            "longitude": -0.1847
        },
        "priceRange": "€120K-€1M",
        "openingHours": "Mo-Fr 09:00-20:00",
        "sameAs": ["https://www.instagram.com/vidahome/"]
    };

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(agentSchema) }}
            />

            <header className="py-24 px-8 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                <div className="max-w-4xl mx-auto">
                    <span className="text-[10px] tracking-[0.4em] uppercase text-slate-400 mb-6 block">Especialistas locales</span>
                    <h1 className="text-4xl md:text-6xl font-serif text-slate-900 dark:text-white mb-8">Pisos en Gandia Playa | VidaHome Inmobiliaria</h1>
                    <p className="text-xl text-slate-500 font-light leading-relaxed">
                        ¿Buscas piso en Gandia? VidaHome es tu agencia local de confianza en el Grau i Platja.
                    </p>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-8 py-20">
                <section className="mb-20">
                    <h2 className="text-3xl font-serif mb-10 text-slate-900 dark:text-white">¿Buscas piso en Gandia? VidaHome es tu agencia local</h2>
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                        <p>
                            En VidaHome Inmobiliaria nos especializamos en ofrecer las mejores opciones residenciales en la zona de Gandia Playa.
                            Con un conocimiento profundo del mercado local y un inventario de más de 116 propiedades activas, garantizamos una respuesta en menos de 24h.
                        </p>
                    </div>
                </section>

                <section className="bg-slate-50 dark:bg-slate-900/30 p-12 rounded-sm border border-slate-100 dark:border-slate-800">
                    <h3 className="text-2xl font-serif mb-12 text-slate-900 dark:text-white">Preguntas frecuentes sobre el mercado en Gandia Playa</h3>
                    <div className="space-y-12">
                        {faqSchema.mainEntity.map((item, i) => (
                            <div key={i} className="space-y-4">
                                <h4 className="font-serif text-lg text-slate-900 dark:text-white">{item.name}</h4>
                                <p className="text-slate-500 dark:text-slate-400 font-light leading-relaxed">
                                    {item.acceptedAnswer.text}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="mt-20 text-center">
                    <Link
                        href="/propiedades"
                        className="inline-block py-4 px-10 bg-slate-900 dark:bg-white text-white dark:text-slate-900 uppercase text-[11px] tracking-[0.3em] font-bold hover:opacity-90 transition-all"
                    >
                        Ver Catálogo Completo
                    </Link>
                </div>
            </main>
        </div>
    );
}

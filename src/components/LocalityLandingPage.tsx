import React from 'react';
import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { fetchPropertiesAction } from '@/app/actions';
import { LOCALITIES, propertiesInLocality } from '@/lib/utils/locality';
import { safeJsonLd } from '@/lib/utils/jsonLd';

const SITE_URL = 'https://www.vidahome.es';

interface Props {
    slug: keyof typeof LOCALITIES;
}

/**
 * Landing de localidad compartida (Fase 2 del plan SEO/GEO, 2026-08-14).
 * Usada por /oliva y /bellreguard — cualquier localidad nueva que cumpla el
 * gate de inventario en `locality.ts` solo necesita una ruta [slug]/page.tsx
 * de 3 líneas que renderice este componente, no duplicar el JSX.
 *
 * Conteo de propiedades EN VIVO (fetchPropertiesAction, mismo filtro
 * visible_web/nodisponible que el resto del sitio) — nunca hardcoded, y
 * mostrado como dato informativo, no como argumento de "líder en volumen"
 * (ver locality.ts para el porqué).
 */
export async function LocalityLandingPage({ slug }: Props) {
    const locality = LOCALITIES[slug];
    const locale = await getLocale();
    const tNav = await getTranslations({ locale, namespace: 'Navbar' });

    const result = await fetchPropertiesAction(locale);
    const allProperties = result.success ? (result.data || []) : [];
    const activeCount = propertiesInLocality(allProperties, locality).length;

    const homePath = locale === 'es' ? '/' : `/${locale}`;
    const propertiesPath = locale === 'es' ? '/propiedades' : `/${locale}/propiedades`;
    const localityPath = locale === 'es' ? `/${locality.slug}` : `/${locale}/${locality.slug}`;
    const url = `${SITE_URL}${localityPath}`;

    const breadcrumbLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
            { '@type': 'ListItem', 'position': 1, 'name': tNav('home'), 'item': `${SITE_URL}${homePath}` },
            { '@type': 'ListItem', 'position': 2, 'name': tNav('properties'), 'item': `${SITE_URL}${propertiesPath}` },
            { '@type': 'ListItem', 'position': 3, 'name': locality.displayName, 'item': url },
        ],
    };

    const faqLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': locality.faq.map((item) => ({
            '@type': 'Question',
            'name': item.question,
            'acceptedAnswer': { '@type': 'Answer', 'text': item.answer },
        })),
    };

    // Nota: el schema RealEstateAgent (agencia) se inyecta una vez a nivel
    // sitio desde <GlobalSchema /> en [locale]/layout.tsx — no se duplica
    // aquí (mismo criterio que /gandia-playa).

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: safeJsonLd(faqLd) }}
            />

            <header className="py-24 px-8 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                <div className="max-w-4xl mx-auto">
                    <span className="text-[10px] tracking-[0.4em] uppercase text-slate-400 mb-6 block">
                        {locality.kicker}
                    </span>
                    <h1 className="text-4xl md:text-6xl font-serif text-slate-900 dark:text-white mb-8">
                        Propiedades en {locality.displayName}
                    </h1>
                    <p className="text-xl text-slate-500 font-light leading-relaxed">
                        {locality.intro}
                    </p>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-8 py-20">
                <section className="mb-20">
                    <h2 className="text-3xl font-serif mb-6 text-slate-900 dark:text-white">
                        Disponibilidad actual
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 font-light leading-relaxed">
                        {activeCount > 0
                            ? `Ahora mismo gestionamos ${activeCount} ${activeCount === 1 ? 'propiedad activa' : 'propiedades activas'} en ${locality.displayName}.`
                            : `Ahora mismo no tenemos propiedades activas publicadas en ${locality.displayName} — contacta con nosotros y te avisamos en cuanto tengamos disponibilidad.`}
                    </p>
                </section>

                <section className="bg-slate-50 dark:bg-slate-900/30 p-12 rounded-sm border border-slate-100 dark:border-slate-800">
                    <h3 className="text-2xl font-serif mb-12 text-slate-900 dark:text-white">
                        Preguntas frecuentes sobre {locality.displayName}
                    </h3>
                    <div className="space-y-12">
                        {locality.faq.map((item, i) => (
                            <div key={i} className="space-y-4">
                                <h4 className="font-serif text-lg text-slate-900 dark:text-white">{item.question}</h4>
                                <p className="text-slate-500 dark:text-slate-400 font-light leading-relaxed">
                                    {item.answer}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="mt-20 text-center">
                    <Link
                        href={{ pathname: '/propiedades', query: { pop: locality.displayName } }}
                        className="inline-block py-4 px-10 bg-slate-900 dark:bg-white text-white dark:text-slate-900 uppercase text-[11px] tracking-[0.3em] font-bold hover:opacity-90 transition-all"
                    >
                        Ver catálogo en {locality.displayName}
                    </Link>
                </div>
            </main>
        </div>
    );
}

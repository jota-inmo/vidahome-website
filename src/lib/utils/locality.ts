/**
 * Config centralizada de localidades con landing propia (Fase 2 del plan
 * SEO/GEO, 2026-08-14). Alimenta la propia página (conteo en vivo vía
 * fetchPropertiesAction), sitemap.ts y — si en el futuro se decide — el
 * areaServed de GlobalSchema.tsx.
 *
 * GATE DE NEGOCIO: solo se añade una localidad aquí cuando tiene inventario
 * real defendible (verificado contra property_metadata, no una suposición).
 * Publicar una landing sin propiedades activas es thin/doorway content —
 * hace daño en vez de ayudar. Sin landing propia, la zona se queda
 * declarada en el areaServed de GlobalSchema.tsx (eso no promete catálogo
 * navegable, solo dice "servimos esta zona").
 *
 * Verificado en vivo 2026-08-14 (property_metadata, activas =
 * visible_web=true AND nodisponible=false):
 *   Oliva: 8 activas / 13 total → landing.
 *   Bellreguard: 4 activas / 5 total → landing (decisión JC: "sigo tu
 *     criterio" — más del doble que Daimús, inventario real y no cero).
 *   Daimús (2), Piles (0), Miramar (0) → sin landing todavía.
 *
 * PRINCIPIO DE CONTENIDO (decisión JC 2026-08-14): nada de narrativa
 * "líder en volumen" / cifras de venta como argumento de venta — "no me
 * gusta ese rollo de quien vende más, no encaja con mi mentalidad de ver
 * una inmobiliaria". El único dato numérico que se muestra aquí es el
 * conteo de propiedades EN VIVO (información neutral, no un ranking).
 * Ver memoria feedback_no_sales_volume_bragging_narrative.md.
 */
import type { Metadata } from 'next';
import { slugify } from './slug';
import type { PropertyListEntry } from '@/types/inmovilla';

const SITE_URL = 'https://www.vidahome.es';
const SUPPORTED_LOCALES = ['es', 'en', 'fr', 'de', 'it', 'pl'] as const;

export interface LocalityConfig {
    /** Route segment: /[locale]/{slug} */
    slug: string;
    /** Nombre a mostrar. */
    displayName: string;
    /** Kicker corto sobre el header (mismo patrón que gandia-playa). */
    kicker: string;
    /** Párrafo de presentación — sin cifras de venta ni framing de "líder". */
    intro: string;
    faq: Array<{ question: string; answer: string }>;
}

export const LOCALITIES: Record<string, LocalityConfig> = {
    oliva: {
        slug: 'oliva',
        displayName: 'Oliva',
        kicker: 'Propiedades en Oliva',
        intro:
            'Oliva combina casco histórico, zona de playa y entorno agrícola en un mismo municipio de la Safor. ' +
            'Aunque nuestra oficina está en el Grau de Gandia, gestionamos propiedades en toda la comarca, Oliva incluida, ' +
            'con el mismo trato personalizado y equipo multilingüe que en el resto de nuestro catálogo.',
        faq: [
            {
                question: '¿VidaHome gestiona propiedades en Oliva aunque su oficina esté en el Grau de Gandia?',
                answer:
                    'Sí. Trabajamos en toda la comarca de la Safor, incluida Oliva — mismo asesoramiento, ' +
                    'valoración y acompañamiento en el proceso que en cualquier otra zona de nuestro catálogo.',
            },
            {
                question: '¿Qué tipo de viviendas suele haber disponibles en Oliva?',
                answer:
                    'Varía entre zona de playa, casco urbano y entorno rural — pisos, chalets y casas de campo. ' +
                    'La disponibilidad concreta cambia con frecuencia; consulta el catálogo actualizado para ver qué hay ahora mismo.',
            },
            {
                question: '¿Cómo puedo saber el precio de una vivienda concreta en Oliva?',
                answer:
                    'El precio depende mucho de la zona (playa, casco, campo) y la tipología. Consulta el catálogo o ' +
                    'contáctanos directamente para una valoración personalizada — no publicamos precios genéricos porque no reflejarían la realidad de cada caso.',
            },
        ],
    },
    bellreguard: {
        slug: 'bellreguard',
        displayName: 'Bellreguard',
        kicker: 'Propiedades en Bellreguard',
        intro:
            'Bellreguard es un municipio pequeño de la Safor, junto a Gandia. Nuestra disponibilidad aquí es más reducida ' +
            'que en otras zonas — te mostramos honestamente lo que hay ahora mismo, y si no encuentras lo que buscas, ' +
            'podemos avisarte cuando entre algo nuevo.',
        faq: [
            {
                question: '¿VidaHome tiene propiedades en Bellreguard?',
                answer:
                    'Sí, aunque nuestro inventario en Bellreguard es más reducido que en municipios más grandes. ' +
                    'Consulta el catálogo actualizado para ver la disponibilidad real ahora mismo.',
            },
            {
                question: '¿Puedo pedir que me avisen si aparece una propiedad nueva en Bellreguard?',
                answer:
                    'Sí, contacta con nosotros indicando lo que buscas (tipo de vivienda, presupuesto) y te avisamos ' +
                    'cuando tengamos algo que encaje.',
            },
        ],
    },
};

/** Propiedades de esta localidad — normaliza `poblacion` con slugify() para
 * absorber variantes tipográficas (mayúsculas, espacios, tildes). */
export function propertiesInLocality(
    properties: PropertyListEntry[],
    locality: LocalityConfig,
): PropertyListEntry[] {
    return properties.filter((p) => slugify(p.poblacion) === locality.slug);
}

/** Metadata (title/description/canonical/hreflang) para el layout.tsx de
 * cada landing de localidad — mismo patrón que nosotros/layout.tsx, pero
 * con el copy en español para las 6 variantes de locale (igual que hace
 * hoy /gandia-playa con su contenido; traducir el copy completo a los 6
 * idiomas es una decisión de contenido aparte, no de esta fase). */
export function buildLocalityMetadata(slug: string, locale: string): Metadata {
    const locality = LOCALITIES[slug];
    const title = `Propiedades en ${locality.displayName} | VidaHome Inmobiliaria`;
    const description = locality.intro;
    const path = locale === 'es' ? `/${slug}` : `/${locale}/${slug}`;

    const languages: Record<string, string> = {};
    for (const l of SUPPORTED_LOCALES) {
        languages[l] = `${SITE_URL}${l === 'es' ? `/${slug}` : `/${l}/${slug}`}`;
    }
    languages['x-default'] = `${SITE_URL}/${slug}`;

    return {
        title,
        description,
        alternates: {
            canonical: `${SITE_URL}${path}`,
            languages,
        },
        openGraph: {
            title,
            description,
            url: `${SITE_URL}${path}`,
            siteName: 'Vidahome',
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
        },
    };
}

import { MetadataRoute } from 'next';
import { fetchPropertiesAction } from '@/app/actions';
import { getBlogSitemapEntriesAction } from '@/app/actions/blog';
import { routing } from '@/i18n/routing';
import { buildPropertySlug } from '@/lib/utils/slug';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://www.vidahome.es';
    const locales = routing.locales;

    // Páginas estáticas base
    const staticPaths = [
        '',
        '/gandia-playa',
        '/propiedades',
        '/vender',
        '/contacto',
        '/nosotros',
        '/blog',
        // Landings de localidad (Fase 2 plan SEO/GEO 2026-08-14) — solo las
        // que superan el gate de inventario real en src/lib/utils/locality.ts.
        '/oliva',
        '/bellreguard',
    ];

    const sitemapEntries: MetadataRoute.Sitemap = [];

    // 1. Generar entradas para páginas estáticas en todos los idiomas
    for (const path of staticPaths) {
        for (const locale of locales) {
            sitemapEntries.push({
                url: `${baseUrl}/${locale}${path}`,
                // Sin lastModified: no hay fecha real de cambio de las páginas estáticas
                // y `new Date()` en cada petición le dice a Google que todo cambió siempre.
                changeFrequency: path === '' ? 'daily' : 'monthly',
                priority: path === '' ? 1.0 : 0.8,
                alternates: {
                    languages: Object.fromEntries(
                        locales.map((l) => [l, `${baseUrl}/${l}${path}`])
                    ),
                },
            });
        }
    }

    // 2. Generar entradas para cada propiedad en todos los idiomas
    try {
        const result = await fetchPropertiesAction();
        if (result.success && result.data) {
            for (const prop of result.data) {
                // Descriptive langue-neutre slug — MUST be byte-identical to the
                // canonical computed in propiedades/[id]/page.tsx for this same
                // property (both call buildPropertySlug), or 308-loop / wasted crawl.
                const slug = buildPropertySlug(prop);
                const path = `/propiedades/${slug}`;
                for (const locale of locales) {
                    sitemapEntries.push({
                        url: `${baseUrl}/${locale}${path}`,
                        ...(prop.updated_at ? { lastModified: new Date(prop.updated_at) } : {}),
                        changeFrequency: 'weekly',
                        priority: 0.6,
                        alternates: {
                            languages: Object.fromEntries(
                                locales.map((l) => [l, `${baseUrl}/${l}${path}`])
                            ),
                        },
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error generating sitemap properties:', error);
    }

    // 3. Artículos del blog publicados. Una entrada por idioma y sin `alternates`:
    // las versiones de un mismo artículo en otros idiomas no están enlazadas en la
    // base de datos, y sus slugs son distintos, así que no hay hreflang que declarar.
    try {
        const blog = await getBlogSitemapEntriesAction();
        if (blog.success && blog.data) {
            for (const post of blog.data) {
                const lastModified = post.updated_at ?? post.published_at;
                sitemapEntries.push({
                    url: `${baseUrl}/${post.locale}/blog/${post.slug}`,
                    ...(lastModified ? { lastModified: new Date(lastModified) } : {}),
                    changeFrequency: 'monthly',
                    priority: 0.6,
                });
            }
        }
    } catch (error) {
        console.error('Error generating sitemap blog posts:', error);
    }

    return sitemapEntries;
}

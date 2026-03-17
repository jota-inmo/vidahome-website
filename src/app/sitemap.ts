import { MetadataRoute } from 'next';
import { fetchPropertiesAction } from '@/app/actions';
import { routing } from '@/i18n/routing';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://vidahome.es';
    const locales = routing.locales;

    // Páginas estáticas base
    const staticPaths = [
        '',
        '/gandia-playa',
        '/propiedades',
        '/vender',
        '/contacto',
        '/nosotros',
    ];

    const sitemapEntries: MetadataRoute.Sitemap = [];

    // 1. Generar entradas para páginas estáticas en todos los idiomas
    for (const path of staticPaths) {
        for (const locale of locales) {
            sitemapEntries.push({
                url: `${baseUrl}/${locale}${path}`,
                lastModified: new Date(),
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
                const path = `/propiedades/${prop.cod_ofer}`;
                for (const locale of locales) {
                    sitemapEntries.push({
                        url: `${baseUrl}/${locale}${path}`,
                        lastModified: new Date(),
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

    return sitemapEntries;
}

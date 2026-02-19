import { MetadataRoute } from 'next';
import { fetchPropertiesAction } from '@/app/actions';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://vidahome.es';

    // Páginas estáticas
    const staticPages = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 1,
        },
        {
            url: `${baseUrl}/gandia-playa`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.9,
        },
        {
            url: `${baseUrl}/propiedades`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.8,
        },
        {
            url: `${baseUrl}/vender`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.8,
        },
        {
            url: `${baseUrl}/contacto`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.7,
        },
    ];

    // Intentar obtener propiedades para el sitemap
    try {
        const result = await fetchPropertiesAction();
        if (result.success && result.data) {
            const propertyPages = result.data.map((prop) => ({
                url: `${baseUrl}/propiedades/${prop.cod_ofer}`,
                lastModified: new Date(),
                changeFrequency: 'weekly' as const,
                priority: 0.6,
            }));
            return [...staticPages, ...propertyPages];
        }
    } catch (error) {
        console.error('Error generating sitemap properties:', error);
    }

    return staticPages;
}

import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                // `/*/admin/` cubre /es/admin, /fr/admin… (el prefijo de locale es obligatorio)
                disallow: ['/admin/', '/*/admin/', '/admin-hero/', '/*/admin-hero/', '/api/'],
            },
            {
                userAgent: ['GPTBot', 'Google-Extended', 'OAI-SearchBot', 'anthropic-ai'],
                allow: '/',
            }
        ],
        sitemap: 'https://www.vidahome.es/sitemap.xml',
    };
}


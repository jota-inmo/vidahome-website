import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/admin/', '/admin-hero/', '/api/'],
            },
            {
                userAgent: ['GPTBot', 'Google-Extended', 'OAI-SearchBot', 'anthropic-ai'],
                allow: '/',
            }
        ],
        sitemap: 'https://vidahome.es/sitemap.xml',
    };
}


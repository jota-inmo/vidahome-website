import type { BlogPost } from '@/types/blog';
import type { FaqItem } from './markdown-utils';

/** Mismo `@id` que la agencia en `GlobalSchema`, que se pinta en todas las páginas. */
export const AGENCY_ID = 'https://www.vidahome.es/#agencia';
const AGENCY_NAME = 'VidaHome Inmobiliaria';

const AGENCY_AUTHORS = new Set(['vidahome', 'vida home', 'vidahome inmobiliaria']);

function buildAuthor(author?: string) {
    const name = author?.trim();
    if (!name || AGENCY_AUTHORS.has(name.toLowerCase())) {
        return { '@type': 'Organization', '@id': AGENCY_ID, name: AGENCY_NAME };
    }
    return { '@type': 'Person', name };
}

interface BlogPostingInput {
    post: BlogPost;
    locale: string;
    /** URL canónica absoluta del artículo. */
    url: string;
    description: string;
    /** URL absoluta de la imagen (ya optimizada para compartir). */
    imageUrl?: string;
}

export function buildBlogPostingJsonLd({ post, locale, url, description, imageUrl }: BlogPostingInput) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description,
        inLanguage: locale,
        url,
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        image: imageUrl ? [imageUrl] : undefined,
        datePublished: post.published_at ?? post.created_at,
        dateModified: post.updated_at ?? post.published_at ?? post.created_at,
        keywords: post.meta_keywords || undefined,
        author: buildAuthor(post.author),
        publisher: { '@type': 'Organization', '@id': AGENCY_ID, name: AGENCY_NAME },
    };
}

/** `FAQPage` solo si hay al menos dos preguntas con respuesta. */
export function buildFaqJsonLd(items: FaqItem[]) {
    if (items.length < 2) return null;
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: items.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
    };
}

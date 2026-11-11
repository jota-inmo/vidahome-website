import { describe, it, expect } from 'vitest';
import type { BlogPost } from '@/types/blog';
import { AGENCY_ID, buildBlogPostingJsonLd, buildFaqJsonLd } from './jsonld';

const post: BlogPost = {
    id: '1',
    title: '¿Qué impuestos paga un no residente?',
    slug: 'impuestos-no-residente',
    content: 'x',
    excerpt: 'e',
    locale: 'es',
    author: 'Vidahome',
    featured_image_url: 'https://x.test/a.jpg',
    featured_image_alt: 'Playa de Gandía',
    meta_description: 'd',
    meta_keywords: 'impuestos, no residente',
    is_published: true,
    created_at: '2026-12-01T10:00:00Z',
    updated_at: '2026-12-05T10:00:00Z',
    published_at: '2026-12-02T10:00:00Z',
};

const input = {
    post,
    locale: 'es',
    url: 'https://www.vidahome.es/es/blog/impuestos-no-residente',
    description: 'desc',
    imageUrl: 'https://www.vidahome.es/_next/image?w=1200',
};

describe('buildBlogPostingJsonLd', () => {
    it('usa la agencia como autor y editor cuando firma "Vidahome"', () => {
        const ld = buildBlogPostingJsonLd(input);
        expect(ld['@type']).toBe('BlogPosting');
        expect(ld.author).toMatchObject({ '@type': 'Organization', '@id': AGENCY_ID });
        expect(ld.publisher['@id']).toBe(AGENCY_ID);
    });

    it('usa Person cuando firma una persona', () => {
        const ld = buildBlogPostingJsonLd({ ...input, post: { ...post, author: 'Fred Diago' } });
        expect(ld.author).toEqual({ '@type': 'Person', name: 'Fred Diago' });
    });

    it('lleva fechas, idioma e imagen', () => {
        const ld = buildBlogPostingJsonLd(input);
        expect(ld.datePublished).toBe('2026-12-02T10:00:00Z');
        expect(ld.dateModified).toBe('2026-12-05T10:00:00Z');
        expect(ld.inLanguage).toBe('es');
        expect(ld.image).toEqual([input.imageUrl]);
    });

    it('omite la imagen si no hay portada', () => {
        const ld = buildBlogPostingJsonLd({ ...input, imageUrl: undefined });
        expect(ld.image).toBeUndefined();
    });
});

describe('buildFaqJsonLd', () => {
    it('devuelve null con menos de dos preguntas', () => {
        expect(buildFaqJsonLd([])).toBeNull();
        expect(buildFaqJsonLd([{ question: 'q', answer: 'a' }])).toBeNull();
    });

    it('construye FAQPage con las preguntas', () => {
        const ld = buildFaqJsonLd([
            { question: 'q1', answer: 'a1' },
            { question: 'q2', answer: 'a2' },
        ]);
        expect(ld?.['@type']).toBe('FAQPage');
        expect(ld?.mainEntity).toHaveLength(2);
        expect(ld?.mainEntity[0]).toEqual({
            '@type': 'Question',
            name: 'q1',
            acceptedAnswer: { '@type': 'Answer', text: 'a1' },
        });
    });
});

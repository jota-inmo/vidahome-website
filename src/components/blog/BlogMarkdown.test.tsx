import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

// `Link` de next-intl necesita contexto de petición: aquí solo interesa qué href recibe.
vi.mock('@/i18n/routing', () => ({
    Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
        <a data-intl-link href={`/es${href}`} {...rest}>
            {children}
        </a>
    ),
}));

import { BlogMarkdown } from './BlogMarkdown';

function renderMd(md: string) {
    return render(<BlogMarkdown content={md} />).container;
}

describe('BlogMarkdown', () => {
    it('pinta títulos, negrita y listas con formato (no como texto plano)', () => {
        const c = renderMd('## Título\n\nTexto con **negrita**.\n\n- uno\n- dos');
        expect(c.querySelector('h2')?.textContent).toBe('Título');
        expect(c.querySelector('strong')?.textContent).toBe('negrita');
        expect(c.querySelectorAll('li')).toHaveLength(2);
        expect(c.textContent).not.toContain('##');
        expect(c.textContent).not.toContain('**');
    });

    it('baja un # del texto a h2 para que la página tenga un solo h1', () => {
        const c = renderMd('# Gran título');
        expect(c.querySelector('h1')).toBeNull();
        expect(c.querySelector('h2')?.textContent).toBe('Gran título');
    });

    it('pinta imágenes con alt, carga diferida y pie de foto', () => {
        const c = renderMd('![Paseo marítimo del Grau](https://x.test/grau.jpg "Atardecer en el Grau")');
        const img = c.querySelector('img');
        expect(img?.getAttribute('src')).toBe('https://x.test/grau.jpg');
        expect(img?.getAttribute('alt')).toBe('Paseo marítimo del Grau');
        expect(img?.getAttribute('loading')).toBe('lazy');
        expect(c.textContent).toContain('Atardecer en el Grau');
    });

    it('enlaces internos pasan por Link y no duplican el idioma', () => {
        const c = renderMd('[propiedades](/propiedades) y [contacto](/es/contacto)');
        const links = Array.from(c.querySelectorAll('a[data-intl-link]')).map((a) => a.getAttribute('href'));
        expect(links).toEqual(['/es/propiedades', '/es/contacto']);
    });

    it('enlaces externos abren en pestaña nueva con rel seguro', () => {
        const a = renderMd('[AEAT](https://sede.agenciatributaria.gob.es)').querySelector('a');
        expect(a?.getAttribute('target')).toBe('_blank');
        expect(a?.getAttribute('rel')).toBe('noopener noreferrer');
    });

    it('no ejecuta HTML crudo ni enlaces javascript:', () => {
        const c = renderMd('<script>alert(1)</script>\n\n[clic](javascript:alert(1))');
        expect(c.querySelector('script')).toBeNull();
        const href = c.querySelector('a')?.getAttribute('href') ?? '';
        expect(href).not.toMatch(/^javascript:/i);
    });

    it('pinta tablas de GitHub (gfm)', () => {
        const c = renderMd('| A | B |\n| --- | --- |\n| 1 | 2 |');
        expect(c.querySelector('table')).not.toBeNull();
        expect(c.querySelectorAll('td')).toHaveLength(2);
    });
});

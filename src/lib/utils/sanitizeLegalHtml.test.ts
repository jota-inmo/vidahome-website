import { describe, it, expect } from 'vitest';
import { sanitizeLegalHtml } from './sanitizeLegalHtml';

describe('sanitizeLegalHtml — auditoría 2026-09-05 (B-10)', () => {
    it('elimina <script> y manejadores de evento inline', () => {
        const dirty = '<p>Texto legal</p><script>alert(1)</script><img src=x onerror=alert(2)>';
        const clean = sanitizeLegalHtml(dirty);
        expect(clean).not.toContain('<script');
        expect(clean).not.toContain('onerror');
        expect(clean).toContain('Texto legal');
    });

    it('mantiene el formato habitual de un texto legal (párrafos, listas, enlaces, tablas)', () => {
        const dirty = `
            <h2>1. Datos</h2>
            <p>Ver el <a href="https://www.aepd.es" target="_blank" rel="noopener">AEPD</a>.</p>
            <ul><li>Uno</li><li>Dos</li></ul>
            <table><tr><td>Celda</td></tr></table>
        `;
        const clean = sanitizeLegalHtml(dirty);
        expect(clean).toContain('<h2>1. Datos</h2>');
        expect(clean).toContain('href="https://www.aepd.es"');
        expect(clean).toContain('<li>Uno</li>');
        expect(clean).toContain('<table>');
    });

    it('quita iframes/objects embebidos', () => {
        const dirty = '<p>x</p><iframe src="https://evil.tld"></iframe><object data="evil.swf"></object>';
        const clean = sanitizeLegalHtml(dirty);
        expect(clean).not.toContain('<iframe');
        expect(clean).not.toContain('<object');
    });

    it('neutraliza un href javascript:', () => {
        const dirty = '<a href="javascript:alert(1)">click</a>';
        const clean = sanitizeLegalHtml(dirty);
        expect(clean).not.toContain('javascript:');
    });
});

import { describe, it, expect } from 'vitest';
import { isAdminPath, isAdminLoginPath, isSessionPayloadFresh, SESSION_MAX_AGE_MS } from './adminPath';

const LOCALES = ['es', 'en', 'fr', 'de', 'it', 'pl'];

describe('isAdminPath', () => {
    it.each(LOCALES)('protege /%s/admin y subrutas', (l) => {
        expect(isAdminPath(`/${l}/admin`)).toBe(true);
        expect(isAdminPath(`/${l}/admin/login`)).toBe(true);
        expect(isAdminPath(`/${l}/admin/blog`)).toBe(true);
    });
    it('protege /admin sin locale', () => {
        expect(isAdminPath('/admin')).toBe(true);
        expect(isAdminPath('/admin/blog')).toBe(true);
    });
    it('no marca rutas públicas', () => {
        for (const p of ['/', '/es', '/fr/propiedades', '/espanol', '/es/administracion', '/administrador']) {
            expect(isAdminPath(p)).toBe(false);
        }
    });
});

describe('isAdminLoginPath', () => {
    it.each(LOCALES)('reconoce /%s/admin/login', (l) => {
        expect(isAdminLoginPath(`/${l}/admin/login`)).toBe(true);
        expect(isAdminLoginPath(`/${l}/admin`)).toBe(false);
    });
});

describe('isSessionPayloadFresh', () => {
    const now = 1_000_000_000_000;
    it('acepta un token reciente', () => {
        expect(isSessionPayloadFresh(`admin:${now - 1000}`, now)).toBe(true);
    });
    it('rechaza uno de hace 25 h', () => {
        expect(isSessionPayloadFresh(`admin:${now - SESSION_MAX_AGE_MS - 1}`, now)).toBe(false);
    });
    it('rechaza payload malformado o con fecha futura', () => {
        expect(isSessionPayloadFresh('active', now)).toBe(false);
        expect(isSessionPayloadFresh(`admin:${now + 10 * 60_000}`, now)).toBe(false);
    });
});

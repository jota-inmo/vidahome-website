import { describe, it, expect } from 'vitest';
import { publicPhotoUrl, publicPhotoUrls } from './publishedPhoto';

const SB = 'https://x.supabase.co';
const u = (p: string) => `${SB}/storage/v1/object/public/property-photos/${p}`;

describe('publicPhotoUrl (regla espejo del CRM)', () => {
    it('foto de IA → su copia con rótulo, también con marca de agua activada', () => {
        const row = { url_storage: 'a/1.jpg', url_storage_wm: 'a/wm/1.jpg', url_storage_ia: 'a/ia/1.jpg', generada_ia: true };
        expect(publicPhotoUrl(row, true, SB)).toBe(u('a/ia/1.jpg'));
        expect(publicPhotoUrl(row, false, SB)).toBe(u('a/ia/1.jpg'));
    });

    it('foto de IA sin copia con rótulo → no se enseña', () => {
        expect(publicPhotoUrl({ url_storage: 'a/1.jpg', generada_ia: true }, false, SB)).toBeNull();
        expect(publicPhotoUrl({ url_storage: null, url_cloudinary: 'https://cdn/1.jpg', generada_ia: true }, false, SB)).toBeNull();
    });

    it('marca de agua: la variante si la ficha la tiene y existe; si no, el original', () => {
        expect(publicPhotoUrl({ url_storage: 'a/1.jpg', url_storage_wm: 'a/wm/1.jpg' }, true, SB)).toBe(u('a/wm/1.jpg'));
        expect(publicPhotoUrl({ url_storage: 'a/1.jpg', url_storage_wm: 'a/wm/1.jpg' }, false, SB)).toBe(u('a/1.jpg'));
        expect(publicPhotoUrl({ url_storage: 'a/1.jpg' }, true, SB)).toBe(u('a/1.jpg'));
    });

    it('legacy sin Storage → url_cloudinary', () => {
        expect(publicPhotoUrl({ url_storage: null, url_cloudinary: 'https://cdn/1.jpg' }, false, SB)).toBe('https://cdn/1.jpg');
    });

    it('la lista conserva el orden y quita las de IA sin rótulo', () => {
        const out = publicPhotoUrls([
            { url_storage: 'a/1.jpg' },
            { url_storage: 'a/2.jpg', generada_ia: true },
            { url_storage: 'a/3.jpg', url_storage_ia: 'a/ia/3.jpg', generada_ia: true },
        ], false, SB);
        expect(out).toEqual([u('a/1.jpg'), u('a/ia/3.jpg')]);
    });
});

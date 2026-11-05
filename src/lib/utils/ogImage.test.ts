import { describe, it, expect } from 'vitest';
import { toOgImageUrl } from './ogImage';

describe('toOgImageUrl', () => {
    it('envuelve la URL original en el optimizador de Next con w/q', () => {
        const url = toOgImageUrl('https://www.vidahome.es', 'https://x.supabase.co/a.jpg');
        expect(url).toBe('https://www.vidahome.es/_next/image?url=https%3A%2F%2Fx.supabase.co%2Fa.jpg&w=1200&q=75');
    });

    it('acepta width/quality personalizados', () => {
        const url = toOgImageUrl('https://www.vidahome.es', 'https://x.supabase.co/a.jpg', 640, 60);
        expect(url).toContain('w=640');
        expect(url).toContain('q=60');
    });

    it('cadena vacía → cadena vacía (sin URL que envolver)', () => {
        expect(toOgImageUrl('https://www.vidahome.es', '')).toBe('');
    });
});

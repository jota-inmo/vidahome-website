import { describe, it, expect } from 'vitest';
import { cleanDescription } from './text-cleaner';

describe('cleanDescription', () => {
    it('should remove ~~ symbols and replace with newlines', () => {
        const input = 'Vistas al mar~~Terraza amplia~~Reformado';
        const result = cleanDescription(input);
        expect(result).not.toContain('~~');
        expect(result).toContain('\n');
    });

    it('should remove bold markdown markers **', () => {
        const input = 'Propiedad **muy luminosa** en el centro';
        const result = cleanDescription(input);
        expect(result).toBe('Propiedad muy luminosa en el centro');
    });

    it('should remove portal-specific artifacts like [portal]', () => {
        const input = 'Anuncio publicado por [portal] inmobiliario';
        const result = cleanDescription(input);
        expect(result).toBe('Anuncio publicado por inmobiliario');
    });

    it('should filter out rocket, house, and fire emojis', () => {
        const input = '¡OFERTA! 🚀 Casa única 🔥 en Gandía 🏘️';
        const result = cleanDescription(input);
        expect(result).not.toContain('🚀');
        expect(result).not.toContain('🔥');
        expect(result).not.toContain('🏘️');
        expect(result).toContain('¡OFERTA! Casa única en Gandía');
    });

    it('should handle multiple spaces and clean up the result', () => {
        const input = 'Texto   con    muchos     espacios';
        const result = cleanDescription(input);
        expect(result).toBe('Texto con muchos espacios');
    });

    it('should return empty string if input is null or undefined', () => {
        // @ts-ignore
        expect(cleanDescription(null)).toBe('');
        // @ts-ignore
        expect(cleanDescription(undefined)).toBe('');
    });
});

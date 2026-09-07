import { describe, it, expect } from 'vitest';
import { safeJsonLd } from './jsonLd';

describe('safeJsonLd — auditoría 2026-09-05 (A-6)', () => {
    it('escapa "<" y ">" que JSON.stringify deja pasar tal cual', () => {
        // Arrange
        const malicious = { name: 'Gandia</script><img src=x onerror=alert(1)>' };
        // Act
        const raw = JSON.stringify(malicious);
        const safe = safeJsonLd(malicious);
        // Assert
        expect(raw).toContain('</script>'); // JSON.stringify NO protege por sí solo
        expect(safe).not.toContain('</script>');
        expect(safe).not.toContain('<img');
        expect(safe).toContain('\\u003c/script\\u003e');
    });

    it('el JSON escapado sigue siendo válido y decodifica al valor original', () => {
        const data = { a: 1, b: '<b>x</b> & "y"' };
        const safe = safeJsonLd(data);
        // Un navegador ejecuta esto como texto de <script type="application/ld+json">,
        // que NO decodifica entidades HTML — debe seguir siendo JSON.parse-able tal cual.
        expect(JSON.parse(safe)).toEqual(data);
    });

    it('deja intacto JSON sin metacaracteres', () => {
        const data = { ref: '2993', tipo: 'Piso' };
        expect(safeJsonLd(data)).toBe(JSON.stringify(data));
    });
});

import { describe, it, expect } from 'vitest';
import { encargoToFullDataShape } from './encargo-shape';

describe('encargoToFullDataShape', () => {
    it('returns empty object when no encargo nor overrides', () => {
        expect(encargoToFullDataShape(null, null)).toEqual({});
    });

    // Bug 2 regression: el productor emitía `ano_cons`, ningún consumidor
    // lo leía. PropertyDetailClient / page.tsx leen `antiguedad`.
    it('emits `antiguedad` (not `ano_cons`) for the construction year', () => {
        const shape = encargoToFullDataShape({ edi_ano_construccion: '1987' });
        expect(shape.antiguedad).toBe(1987);
        expect('ano_cons' in shape).toBe(false);
    });

    it('omits `antiguedad` when edi_ano_construccion is empty', () => {
        const shape = encargoToFullDataShape({ edi_ano_construccion: '' });
        expect('antiguedad' in shape).toBe(false);
    });

    it('maps baños/aseos from num_banos/num_aseos', () => {
        const shape = encargoToFullDataShape({ num_banos: '1', num_aseos: '2' });
        expect(shape.banyos).toBe(1);
        expect(shape.aseos).toBe(2);
    });

    it('overrides win over encargo (pub_overrides priority)', () => {
        const shape = encargoToFullDataShape(
            { edi_ano_construccion: '1980' },
            { edi_ano_construccion: '2005' },
        );
        expect(shape.antiguedad).toBe(2005);
    });

    it('derives keyacci from contractType', () => {
        expect(encargoToFullDataShape({ contractType: 'venta-sin-exclusiva' }).keyacci).toBe(1);
        expect(encargoToFullDataShape({ contractType: 'alquiler' }).keyacci).toBe(2);
    });
});

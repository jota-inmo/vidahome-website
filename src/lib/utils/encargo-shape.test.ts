import { describe, it, expect } from 'vitest';
import { encargoToFullDataShape, presentFlag } from './encargo-shape';

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

    // Bug 3026/2998 (2026-08-03): parseSiNo('Aparcamiento incluido') → undefined
    // → el icono de garaje no salía para refs CRM-only.
    it("garaje: variantes legacy ('Aparcamiento incluido'/'Incluido'/'Opcional') → true", () => {
        expect(encargoToFullDataShape({ res_gar: 'Aparcamiento incluido' }).garaje).toBe(true);
        expect(encargoToFullDataShape({ res_gar: 'Incluido' }).garaje).toBe(true);
        expect(encargoToFullDataShape({ res_gar: 'Opcional' }).garaje).toBe(true);
    });

    it("garaje: '—' (sin especificar) → omitido para que gane full_data; 'No' → false explícito", () => {
        expect('garaje' in encargoToFullDataShape({ res_gar: '—' })).toBe(false);
        expect(encargoToFullDataShape({ res_gar: 'No' }).garaje).toBe(false);
    });

    it('garaje: res_gar_numero poblado también señala garaje', () => {
        expect(encargoToFullDataShape({ res_gar: '—', res_gar_numero: 'Plaza 15' }).garaje).toBe(true);
    });

    it('terraza: res_t1/t2/t3 son m² — "70" cuenta como terraza (parseSiNo lo perdía)', () => {
        expect(encargoToFullDataShape({ res_t1: '70', res_t2: '40' }).terraza).toBe(true);
        expect('terraza' in encargoToFullDataShape({ res_t1: '', res_t2: '' })).toBe(false);
    });

    it('trastero/ascensor con el mismo criterio de presencia', () => {
        expect(encargoToFullDataShape({ res_tras: 'Sí' }).trastero).toBe(true);
        expect(encargoToFullDataShape({ res_asc: 'Sí' }).ascensor).toBe(true);
        expect('ascensor' in encargoToFullDataShape({ res_asc: '—' })).toBe(false);
    });
});

describe('presentFlag', () => {
    it('tri-estado: sin señal → undefined, no explícito → false, resto → true', () => {
        expect(presentFlag('—')).toBeUndefined();
        expect(presentFlag('')).toBeUndefined();
        expect(presentFlag(null)).toBeUndefined();
        expect(presentFlag('No')).toBe(false);
        expect(presentFlag('0')).toBe(false);
        expect(presentFlag('Sí')).toBe(true);
        expect(presentFlag('Aparcamiento incluido')).toBe(true);
        expect(presentFlag(true)).toBe(true);
        expect(presentFlag(2)).toBe(true);
        expect(presentFlag(0)).toBe(false);
    });
});

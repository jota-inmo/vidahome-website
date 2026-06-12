import { describe, it, expect } from 'vitest';
import {
    esTraspaso,
    esVenta,
    esAlquiler,
    matchesType,
    type ClassifiableProperty,
} from './property-rules';

describe('esTraspaso', () => {
    it('is true when the ref starts with T (any case)', () => {
        expect(esTraspaso('T2630')).toBe(true);
        expect(esTraspaso('t2785')).toBe(true);
    });

    it('is false for venta/alquiler refs and empty/nullish', () => {
        expect(esTraspaso('2976')).toBe(false);
        expect(esTraspaso('A2958')).toBe(false);
        expect(esTraspaso('')).toBe(false);
        expect(esTraspaso(null)).toBe(false);
        expect(esTraspaso(undefined)).toBe(false);
    });
});

describe('esVenta', () => {
    it('is true for keyacci 1', () => {
        expect(esVenta({ ref: '2976', keyacci: 1 })).toBe(true);
    });

    it('treats a missing keyacci as venta', () => {
        expect(esVenta({ ref: '2976' })).toBe(true);
        expect(esVenta({ ref: '2976', keyacci: null })).toBe(true);
        expect(esVenta({ ref: '2976', keyacci: undefined })).toBe(true);
    });

    it('is false for explicit rentals (keyacci 2)', () => {
        expect(esVenta({ ref: 'A2958', keyacci: 2 })).toBe(false);
    });

    it('is false for traspasos even without keyacci', () => {
        expect(esVenta({ ref: 'T2630' })).toBe(false);
        expect(esVenta({ ref: 'T2630', keyacci: 1 })).toBe(false);
    });
});

describe('esAlquiler', () => {
    it('requires an explicit keyacci === 2', () => {
        expect(esAlquiler({ ref: 'A2958', keyacci: 2 })).toBe(true);
    });

    it('is false when keyacci is missing (no longer venta-by-fallback)', () => {
        expect(esAlquiler({ ref: 'A2958' })).toBe(false);
        expect(esAlquiler({ ref: 'A2958', keyacci: null })).toBe(false);
        expect(esAlquiler({ ref: '2976', keyacci: 1 })).toBe(false);
    });

    it('is false for traspasos even with keyacci 2', () => {
        expect(esAlquiler({ ref: 'T2630', keyacci: 2 })).toBe(false);
    });
});

describe('matchesType', () => {
    const venta: ClassifiableProperty = { ref: '2976', keyacci: 1 };
    const ventaNoKey: ClassifiableProperty = { ref: '2977' };
    const alquiler: ClassifiableProperty = { ref: 'A2958', keyacci: 2 };
    const traspaso: ClassifiableProperty = { ref: 'T2630', keyacci: 1 };

    it('buy matches venta (incl. missing keyacci) but not rent/transfer', () => {
        expect(matchesType(venta, 'buy')).toBe(true);
        expect(matchesType(ventaNoKey, 'buy')).toBe(true);
        expect(matchesType(alquiler, 'buy')).toBe(false);
        expect(matchesType(traspaso, 'buy')).toBe(false);
    });

    it('rent matches only explicit rentals', () => {
        expect(matchesType(alquiler, 'rent')).toBe(true);
        expect(matchesType(venta, 'rent')).toBe(false);
        expect(matchesType(ventaNoKey, 'rent')).toBe(false);
        expect(matchesType(traspaso, 'rent')).toBe(false);
    });

    it('transfer matches only traspasos', () => {
        expect(matchesType(traspaso, 'transfer')).toBe(true);
        expect(matchesType(venta, 'transfer')).toBe(false);
        expect(matchesType(alquiler, 'transfer')).toBe(false);
    });

    it('a property with no keyacci never appears under rent', () => {
        expect(matchesType(ventaNoKey, 'rent')).toBe(false);
        expect(matchesType(ventaNoKey, 'buy')).toBe(true);
    });
});

import { describe, it, expect } from 'vitest';
import { applyJitter, getPublicCoords, jitterRadiusForType, coerceCoord } from './coords';

const EXACT_LAT = 38.965123;
const EXACT_LNG = -0.181098;

describe('jitterRadiusForType', () => {
    it('returns 200m for piso/apartamento/atico', () => {
        expect(jitterRadiusForType('piso')).toBe(200);
        expect(jitterRadiusForType('Apartamento')).toBe(200);
        expect(jitterRadiusForType('ático')).toBe(200);
    });

    it('returns 500m for casa/chalet/villa/parcela', () => {
        expect(jitterRadiusForType('casa')).toBe(500);
        expect(jitterRadiusForType('Chalet')).toBe(500);
        expect(jitterRadiusForType('Villa')).toBe(500);
        expect(jitterRadiusForType('parcela')).toBe(500);
    });

    it('falls back to 200m default for unknown types', () => {
        expect(jitterRadiusForType('local')).toBe(200);
        expect(jitterRadiusForType('garaje')).toBe(200);
        expect(jitterRadiusForType(null)).toBe(200);
        expect(jitterRadiusForType(undefined)).toBe(200);
    });
});

describe('applyJitter', () => {
    it('is deterministic: same seed → same offset', () => {
        const a = applyJitter(EXACT_LAT, EXACT_LNG, 'ref-2410');
        const b = applyJitter(EXACT_LAT, EXACT_LNG, 'ref-2410');
        expect(a.lat).toBe(b.lat);
        expect(a.lng).toBe(b.lng);
    });

    it('different seeds → different offsets', () => {
        const a = applyJitter(EXACT_LAT, EXACT_LNG, 'ref-2410');
        const b = applyJitter(EXACT_LAT, EXACT_LNG, 'ref-2899');
        expect(a.lat).not.toBe(b.lat);
        expect(a.lng).not.toBe(b.lng);
    });

    it('stays within radius (200m default)', () => {
        const j = applyJitter(EXACT_LAT, EXACT_LNG, 'seed');
        // 200m ≈ 0.0018° at this latitude. Pad a touch for rounding.
        expect(Math.abs(j.lat - EXACT_LAT)).toBeLessThan(0.003);
        expect(Math.abs(j.lng - EXACT_LNG)).toBeLessThan(0.003);
    });

    it('500m radius produces larger offset than 200m', () => {
        const small = applyJitter(EXACT_LAT, EXACT_LNG, 'seed', 200);
        const large = applyJitter(EXACT_LAT, EXACT_LNG, 'seed', 500);
        const dSmall = Math.hypot(small.lat - EXACT_LAT, small.lng - EXACT_LNG);
        const dLarge = Math.hypot(large.lat - EXACT_LAT, large.lng - EXACT_LNG);
        expect(dLarge).toBeGreaterThan(dSmall);
    });

    it('throws on invalid input', () => {
        expect(() => applyJitter(NaN, 0, 'seed')).toThrow();
        expect(() => applyJitter(0, 0, '')).toThrow();
        expect(() => applyJitter(0, 0, 'seed', 0)).toThrow();
    });
});

describe('getPublicCoords — privacy by default', () => {
    it('returns JITTERED coords when exposeExact=false (default)', () => {
        const c = getPublicCoords({
            lat: EXACT_LAT,
            lng: EXACT_LNG,
            seed: 'ref-2410',
            exposeExact: false,
            tipoVivienda: 'Piso',
        });
        expect(c).not.toBeNull();
        expect(c!.lat).not.toBe(EXACT_LAT);
        expect(c!.lng).not.toBe(EXACT_LNG);
    });

    it('returns EXACT coords ONLY when exposeExact=true (literal boolean)', () => {
        const c = getPublicCoords({
            lat: EXACT_LAT,
            lng: EXACT_LNG,
            seed: 'ref-2410',
            exposeExact: true,
            tipoVivienda: 'Piso',
        });
        expect(c).not.toBeNull();
        expect(c!.lat).toBe(EXACT_LAT);
        expect(c!.lng).toBe(EXACT_LNG);
    });

    it('SECURITY: truthy non-boolean values do NOT trigger exact', () => {
        // Caller must pass literal `true`. TS prevents non-bool at compile
        // time but defense in depth: at runtime, the check === true would
        // reject "true" / 1 / {} (cast away types to simulate).
        const c = getPublicCoords({
            lat: EXACT_LAT,
            lng: EXACT_LNG,
            seed: 'ref',
            exposeExact: 'true' as unknown as boolean,
            tipoVivienda: 'Piso',
        });
        expect(c!.lat).not.toBe(EXACT_LAT);
    });

    it('uses 500m radius for chalet (larger than piso for same seed)', () => {
        const piso = getPublicCoords({
            lat: EXACT_LAT, lng: EXACT_LNG, seed: 'same', exposeExact: false, tipoVivienda: 'Piso',
        });
        const chalet = getPublicCoords({
            lat: EXACT_LAT, lng: EXACT_LNG, seed: 'same', exposeExact: false, tipoVivienda: 'Chalet',
        });
        const dPiso = Math.hypot(piso!.lat - EXACT_LAT, piso!.lng - EXACT_LNG);
        const dChalet = Math.hypot(chalet!.lat - EXACT_LAT, chalet!.lng - EXACT_LNG);
        expect(dChalet).toBeGreaterThan(dPiso);
    });

    it('returns null for invalid coords', () => {
        expect(getPublicCoords({ lat: null, lng: null, seed: 'x', exposeExact: false })).toBeNull();
        expect(getPublicCoords({ lat: NaN, lng: 0, seed: 'x', exposeExact: false })).toBeNull();
        expect(getPublicCoords({ lat: undefined, lng: 0, seed: 'x', exposeExact: false })).toBeNull();
    });
});

describe('coerceCoord', () => {
    it('passes through finite numbers', () => {
        expect(coerceCoord(38.965)).toBe(38.965);
        expect(coerceCoord(0)).toBe(0);
        expect(coerceCoord(-0.5)).toBe(-0.5);
    });

    it('parses string numerics (Postgres numeric → text)', () => {
        expect(coerceCoord('38.965123')).toBe(38.965123);
        expect(coerceCoord('-0.181098')).toBe(-0.181098);
    });

    it('returns null for invalid', () => {
        expect(coerceCoord(null)).toBeNull();
        expect(coerceCoord(undefined)).toBeNull();
        expect(coerceCoord('not-a-number')).toBeNull();
        expect(coerceCoord(NaN)).toBeNull();
        expect(coerceCoord('')).toBeNull();
    });
});

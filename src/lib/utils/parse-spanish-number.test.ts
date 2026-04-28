import { describe, it, expect } from 'vitest';
import { parseSpanishNumber } from './parse-spanish-number';

describe('parseSpanishNumber', () => {
    it('returns undefined for null/undefined/empty', () => {
        expect(parseSpanishNumber(null)).toBeUndefined();
        expect(parseSpanishNumber(undefined)).toBeUndefined();
        expect(parseSpanishNumber('')).toBeUndefined();
        expect(parseSpanishNumber('   ')).toBeUndefined();
    });

    it('returns numbers as-is when finite', () => {
        expect(parseSpanishNumber(0)).toBe(0);
        expect(parseSpanishNumber(320000)).toBe(320000);
        expect(parseSpanishNumber(-50)).toBe(-50);
        expect(parseSpanishNumber(1.5)).toBe(1.5);
    });

    it('returns undefined for non-finite numbers', () => {
        expect(parseSpanishNumber(Number.NaN)).toBeUndefined();
        expect(parseSpanishNumber(Number.POSITIVE_INFINITY)).toBeUndefined();
    });

    it('parses Spanish thousand separator (the original bug)', () => {
        // Real refs from 2026-04-28 incident
        expect(parseSpanishNumber('320.000')).toBe(320000);
        expect(parseSpanishNumber('699.000')).toBe(699000);
        expect(parseSpanishNumber('249.000')).toBe(249000);
        expect(parseSpanishNumber('210.000')).toBe(210000);
        expect(parseSpanishNumber('169.999')).toBe(169999);
        expect(parseSpanishNumber('160.000')).toBe(160000);
        expect(parseSpanishNumber('319.000')).toBe(319000);
    });

    it('parses Spanish thousand separator with multiple groups', () => {
        expect(parseSpanishNumber('1.234.567')).toBe(1234567);
        expect(parseSpanishNumber('12.345.678')).toBe(12345678);
    });

    it('parses Spanish thousands + decimal comma', () => {
        expect(parseSpanishNumber('1.234,56')).toBe(1234.56);
        expect(parseSpanishNumber('320.000,50')).toBe(320000.5);
    });

    it('parses Spanish decimal-only (comma)', () => {
        expect(parseSpanishNumber('320,50')).toBe(320.5);
        expect(parseSpanishNumber('0,99')).toBe(0.99);
    });

    it('parses plain integers', () => {
        expect(parseSpanishNumber('280')).toBe(280);
        expect(parseSpanishNumber('11000')).toBe(11000);
        expect(parseSpanishNumber('1985')).toBe(1985); // year, NOT thousand-separated
    });

    it('falls back to Number() for US-style decimals', () => {
        expect(parseSpanishNumber('1234.56')).toBe(1234.56);
        expect(parseSpanishNumber('0.5')).toBe(0.5);
    });

    it('rejects garbage', () => {
        expect(parseSpanishNumber('abc')).toBeUndefined();
        expect(parseSpanishNumber('320.000abc')).toBeUndefined();
    });

    it('does NOT strip dots when the pattern is not strict ES thousands', () => {
        // "12.34" is NOT thousand-separated (group of 2 after dot)
        expect(parseSpanishNumber('12.34')).toBe(12.34);
        // "1.23" is decimal, not thousand
        expect(parseSpanishNumber('1.23')).toBe(1.23);
    });

    it('handles negatives', () => {
        expect(parseSpanishNumber('-320.000')).toBe(-320000);
        expect(parseSpanishNumber('-1.234,56')).toBe(-1234.56);
    });

    it('rejects non-string non-number types', () => {
        expect(parseSpanishNumber({})).toBeUndefined();
        expect(parseSpanishNumber([])).toBeUndefined();
        expect(parseSpanishNumber(true)).toBeUndefined();
    });
});

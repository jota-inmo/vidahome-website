import { describe, it, expect } from 'vitest';
import { sortProperties } from './property-sort';
import type { PropertyListEntry } from '@/types/inmovilla';

const make = (overrides: Partial<PropertyListEntry>): PropertyListEntry =>
  ({
    cod_ofer: 0,
    ref: '',
    nodisponible: false,
    ...overrides,
  }) as PropertyListEntry;

describe('sortProperties', () => {
  describe('recent', () => {
    it('sorts by updated_at descending', () => {
      const a = make({ ref: 'a', updated_at: '2026-04-10T00:00:00Z' });
      const b = make({ ref: 'b', updated_at: '2026-04-14T00:00:00Z' });
      const c = make({ ref: 'c', updated_at: '2026-04-12T00:00:00Z' });
      const sorted = sortProperties([a, b, c], 'recent');
      expect(sorted.map(p => p.ref)).toEqual(['b', 'c', 'a']);
    });

    it('places entries without updated_at at the end', () => {
      const a = make({ ref: 'a', updated_at: '2026-04-10T00:00:00Z' });
      const b = make({ ref: 'b' });
      const sorted = sortProperties([b, a], 'recent');
      expect(sorted.map(p => p.ref)).toEqual(['a', 'b']);
    });
  });

  describe('price_asc', () => {
    it('sorts by precioinmo ascending for venta', () => {
      const a = make({ ref: 'a', keyacci: 1, precioinmo: 200000 });
      const b = make({ ref: 'b', keyacci: 1, precioinmo: 100000 });
      const c = make({ ref: 'c', keyacci: 1, precioinmo: 300000 });
      const sorted = sortProperties([a, b, c], 'price_asc');
      expect(sorted.map(p => p.ref)).toEqual(['b', 'a', 'c']);
    });

    it('uses precioalq for alquiler', () => {
      const a = make({ ref: 'a', keyacci: 2, precioalq: 1200 });
      const b = make({ ref: 'b', keyacci: 2, precioalq: 800 });
      const sorted = sortProperties([a, b], 'price_asc');
      expect(sorted.map(p => p.ref)).toEqual(['b', 'a']);
    });

    it('places properties without price at the end', () => {
      const a = make({ ref: 'a', keyacci: 1, precioinmo: 100000 });
      const b = make({ ref: 'b', keyacci: 1 });
      const c = make({ ref: 'c', keyacci: 1, precioinmo: 200000 });
      const sorted = sortProperties([b, a, c], 'price_asc');
      expect(sorted.map(p => p.ref)).toEqual(['a', 'c', 'b']);
    });

    it('treats 0 as "no price" (falls to end)', () => {
      const a = make({ ref: 'a', keyacci: 1, precioinmo: 0 });
      const b = make({ ref: 'b', keyacci: 1, precioinmo: 100000 });
      const sorted = sortProperties([a, b], 'price_asc');
      expect(sorted.map(p => p.ref)).toEqual(['b', 'a']);
    });
  });

  describe('price_desc', () => {
    it('sorts by precioinmo descending', () => {
      const a = make({ ref: 'a', keyacci: 1, precioinmo: 200000 });
      const b = make({ ref: 'b', keyacci: 1, precioinmo: 100000 });
      const c = make({ ref: 'c', keyacci: 1, precioinmo: 300000 });
      const sorted = sortProperties([a, b, c], 'price_desc');
      expect(sorted.map(p => p.ref)).toEqual(['c', 'a', 'b']);
    });

    it('still places properties without price at the end (not first)', () => {
      // Without the defensive guard, Infinity would sort first in descending
      // order and the user would see "precio bajo consulta" above the most
      // expensive listings. Regression fence.
      const a = make({ ref: 'a', keyacci: 1, precioinmo: 100000 });
      const b = make({ ref: 'b', keyacci: 1 });
      const c = make({ ref: 'c', keyacci: 1, precioinmo: 500000 });
      const sorted = sortProperties([b, a, c], 'price_desc');
      expect(sorted.map(p => p.ref)).toEqual(['c', 'a', 'b']);
    });
  });

  it('does not mutate the input array', () => {
    const original = [
      make({ ref: 'a', precioinmo: 300000 }),
      make({ ref: 'b', precioinmo: 100000 }),
    ];
    const before = original.map(p => p.ref).join(',');
    sortProperties(original, 'price_asc');
    const after = original.map(p => p.ref).join(',');
    expect(after).toBe(before);
  });
});

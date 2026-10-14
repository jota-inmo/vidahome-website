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
    it('ordena por fecha de publicación, no por el número de la ref', () => {
      // Caso real: la 3023 se captó en julio pero se publicó el 6-oct; la 3064
      // se captó después pero se publicó el 25-sep.
      const r3064 = make({ ref: '3064', published_at: '2026-09-25T16:13:07Z' });
      const r3023 = make({ ref: '3023', published_at: '2026-10-06T15:43:03Z' });
      const r3062 = make({ ref: '3062', published_at: '2026-10-13T16:40:36Z' });
      const sorted = sortProperties([r3064, r3023, r3062], 'recent');
      expect(sorted.map(p => p.ref)).toEqual(['3062', '3023', '3064']);
    });

    it('una ref republicada (published_at renovado) sube al principio', () => {
      const vieja = make({ ref: '2914', published_at: '2026-09-22T15:40:52Z' });
      const nueva = make({ ref: '3056', published_at: '2026-09-22T16:16:36Z' });
      const otra = make({ ref: '3053', published_at: '2026-09-21T16:47:18Z' });
      const sorted = sortProperties([otra, vieja, nueva], 'recent');
      expect(sorted.map(p => p.ref)).toEqual(['3056', '2914', '3053']);
    });

    it('empate de fecha: desempata por número de ref descendente', () => {
      const a = make({ ref: '3000', published_at: '2026-09-01T10:00:00Z' });
      const b = make({ ref: '3010', published_at: '2026-09-01T10:00:00Z' });
      const sorted = sortProperties([a, b], 'recent');
      expect(sorted.map(p => p.ref)).toEqual(['3010', '3000']);
    });

    it('sin published_at cae detrás de los que sí lo tienen', () => {
      const con = make({ ref: '2900', published_at: '2026-01-01T00:00:00Z' });
      const sin = make({ ref: '3050' });
      const sorted = sortProperties([sin, con], 'recent');
      expect(sorted.map(p => p.ref)).toEqual(['2900', '3050']);
    });

    it('ignora un published_at no parseable (como si no lo tuviera)', () => {
      const bad = make({ ref: '3050', published_at: 'no-es-fecha' });
      const ok = make({ ref: '2900', published_at: '2026-01-01T00:00:00Z' });
      const sorted = sortProperties([bad, ok], 'recent');
      expect(sorted.map(p => p.ref)).toEqual(['2900', '3050']);
    });

    it('sorts by ref number descending (más reciente = ref más alta)', () => {
      const a = make({ ref: '2976' });
      const b = make({ ref: '2980' });
      const c = make({ ref: '2970' });
      const sorted = sortProperties([a, b, c], 'recent');
      expect(sorted.map(p => p.ref)).toEqual(['2980', '2976', '2970']);
    });

    it('trata refs con prefijo (A2958, T2630) extrayendo su número', () => {
      const rVenta = make({ ref: '2967' });
      const rAlquiler = make({ ref: 'A2958' });
      const rTraspaso = make({ ref: 'T2630' });
      // Orden esperado por número: 2967 > 2958 > 2630
      const sorted = sortProperties([rTraspaso, rAlquiler, rVenta], 'recent');
      expect(sorted.map(p => p.ref)).toEqual(['2967', 'A2958', 'T2630']);
    });

    it('refs sin número parseable caen al final', () => {
      const a = make({ ref: '2976' });
      const b = make({ ref: 'foo' });
      const sorted = sortProperties([b, a], 'recent');
      expect(sorted.map(p => p.ref)).toEqual(['2976', 'foo']);
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

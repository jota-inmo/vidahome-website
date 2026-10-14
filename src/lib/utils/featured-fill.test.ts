import { describe, it, expect } from 'vitest';
import { fillFeatured, FEATURED_COUNT } from './featured-fill';

const p = (ref: string) => ({ ref });
const refs = (list: { ref: string }[]) => list.map(x => x.ref);

describe('fillFeatured', () => {
  it('el objetivo por defecto son 6 anuncios', () => {
    expect(FEATURED_COUNT).toBe(6);
  });

  it('lista manual completa: no añade nada', () => {
    const curated = ['1', '2', '3', '4', '5', '6'].map(p);
    const out = fillFeatured(curated, [p('9'), p('8')]);
    expect(refs(out)).toEqual(['1', '2', '3', '4', '5', '6']);
  });

  it('falta una: la completa con el candidato más reciente (el primero)', () => {
    const curated = ['1', '2', '3', '4', '5'].map(p);
    const out = fillFeatured(curated, [p('9'), p('8')]);
    expect(refs(out)).toEqual(['1', '2', '3', '4', '5', '9']);
  });

  it('las manuales van primero y mantienen su orden', () => {
    const out = fillFeatured([p('3'), p('1')], [p('9'), p('8'), p('7'), p('6'), p('5')]);
    expect(refs(out)).toEqual(['3', '1', '9', '8', '7', '6']);
  });

  it('no repite un candidato que ya está en las manuales', () => {
    const curated = ['1', '2', '3', '4', '5'].map(p);
    const out = fillFeatured(curated, [p('3'), p('9')]);
    expect(refs(out)).toEqual(['1', '2', '3', '4', '5', '9']);
  });

  it('lista manual vacía: se rellena entera con los candidatos', () => {
    const out = fillFeatured([], ['9', '8', '7', '6', '5', '4', '3'].map(p));
    expect(refs(out)).toEqual(['9', '8', '7', '6', '5', '4']);
  });

  it('si no hay candidatos suficientes devuelve lo que hay', () => {
    const out = fillFeatured([p('1')], [p('9')]);
    expect(refs(out)).toEqual(['1', '9']);
  });

  it('más de 6 manuales: se respetan todas (no se recorta lo editorial)', () => {
    const curated = ['1', '2', '3', '4', '5', '6', '7'].map(p);
    const out = fillFeatured(curated, [p('9')]);
    expect(refs(out)).toEqual(['1', '2', '3', '4', '5', '6', '7']);
  });

  it('no muta los arrays de entrada', () => {
    const curated = [p('1')];
    const candidates = [p('9')];
    fillFeatured(curated, candidates);
    expect(curated).toHaveLength(1);
    expect(candidates).toHaveLength(1);
  });
});

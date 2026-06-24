import { describe, it, expect } from 'vitest';
import { slugify, propertyLabelParts, buildPropertySlug, extractRef } from './slug';

describe('slugify', () => {
    it('strips diacritics and lowercases', () => {
        expect(slugify('Ático Dúplex')).toBe('atico-duplex');
        expect(slugify('Gandía')).toBe('gandia');
    });

    it('handles ñ', () => {
        expect(slugify('A Coruña')).toBe('a-coruna');
        expect(slugify('Logroño')).toBe('logrono');
    });

    it('handles apostrophes and multi-word names', () => {
        expect(slugify("La Font d'En Carros")).toBe('la-font-d-en-carros');
    });

    it('collapses separators and trims', () => {
        expect(slugify('  Casa / Chalet  ')).toBe('casa-chalet');
        expect(slugify('Local   comercial')).toBe('local-comercial');
        expect(slugify('--Gandía--')).toBe('gandia');
    });

    it('handles trailing whitespace and mixed case from CRM', () => {
        expect(slugify('GRAU DE GANDIA ')).toBe('grau-de-gandia');
        expect(slugify('Playa de Gandía ')).toBe('playa-de-gandia');
    });

    it('returns empty for nullish / empty input', () => {
        expect(slugify('')).toBe('');
        expect(slugify(null)).toBe('');
        expect(slugify(undefined)).toBe('');
    });
});

describe('propertyLabelParts', () => {
    it('reads already-resolved fields and trims', () => {
        expect(propertyLabelParts({ tipo_nombre: 'Piso', poblacion: 'Gandía ', ref: '2975' }))
            .toEqual({ tipoEs: 'Piso', poblacion: 'Gandía', ref: '2975' });
    });

    it('falls back to cod_ofer when ref missing', () => {
        expect(propertyLabelParts({ tipo_nombre: 'Piso', poblacion: 'Gandía', cod_ofer: 28734500 }))
            .toEqual({ tipoEs: 'Piso', poblacion: 'Gandía', ref: '28734500' });
    });

    it('tolerates nullish fields', () => {
        expect(propertyLabelParts({ tipo_nombre: null, poblacion: null, ref: '2975' }))
            .toEqual({ tipoEs: '', poblacion: '', ref: '2975' });
    });
});

describe('buildPropertySlug', () => {
    it('composes tipo-poblacion-ref when both present', () => {
        expect(buildPropertySlug({ tipo_nombre: 'Piso', poblacion: 'Gandía', ref: '2975' }))
            .toBe('piso-gandia-2975');
    });

    it('keeps ref verbatim (letter prefix, case preserved)', () => {
        expect(buildPropertySlug({ tipo_nombre: 'Local', poblacion: 'Gandía', ref: 'T2785' }))
            .toBe('local-gandia-T2785');
        expect(buildPropertySlug({ tipo_nombre: 'Piso', poblacion: 'Gandia', ref: 'A2884' }))
            .toBe('piso-gandia-A2884');
    });

    it('handles multi-hyphen poblacion with ref always last', () => {
        expect(buildPropertySlug({ tipo_nombre: 'Casa/Chalet', poblacion: "La Font d'En Carros", ref: '2826' }))
            .toBe('casa-chalet-la-font-d-en-carros-2826');
    });

    it('falls back to tipo-ref when no poblacion', () => {
        expect(buildPropertySlug({ tipo_nombre: 'Piso', poblacion: '', ref: 'A2709' }))
            .toBe('piso-A2709');
    });

    it('falls back to poblacion-ref when no tipo', () => {
        expect(buildPropertySlug({ tipo_nombre: '', poblacion: 'Gandía', ref: '2975' }))
            .toBe('gandia-2975');
    });

    it('falls back to bare ref when neither present', () => {
        expect(buildPropertySlug({ tipo_nombre: '', poblacion: '', ref: 'A2691' }))
            .toBe('A2691');
    });

    it('uses cod_ofer when ref missing (legacy)', () => {
        expect(buildPropertySlug({ tipo_nombre: 'Piso', poblacion: 'Gandía', cod_ofer: 28734500 }))
            .toBe('piso-gandia-28734500');
    });
});

describe('extractRef', () => {
    it('returns substring after the last hyphen', () => {
        expect(extractRef('piso-gandia-2975')).toBe('2975');
    });

    it('preserves ref case / letter prefix', () => {
        expect(extractRef('local-gandia-T2785')).toBe('T2785');
    });

    it('handles multi-hyphen poblacion (ref is last segment)', () => {
        expect(extractRef('casa-chalet-la-font-d-en-carros-2826')).toBe('2826');
    });

    it('returns the whole param when there is no hyphen (bare ref / cod_ofer)', () => {
        expect(extractRef('2975')).toBe('2975');
        expect(extractRef('T2785')).toBe('T2785');
        expect(extractRef('28734500')).toBe('28734500');
    });
});

describe('invariant: buildPropertySlug ∘ extractRef round-trips the ref', () => {
    const cases = [
        { tipo_nombre: 'Piso', poblacion: 'Gandía', ref: '2975' },
        { tipo_nombre: 'Local', poblacion: 'Gandía', ref: 'T2785' },
        { tipo_nombre: 'Casa/Chalet', poblacion: "La Font d'En Carros", ref: '2826' },
        { tipo_nombre: '', poblacion: 'Oliva', ref: 'A2654' },
        { tipo_nombre: 'Piso', poblacion: '', ref: 'A2709' },
        { tipo_nombre: '', poblacion: '', ref: 'A2691' },
    ];
    it.each(cases)('round-trips %o', (prop) => {
        expect(extractRef(buildPropertySlug(prop))).toBe(prop.ref);
    });
});

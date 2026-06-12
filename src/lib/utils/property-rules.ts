/**
 * Pure business rules for classifying a property as venta / alquiler /
 * traspaso, plus matching it against a catalog filter type.
 *
 * Classification today is derived on the client from two fields:
 *   - `ref`: a leading "T" marks a traspaso (e.g. "T2630").
 *   - `keyacci`: Inmovilla's operation key — 1 = venta, 2 = alquiler.
 *
 * Rule (decided 2026): a property with NO `keyacci` is treated as VENTA
 * (keyacci 1) and never shows up under alquiler. Alquiler requires an
 * explicit `keyacci === 2`.
 *
 * TODO: mover clasificación traspaso al backend — deriving "traspaso" from
 * the ref prefix is a front-end heuristic; the source of truth should be a
 * proper field/flag set when the listing is created.
 */

export type ListingType = 'buy' | 'rent' | 'transfer';

/** Minimal shape needed to classify a property. */
export interface ClassifiableProperty {
    ref?: string | null;
    keyacci?: number | null;
}

/** A traspaso is identified by a leading "T" in the ref (case-insensitive). */
export function esTraspaso(ref: string | null | undefined): boolean {
    return (ref || '').toUpperCase().startsWith('T');
}

/**
 * Venta = not a traspaso and not an explicit rental. A missing/undefined
 * `keyacci` counts as venta.
 */
export function esVenta(p: ClassifiableProperty): boolean {
    return !esTraspaso(p.ref) && p.keyacci !== 2;
}

/** Alquiler = not a traspaso and an explicit `keyacci === 2`. */
export function esAlquiler(p: ClassifiableProperty): boolean {
    return !esTraspaso(p.ref) && p.keyacci === 2;
}

/** Whether a property belongs in the catalog under the given filter type. */
export function matchesType(p: ClassifiableProperty, type: ListingType): boolean {
    switch (type) {
        case 'transfer':
            return esTraspaso(p.ref);
        case 'rent':
            return esAlquiler(p);
        case 'buy':
        default:
            return esVenta(p);
    }
}

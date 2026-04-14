import type { PropertyListEntry } from '@/types/inmovilla';

export type SortKey = 'recent' | 'price_asc' | 'price_desc';

/**
 * Devuelve el precio "efectivo" de una propiedad para ordenación:
 *   - Alquiler (`keyacci === 2`): `precioalq`.
 *   - Venta u otro: `precioinmo` con fallback a `precio`.
 *
 * Cuando no hay precio disponible devolvemos `Infinity` para que esos
 * anuncios caigan SIEMPRE al final, independientemente del sentido del
 * orden — el usuario nunca quiere ver "precio bajo consulta" ni de
 * primero ni de último alternativamente según pulse ascendente /
 * descendente: lo que espera es que desaparezcan de la zona útil.
 */
function effectivePrice(p: PropertyListEntry): number {
  const isRental = p.keyacci === 2;
  const raw = isRental ? p.precioalq : (p.precioinmo ?? p.precio);
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : Infinity;
}

/**
 * Ordena un array de propiedades según el criterio elegido. NO muta el
 * input — devuelve un nuevo array.
 *
 * - `recent`: usa `updated_at` ISO en orden descendente. Filas sin
 *   `updated_at` caen al final.
 * - `price_asc` / `price_desc`: usa `effectivePrice()`. Propiedades sin
 *   precio útil caen al final en ambos casos.
 */
export function sortProperties(
  properties: PropertyListEntry[],
  sortKey: SortKey,
): PropertyListEntry[] {
  const copy = [...properties];
  switch (sortKey) {
    case 'price_asc':
      copy.sort((a, b) => effectivePrice(a) - effectivePrice(b));
      return copy;
    case 'price_desc':
      copy.sort((a, b) => {
        const pa = effectivePrice(a);
        const pb = effectivePrice(b);
        // Propiedades sin precio siempre al final, aunque estemos en
        // descendente — si no, "sin precio" (Infinity) encabezaría la lista.
        if (pa === Infinity && pb === Infinity) return 0;
        if (pa === Infinity) return 1;
        if (pb === Infinity) return -1;
        return pb - pa;
      });
      return copy;
    case 'recent':
    default:
      copy.sort((a, b) => {
        const ta = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const tb = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return tb - ta;
      });
      return copy;
  }
}

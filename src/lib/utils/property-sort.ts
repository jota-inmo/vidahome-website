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
 * Extrae el número de una ref para ordenación "más reciente".
 *
 * Refs del CRM:
 *   · Venta:     `2976`, `2975`, … (numero puro incremental)
 *   · Alquiler:  `A2958`, `A2654`, … (prefijo `A`)
 *   · Traspaso:  `T2630`, `T2785` (prefijo `T`)
 *   · Oferta:    `OFR005` (no aparece en catálogo web — estas no son propiedades)
 *   · Cazador:   `CC2887` (tampoco aparecen en catálogo)
 *
 * Estrategia: strip de letras iniciales y parseo del número. Las refs
 * comparten el mismo espacio numérico creciente (el contador del CRM
 * genera el siguiente número independientemente del tipo), así que
 * ordenar por ese número refleja el orden real de creación.
 *
 * Refs sin dígitos parseables caen al final con -Infinity.
 */
function refNumber(ref: string | undefined | null): number {
  if (!ref) return -Infinity;
  const match = String(ref).match(/(\d+)/);
  if (!match) return -Infinity;
  const n = parseInt(match[1], 10);
  return Number.isFinite(n) ? n : -Infinity;
}

/**
 * Marca de tiempo de publicación (ms). `published_at` lo mantiene un trigger
 * de BD y se renueva cada vez que el anuncio pasa a estar publicado, así que
 * despublicar y volver a publicar cuenta como nuevo. Sin dato o no
 * parseable → -Infinity (cae detrás de los que sí lo tienen).
 */
function publishedTime(p: PropertyListEntry): number {
  if (!p.published_at) return -Infinity;
  const t = Date.parse(p.published_at);
  return Number.isFinite(t) ? t : -Infinity;
}

/**
 * Ordena un array de propiedades según el criterio elegido. NO muta el
 * input — devuelve un nuevo array.
 *
 * - `recent`: `published_at` descendente (último publicado primero); empate
 *   o sin dato → número de la `ref` descendente. Cambiado 2026-10-14: la ref
 *   es el orden de CAPTACIÓN, no de publicación (una ref captada en julio y
 *   publicada en octubre quedaba enterrada). Antes (2026-04-21) se había
 *   dejado `updated_at` por usar la ref, porque `updated_at` se toca con
 *   cada edición (precio, fotos…); `published_at` no.
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
        const ta = publishedTime(a);
        const tb = publishedTime(b);
        if (ta !== tb) return ta === -Infinity ? 1 : tb === -Infinity ? -1 : tb - ta;
        return refNumber(b.ref) - refNumber(a.ref);
      });
      return copy;
  }
}

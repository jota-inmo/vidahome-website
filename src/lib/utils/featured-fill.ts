/** Nº de anuncios que debe mostrar la portada (2 filas de 3 columnas). */
export const FEATURED_COUNT = 6;

/**
 * Completa la lista editorial de destacadas hasta `target` anuncios con los
 * candidatos automáticos (los últimos publicados, ya ordenados del más
 * reciente al más antiguo).
 *
 * - Las manuales van primero y conservan su orden: lo editorial manda.
 * - Un candidato que ya está en las manuales (misma ref) no se repite.
 * - Si hay más manuales que `target` se respetan todas: solo se rellena,
 *   nunca se recorta lo que eligió el admin.
 * - No muta los arrays de entrada.
 */
export function fillFeatured<T extends { ref?: string | null }>(
  curated: readonly T[],
  candidates: readonly T[],
  target: number = FEATURED_COUNT,
): T[] {
  const result = [...curated];
  const seen = new Set(curated.map(c => c.ref).filter(Boolean) as string[]);

  for (const candidate of candidates) {
    if (result.length >= target) break;
    if (candidate.ref && seen.has(candidate.ref)) continue;
    if (candidate.ref) seen.add(candidate.ref);
    result.push(candidate);
  }
  return result;
}

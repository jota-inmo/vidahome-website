/**
 * Baños + aseos display helpers.
 *
 * En España (y en la taxonomía de Inmovilla) un "baño" tiene ducha/bañera y
 * un "aseo" es un WC con lavabo sin ducha. La web antes mostraba solo el
 * contador `banyos` en los iconos de la card y en la ficha, así que un piso
 * con 1 baño + 1 aseo aparecía como "1" baño — visualmente perdía una
 * estancia frente a pisos equivalentes.
 *
 * Ahora mostramos el **total** (banyos + aseos) en el número principal y
 * exponemos el desglose "X baño + Y aseo" como tooltip hover (atributo
 * `title` nativo — accesible, funciona en todos los navegadores, sin
 * depender de ningún componente extra). Si no hay aseos, el tooltip queda
 * vacío y el contador principal coincide con los baños de toda la vida.
 */

/** Total de estancias sanitarias (baños + aseos). */
export function totalBathrooms(banyos?: number | null, aseos?: number | null): number {
  return (Number(banyos) || 0) + (Number(aseos) || 0);
}

/**
 * Devuelve el desglose "X baño(s) + Y aseo(s)" en español, o `undefined` si
 * no hay desglose que mostrar (una sola categoría, o ambas a 0). Pensado
 * para pasar directamente al atributo `title` del `<div>` que envuelve el
 * icono del baño.
 */
export function bathroomsTooltip(banyos?: number | null, aseos?: number | null): string | undefined {
  const b = Number(banyos) || 0;
  const a = Number(aseos) || 0;
  if (b > 0 && a > 0) {
    const bPart = `${b} ${b === 1 ? 'baño' : 'baños'}`;
    const aPart = `${a} ${a === 1 ? 'aseo' : 'aseos'}`;
    return `${bPart} + ${aPart}`;
  }
  return undefined;
}

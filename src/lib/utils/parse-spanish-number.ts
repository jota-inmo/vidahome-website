/**
 * Parsea un valor numérico aceptando formato español ("320.000", "1.234,56")
 * además del formato US/JS por defecto. Útil para campos como `encargos.precio`
 * que en VidaHome viven como columna `text` y los agentes teclean con punto
 * como separador de miles ("320.000" = 320 mil €).
 *
 * Casos cubiertos:
 *   "320"        → 320
 *   "320.000"    → 320000     (miles ES)
 *   "1.234.567"  → 1234567    (miles ES)
 *   "169.999"    → 169999     (miles ES — no decimal)
 *   "320,50"     → 320.5      (decimal ES)
 *   "1.234,56"   → 1234.56    (miles + decimal ES)
 *   "1234.56"    → 1234.56    (decimal US, fallback Number())
 *   ""           → undefined
 *   null         → undefined
 *   "abc"        → undefined
 *
 * Heurística:
 *   - Solo se interpreta el `.` como separador de miles si la cadena entera
 *     matchea `\d{1,3}(\.\d{3})+(,\d+)?` — grupos exactos de 3 dígitos tras
 *     cada punto. Esto evita que "1985" o "12.5" se rompan.
 *   - Si hay coma se trata como decimal (formato ES); los puntos que la
 *     precedan se asumen separadores de miles.
 *   - Si no matchea ningún patrón ES, se delega a `Number()` (acepta US-style
 *     "1234.56", notación científica, negativos, etc.).
 */
export function parseSpanishNumber(v: unknown): number | undefined {
    if (v === null || v === undefined) return undefined;
    if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
    if (typeof v !== 'string') return undefined;

    const s = v.trim();
    if (s === '') return undefined;

    // Caso 1: formato ES con miles + decimal opcional → "1.234.567,89"
    if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) {
        const normalized = s.replace(/\./g, '').replace(',', '.');
        const n = Number(normalized);
        return Number.isFinite(n) ? n : undefined;
    }

    // Caso 2: formato ES solo con decimal (coma) → "320,50"
    if (/^-?\d+,\d+$/.test(s)) {
        const n = Number(s.replace(',', '.'));
        return Number.isFinite(n) ? n : undefined;
    }

    // Caso 3: fallback genérico (US-style, entero plano, científica, …)
    const n = Number(s);
    return Number.isFinite(n) ? n : undefined;
}

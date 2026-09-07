/**
 * Serialización segura de JSON-LD para `dangerouslySetInnerHTML`.
 *
 * Auditoría 2026-09-05 (A-6): `JSON.stringify()` escapa `"` y `\` pero NO
 * `<` ni `/`. Un valor de BD (poblacion, tipo_nombre, ref…) que contenga
 * `</script><img src=x onerror=…>` rompe el bloque `<script>` y ejecuta JS
 * con origen del sitio para todo visitante de esa página. Es el mismo
 * riesgo por el que la spec de JSON-LD de Google recomienda escapar `<`
 * como `<` — no es opcional al insertar JSON dentro de un `<script>`.
 *
 * Usar SIEMPRE en vez de `JSON.stringify(x)` en cualquier
 * `dangerouslySetInnerHTML={{ __html: JSON.stringify(...) }}` de JSON-LD.
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

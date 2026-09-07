import DOMPurify from "isomorphic-dompurify";

/**
 * Sanea el HTML de las páginas legales (aviso legal / privacidad / cookies)
 * antes de `dangerouslySetInnerHTML` — auditoría 2026-09-05 (B-10).
 *
 * El contenido se edita desde `/[locale]/admin/legal` (gated `requireAdmin`)
 * y hoy solo un admin de confianza puede escribirlo, así que no es una
 * superficie explotable por un usuario anónimo — pero convierte la cookie
 * `admin_session` en un activo de ejecución de código: si esa sesión se
 * compromete (o un admin pega HTML de una fuente que no controla), el XSS
 * quedaría persistente en 3 páginas públicas. Sanear en el render es
 * defensa en profundidad barata, sin cambiar el editor ni el flujo de guardado.
 *
 * Whitelist pensada para contenido legal con formato: párrafos, títulos,
 * listas, énfasis, enlaces, tablas — sin scripts, sin manejadores de evento,
 * sin iframes/objetos embebidos.
 */
export function sanitizeLegalHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "b", "em", "i", "u", "s",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li",
      "a", "blockquote", "hr",
      "table", "thead", "tbody", "tr", "th", "td",
      "span", "div",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "class", "id"],
  });
}

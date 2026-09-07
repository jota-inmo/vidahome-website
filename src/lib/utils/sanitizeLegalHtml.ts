import sanitizeHtml from "sanitize-html";

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
 * sin iframes/objetos embebidos. `class`/`id` permitidos porque el editor
 * (textarea de HTML crudo en /admin/legal) usa clases Tailwind inline para
 * matices de estilo (verificado en BD: `<p class="text-sm text-slate-500
 * mb-6">`, `<h3 class="text-base font-semibold mt-4">`) — sin ellos el
 * saneado rompería el formato real ya guardado.
 *
 * ⚠️ Intento previo (2026-09-05/07): `isomorphic-dompurify` (jsdom por
 * debajo) pasaba `next build && next start` en local pero rompía en el
 * runtime Turbopack real de Vercel (`ERR_REQUIRE_ESM`) — incidente en
 * prod, revertido. `sanitize-html` corre sobre `htmlparser2` (parser JS
 * puro, sin dependencias nativas, sin jsdom) — evita esa clase de
 * incompatibilidad. Ver memoria CC
 * `feedback_nextjs_turbopack_jsdom_esm_incompatible.md`. Verificado contra
 * un deploy/preview real de Vercel antes de mergear a main esta vez, no
 * solo local — no repetir el error de confiar solo en `next start`.
 */
export function sanitizeLegalHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "strong", "b", "em", "i", "u", "s",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li",
      "a", "blockquote", "hr",
      "table", "thead", "tbody", "tr", "th", "td",
      "span", "div",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      "*": ["class", "id"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    // Cualquier link con target="_blank" en el contenido guardado sale con
    // rel="noopener noreferrer" reforzado, tenga o no rel ya puesto.
    transformTags: {
      a: (tagName, attribs) => {
        if (attribs.target === "_blank") {
          return {
            tagName,
            attribs: { ...attribs, rel: "noopener noreferrer" },
          };
        }
        return { tagName, attribs };
      },
    },
  });
}

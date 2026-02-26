/**
 * HTML sanitization utilities for user-generated content
 * that will be interpolated into HTML templates (e.g. emails).
 */

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
};

/**
 * Escapes HTML special characters to prevent XSS injection.
 * Use this on ALL user-provided values before inserting into HTML templates.
 */
export function escapeHtml(str: string | number | null | undefined): string {
  if (str == null) return '';
  return String(str).replace(/[&<>"']/g, (ch) => HTML_ESCAPE_MAP[ch] || ch);
}

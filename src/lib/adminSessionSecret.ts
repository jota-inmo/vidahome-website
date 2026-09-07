import crypto from "crypto";

/**
 * Deriva el secreto de firma HMAC de la cookie `admin_session` a partir de
 * `ADMIN_PASSWORD` — auditoría 2026-09-05 (B-10).
 *
 * Antes, `ADMIN_PASSWORD` en claro era TAMBIÉN la clave HMAC — la misma
 * cadena que un humano teclea en el login firmaba las cookies. Aquí se
 * deriva un valor distinto (SHA-256 con una etiqueta de dominio fija) para
 * que ambos usos queden separados: conocer/filtrar la clave de firma no es
 * lo mismo que conocer la contraseña de login. `ADMIN_PASSWORD` sigue
 * siendo la única fuente — no se añade ninguna env var nueva ni un paso de
 * configuración obligatorio.
 *
 * Efecto colateral asumido: al desplegar este cambio, la clave de firma
 * cambia una vez → cualquier sesión admin activa en ese momento deja de
 * validar y pide login de nuevo. No hay dato cifrado en reposo con este
 * secreto (a diferencia de AUTH_SALT_2FA en el CRM) — un re-login es el
 * único coste, no una pérdida de datos.
 */
export function getAdminSessionSecret(): string {
  const password = process.env.ADMIN_PASSWORD || "";
  if (!password) return "";
  return crypto.createHash("sha256").update(`admin-session-hmac:${password}`).digest("hex");
}

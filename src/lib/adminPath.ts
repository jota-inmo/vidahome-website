import { LOCALES } from '@/i18n/locales';

// Módulo puro y compatible con Edge (sin `crypto` de Node): lo usan el
// middleware y las verificaciones de sesión.

export const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const CLOCK_SKEW_MS = 5 * 60 * 1000;

/** Quita el prefijo de locale SOLO si es un locale soportado y segmento completo. */
export function stripLocalePrefix(pathname: string): string {
    for (const locale of LOCALES) {
        if (pathname === `/${locale}`) return '/';
        if (pathname.startsWith(`/${locale}/`)) return pathname.slice(locale.length + 1);
    }
    return pathname || '/';
}

export function isAdminPath(pathname: string): boolean {
    const p = stripLocalePrefix(pathname);
    return p === '/admin' || p.startsWith('/admin/');
}

export function isAdminLoginPath(pathname: string): boolean {
    return stripLocalePrefix(pathname) === '/admin/login';
}

/** `admin:<timestamp>` dentro de la ventana de validez de la sesión. */
export function isSessionPayloadFresh(payload: string, now: number = Date.now()): boolean {
    const match = payload.match(/^admin:(\d+)$/);
    if (!match) return false;
    const issuedAt = parseInt(match[1], 10);
    if (issuedAt - now > CLOCK_SKEW_MS) return false;
    return now - issuedAt < SESSION_MAX_AGE_MS;
}

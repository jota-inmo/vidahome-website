import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

// ─── Verificación de cookie firmada (Edge Runtime compatible) ────────────────
const TOKEN_SEPARATOR = '.';

/**
 * Equivalente Edge-Runtime (Web Crypto, sin el módulo `crypto` de Node) de
 * `lib/adminSessionSecret.ts::getAdminSessionSecret` — auditoría 2026-09-05
 * (B-10). DEBE producir el mismo hex que la versión Node (mismo algoritmo
 * SHA-256, misma cadena de entrada, misma codificación de salida) porque
 * las tres verificaciones de la cookie (aquí, lib/auth.ts, actions/auth.ts)
 * tienen que coincidir en qué secreto firma/verifica.
 */
async function deriveAdminSessionSecret(password: string): Promise<string> {
    if (!password) return '';
    const encoder = new TextEncoder();
    const digest = await crypto.subtle.digest('SHA-256', encoder.encode(`admin-session-hmac:${password}`));
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifySessionToken(token: string, secret: string): Promise<boolean> {
    if (!token || !secret || !token.includes(TOKEN_SEPARATOR)) return false;

    const lastDotIndex = token.lastIndexOf(TOKEN_SEPARATOR);
    const payload = token.substring(0, lastDotIndex);
    const signature = token.substring(lastDotIndex + 1);

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    if (signature.length !== expectedSignature.length) return false;

    let result = 0;
    for (let i = 0; i < signature.length; i++) {
        result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }
    if (result !== 0) return false;

    // Verificar expiración del token (24 horas)
    const match = payload.match(/^admin:(\d+)$/);
    if (!match) return false;
    const tokenAge = Date.now() - parseInt(match[1], 10);
    return tokenAge < 24 * 60 * 60 * 1000;
}

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Detect if it's an admin page (considering the locale prefix)
    const pathnameWithoutLocale = pathname.replace(/^\/(es|en)/, '') || '/';
    const isAdminPage = pathnameWithoutLocale.startsWith('/admin');
    const isLoginPage = pathnameWithoutLocale === '/admin/login';

    if (isAdminPage) {
        const sessionCookie = request.cookies.get('admin_session');
        // Auditoría 2026-09-05 (B-10): secreto derivado, ya no el password en claro.
        const secret = await deriveAdminSessionSecret(process.env.ADMIN_PASSWORD || '');
        let isAuthenticated = false;

        if (sessionCookie?.value) {
            isAuthenticated = await verifySessionToken(sessionCookie.value, secret);
        }

        if (!isLoginPage && !isAuthenticated) {
            const locale = pathname.split('/')[1] || 'es';
            // Ensure we use a valid locale in the redirect
            const targetLocale = ['es', 'en'].includes(locale) ? locale : 'es';
            return NextResponse.redirect(new URL(`/${targetLocale}/admin/login`, request.url));
        }

        if (isLoginPage && isAuthenticated) {
            const locale = pathname.split('/')[1] || 'es';
            const targetLocale = ['es', 'en'].includes(locale) ? locale : 'es';
            return NextResponse.redirect(new URL(`/${targetLocale}/admin`, request.url));
        }
    }

    // Apply next-intl middleware for all routes
    return intlMiddleware(request);
}

export const config = {
    // Match all pathnames except for
    // - API routes
    // - Static files (_next, images, etc.)
    // - Vercel internals
    // - confirmar-visita: vive en el CRM (rewrite en next.config.ts).
    //   Sin exclusión, next-intl redirige a /es/confirmar-visita/... y
    //   el rewrite source no matchea → 404. El CRM maneja su propio i18n
    //   vía ?lang=es, no necesita locale prefix.
    matcher: ['/((?!api|_next|_vercel|confirmar-visita|.*\\..*).*)']
};

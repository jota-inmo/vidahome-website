import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ─── Verificación de cookie firmada (Edge Runtime compatible) ────────────────
// Usamos Web Crypto API (disponible en Edge Runtime) en lugar del módulo
// 'crypto' de Node.js que no está disponible en el middleware de Next.js.

const TOKEN_SEPARATOR = '.';

async function verifySessionToken(token: string, secret: string): Promise<boolean> {
    if (!token || !secret || !token.includes(TOKEN_SEPARATOR)) return false;

    const lastDotIndex = token.lastIndexOf(TOKEN_SEPARATOR);
    const payload = token.substring(0, lastDotIndex);
    const signature = token.substring(lastDotIndex + 1);

    // Generar la firma esperada con Web Crypto API
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

    // Comparación constante-time (evita timing attacks)
    if (signature.length !== expectedSignature.length) return false;

    let result = 0;
    for (let i = 0; i < signature.length; i++) {
        result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }
    return result === 0;
}

export async function middleware(request: NextRequest) {
    const sessionCookie = request.cookies.get('admin_session');
    const pathname = request.nextUrl.pathname;
    const isLoginPage = pathname === '/admin/login';
    const isAdminPage = pathname.startsWith('/admin');

    // Verificar la firma criptográfica de la cookie (no solo su existencia)
    const secret = process.env.ADMIN_PASSWORD || '';
    let isAuthenticated = false;

    if (sessionCookie?.value) {
        isAuthenticated = await verifySessionToken(sessionCookie.value, secret);
    }

    if (isAdminPage && !isLoginPage && !isAuthenticated) {
        return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    if (isLoginPage && isAuthenticated) {
        return NextResponse.redirect(new URL('/admin', request.url));
    }

    return NextResponse.next();
}

export const config = {
    // Protege /admin/* (incluye /admin/hero y /admin/featured)
    matcher: ['/admin/:path*'],
};

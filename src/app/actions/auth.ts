'use server';

import { cookies } from 'next/headers';
import crypto from 'crypto';

// ─── Utilidades de firma criptográfica ───────────────────────────────────────
// La cookie ya no lleva un valor predecible ('active').
// En su lugar se firma un payload con HMAC-SHA256 usando el ADMIN_PASSWORD como
// secreto. Esto impide que alguien cree la cookie manualmente en DevTools.

const COOKIE_NAME = 'admin_session';
const TOKEN_SEPARATOR = '.';

function getSecret(): string {
    return process.env.ADMIN_PASSWORD || '';
}

function signToken(payload: string): string {
    const hmac = crypto.createHmac('sha256', getSecret());
    hmac.update(payload);
    return hmac.digest('hex');
}

function createSessionToken(): string {
    // Payload: timestamp de creación (para verificar que es un token válido)
    const payload = `admin:${Date.now()}`;
    const signature = signToken(payload);
    return `${payload}${TOKEN_SEPARATOR}${signature}`;
}

function verifySessionToken(token: string): boolean {
    if (!token || !token.includes(TOKEN_SEPARATOR)) return false;

    const lastDotIndex = token.lastIndexOf(TOKEN_SEPARATOR);
    const payload = token.substring(0, lastDotIndex);
    const signature = token.substring(lastDotIndex + 1);

    // Verificar que la firma es válida
    const expectedSignature = signToken(payload);

    // Comparación segura contra timing attacks
    try {
        return crypto.timingSafeEqual(
            Buffer.from(signature, 'hex'),
            Buffer.from(expectedSignature, 'hex')
        );
    } catch {
        return false;
    }
}

// ─── Acciones públicas ───────────────────────────────────────────────────────

export async function loginAction(password: string) {
    const adminPass = process.env.ADMIN_PASSWORD;
    if (!adminPass) {
        console.error('[Auth] ADMIN_PASSWORD no está configurado en las variables de entorno.');
        return { success: false, error: 'Error de configuración del servidor' };
    }
    if (password.trim() === adminPass.trim()) {
        const token = createSessionToken();
        (await cookies()).set(COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 // 1 day
        });
        return { success: true };
    }
    return { success: false, error: 'Contraseña incorrecta' };
}

export async function logoutAction() {
    (await cookies()).delete(COOKIE_NAME);
    return { success: true };
}

export async function checkAuthAction() {
    const session = (await cookies()).get(COOKIE_NAME);
    if (!session?.value) return false;
    return verifySessionToken(session.value);
}

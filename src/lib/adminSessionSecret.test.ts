import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getAdminSessionSecret } from './adminSessionSecret';

const ORIGINAL_ENV = { ...process.env };
afterEach(() => { process.env = { ...ORIGINAL_ENV }; });

/**
 * Equivalente Web Crypto de middleware.ts::deriveAdminSessionSecret,
 * reproducido aquí (no se puede importar middleware.ts directo — depende
 * de next-intl/next/server) para confirmar que las DOS implementaciones
 * (Node crypto en lib/auth.ts + actions/auth.ts, Web Crypto en el
 * middleware Edge) derivan el MISMO secreto — auditoría 2026-09-05 (B-10).
 * Si alguna vez divergen, el admin nunca podría pasar el middleware aunque
 * su cookie esté bien firmada por el server action.
 */
async function deriveViaWebCrypto(password: string): Promise<string> {
    if (!password) return '';
    const encoder = new TextEncoder();
    const digest = await crypto.subtle.digest('SHA-256', encoder.encode(`admin-session-hmac:${password}`));
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

describe('getAdminSessionSecret — auditoría 2026-09-05 (B-10)', () => {
    it('deriva un valor distinto del password en claro', () => {
        process.env.ADMIN_PASSWORD = 'mi-contraseña-admin';
        const secret = getAdminSessionSecret();
        expect(secret).not.toBe('mi-contraseña-admin');
        expect(secret).toMatch(/^[0-9a-f]{64}$/); // hex SHA-256
    });

    it('vacío si no hay ADMIN_PASSWORD configurada', () => {
        delete process.env.ADMIN_PASSWORD;
        expect(getAdminSessionSecret()).toBe('');
    });

    it('es determinista para la misma contraseña', () => {
        process.env.ADMIN_PASSWORD = 'x';
        const a = getAdminSessionSecret();
        const b = getAdminSessionSecret();
        expect(a).toBe(b);
    });

    it('coincide EXACTAMENTE con la derivación Web Crypto que usa el middleware Edge', async () => {
        process.env.ADMIN_PASSWORD = 'contraseña-de-prueba-🔒';
        const nodeSecret = getAdminSessionSecret();
        const webCryptoSecret = await deriveViaWebCrypto(process.env.ADMIN_PASSWORD);
        expect(nodeSecret).toBe(webCryptoSecret);
    });
});

// @vitest-environment node
// jose (HS256) needs WebCrypto (crypto.subtle), absent in the default jsdom env.
import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { jwtVerify } from 'jose';

// Mock the server-only deps so importing the module is safe under vitest.
vi.mock('next/headers', () => ({
    headers: async () => ({ get: (_k: string) => 'vidahome.es' }),
}));
vi.mock('./supabase-admin', () => ({
    supabaseAdmin: {
        from: () => ({
            select: () => ({
                eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
            }),
        }),
    },
}));

import { mintAnonTenantJwt } from './tenantClient';

const SECRET = 'test-jwt-secret-at-least-32-chars-long-000';
const VIDAHOME = '88afb7db-63ad-55dc-9668-e53e5c864fe9';
const prevSecret = process.env.SUPABASE_JWT_SECRET;

describe('mintAnonTenantJwt', () => {
    beforeEach(() => {
        process.env.SUPABASE_JWT_SECRET = SECRET;
    });
    afterAll(() => {
        if (prevSecret === undefined) delete process.env.SUPABASE_JWT_SECRET;
        else process.env.SUPABASE_JWT_SECRET = prevSecret;
    });

    it('carries the tenant_id claim + anon role so app.current_tenant_id() resolves', async () => {
        const jwt = await mintAnonTenantJwt(VIDAHOME, 'vidahome.es');
        const { payload } = await jwtVerify(jwt, new TextEncoder().encode(SECRET), {
            audience: 'authenticated',
        });
        expect(payload.tenant_id).toBe(VIDAHOME);
        expect(payload.role).toBe('anon');
        expect(payload.aud).toBe('authenticated');
        expect(payload.sub).toBe('web:vidahome.es');
        expect(typeof payload.iat).toBe('number');
        expect(typeof payload.exp).toBe('number');
        // 5-minute TTL.
        expect((payload.exp as number) - (payload.iat as number)).toBe(300);
    });

    it('enforces the signature — verification under another secret fails', async () => {
        const jwt = await mintAnonTenantJwt(VIDAHOME, 'vidahome.es');
        await expect(
            jwtVerify(jwt, new TextEncoder().encode('a-totally-different-secret-32-chars-xx')),
        ).rejects.toBeTruthy();
    });

    it('throws when SUPABASE_JWT_SECRET is missing (no silent unsigned token)', async () => {
        delete process.env.SUPABASE_JWT_SECRET;
        await expect(mintAnonTenantJwt(VIDAHOME, 'vidahome.es')).rejects.toThrow(
            /SUPABASE_JWT_SECRET/,
        );
    });

    it('defaults the sub host segment to "unknown" for an empty host', async () => {
        const jwt = await mintAnonTenantJwt(VIDAHOME, '');
        const { payload } = await jwtVerify(jwt, new TextEncoder().encode(SECRET));
        expect(payload.sub).toBe('web:unknown');
    });
});

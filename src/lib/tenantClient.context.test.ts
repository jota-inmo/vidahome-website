// @vitest-environment node
// jose (HS256) needs WebCrypto (crypto.subtle), absent in the default jsdom env.
import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { jwtVerify } from 'jose';

const SECRET = 'test-jwt-secret-at-least-32-chars-long-000';
const VIDAHOME = '88afb7db-63ad-55dc-9668-e53e5c864fe9';
const TENANT2 = '11111111-2222-3333-4444-555555555555';

// Capture the Authorization header passed to each createClient() call so we can
// decode the minted claim. plainAnonClient() passes no global headers → null.
const captured: Array<{ auth: string | null }> = [];
vi.mock('@supabase/supabase-js', () => ({
    createClient: (_url: string, _key: string, opts?: any) => {
        captured.push({ auth: opts?.global?.headers?.Authorization ?? null });
        return { __opts: opts };
    },
}));

// host → tenant lookup is driven per-test through `domainRow`.
let domainRow: { tenant_id: string } | null = null;
vi.mock('./supabase-admin', () => ({
    supabaseAdmin: {
        from: () => ({
            select: () => ({
                eq: () => ({ maybeSingle: async () => ({ data: domainRow, error: null }) }),
            }),
        }),
    },
}));

let mockHost = 'vidahome.es';
vi.mock('next/headers', () => ({
    headers: async () => ({ get: (_k: string) => mockHost }),
}));

const prevUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const prevAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const prevSecret = process.env.SUPABASE_JWT_SECRET;

describe('getPublicTenantContext / resolvePublicTenantId (host-resolved tenant)', () => {
    beforeEach(() => {
        // Top-level module consts capture env at import time → reset modules so a
        // fresh import re-reads the env we set here (and gets a fresh host cache).
        vi.resetModules();
        captured.length = 0;
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
        process.env.SUPABASE_JWT_SECRET = SECRET;
        domainRow = null;
        mockHost = 'vidahome.es';
    });

    afterAll(() => {
        if (prevUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
        else process.env.NEXT_PUBLIC_SUPABASE_URL = prevUrl;
        if (prevAnon === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = prevAnon;
        if (prevSecret === undefined) delete process.env.SUPABASE_JWT_SECRET;
        else process.env.SUPABASE_JWT_SECRET = prevSecret;
    });

    it('resolves the tenant from the Host and the client carries THAT tenant claim', async () => {
        mockHost = 'agencia2.example';
        domainRow = { tenant_id: TENANT2 };
        const mod = await import('./tenantClient');

        const { tenantId } = await mod.getPublicTenantContext();
        expect(tenantId).toBe(TENANT2);

        const auth = captured[captured.length - 1].auth;
        expect(auth?.startsWith('Bearer ')).toBe(true);
        const jwt = auth!.slice('Bearer '.length);
        const { payload } = await jwtVerify(jwt, new TextEncoder().encode(SECRET), {
            audience: 'authenticated',
        });
        expect(payload.tenant_id).toBe(TENANT2);
        expect(payload.role).toBe('anon');
    });

    it('falls back to VidaHome when the Host does not resolve to a tenant', async () => {
        mockHost = 'unknown.example';
        domainRow = null; // no mapping
        const mod = await import('./tenantClient');
        const { tenantId } = await mod.getPublicTenantContext();
        expect(tenantId).toBe(VIDAHOME);
    });

    it('resolvePublicTenantId returns the host-resolved tenant (for service-role stamping)', async () => {
        mockHost = 'agencia2.example';
        domainRow = { tenant_id: TENANT2 };
        const mod = await import('./tenantClient');
        expect(await mod.resolvePublicTenantId()).toBe(TENANT2);
    });

    it('degrades to plain anon (no Authorization header) when the secret is missing, but still resolves the tenant', async () => {
        delete process.env.SUPABASE_JWT_SECRET;
        mockHost = 'agencia2.example';
        domainRow = { tenant_id: TENANT2 };
        const mod = await import('./tenantClient');
        const { tenantId } = await mod.getPublicTenantContext();
        expect(tenantId).toBe(TENANT2);
        expect(captured[captured.length - 1].auth).toBeNull();
    });
});

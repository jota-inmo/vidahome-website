// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';

// Capture every insert the leads backup path performs.
type Row = Record<string, unknown>;
const inserts: Array<{ table: string; rows: Row[] }> = [];

vi.mock('@/lib/rate-limit', () => ({
    checkRateLimit: async () => ({ success: true }),
}));
vi.mock('@/lib/mail', () => ({
    sendNotificationEmail: async () => ({ id: 'mail-1' }),
}));
// Imported at module top (requireAdmin) — not used by submitLeadAction, but must
// be mockable so importing the action module doesn't drag in supabase-admin init.
vi.mock('@/lib/auth', () => ({
    requireAdmin: async () => true,
}));
vi.mock('@/lib/supabase-admin', () => ({
    supabaseAdmin: {
        from: () => ({
            select: () => ({
                eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
            }),
        }),
    },
}));
vi.mock('@/lib/tenantClient', () => ({
    // ref present → propertyRef !== 'General' → the cod_ofer lookup is skipped, so
    // getPublicTenantClient is only here for completeness.
    getPublicTenantClient: async () => ({
        from: () => ({
            select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }),
        }),
    }),
    getPublicTenantContext: async () => ({
        tenantId: 'tenant-uuid',
        supabase: {
            from: (table: string) => ({
                insert: async (rows: Row[]) => {
                    inserts.push({ table, rows });
                    return { error: null };
                },
            }),
        },
    }),
}));

import { submitLeadAction } from './inmovilla';

const basePayload = {
    nombre: 'Ana',
    apellidos: 'García',
    email: 'a@b.com',
    telefono: '600123456',
    mensaje: 'Interesada',
    cod_ofer: null,
};

const ENV_KEYS = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
] as const;
const prevEnv = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));

describe('submitLeadAction — leads insert', () => {
    beforeEach(() => {
        inserts.length = 0;
        // Mirror the production env: ONLY the non-public vars are set (no NEXT_PUBLIC_
        // prefix). The old `if (NEXT_PUBLIC_SUPABASE_URL && ...)` gate resolved to false
        // here and silently skipped the whole insert block — this is the bug #6 fixes.
        // getPublicTenantContext is mocked, so what's exercised is the (now absent) gate.
        delete process.env.NEXT_PUBLIC_SUPABASE_URL;
        delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
        process.env.SUPABASE_URL = 'https://example.supabase.co';
        process.env.SUPABASE_ANON_KEY = 'anon-key';
    });

    afterAll(() => {
        for (const k of ENV_KEYS) {
            if (prevEnv[k] === undefined) delete process.env[k];
            else process.env[k] = prevEnv[k];
        }
    });

    it('fires the insert even when only SUPABASE_ANON_KEY is set (no NEXT_PUBLIC_ — gate is gone)', async () => {
        const res = await submitLeadAction({ ...basePayload, ref: '3001' });

        expect(res.success).toBe(true);
        // The bug: this was 0 (block skipped). Now it must be 1.
        expect(inserts).toHaveLength(1);
        expect(inserts[0].table).toBe('leads');
        expect(inserts[0].rows[0].ref_propiedad).toBe('3001');
    });

    it('maps formData.ref → ref_propiedad and never spreads a bogus `ref` column (42703 fix)', async () => {
        const res = await submitLeadAction({ ...basePayload, ref: '2975' });

        expect(res.success).toBe(true);
        expect(inserts).toHaveLength(1);
        expect(inserts[0].table).toBe('leads');

        const row = inserts[0].rows[0];
        expect(row.ref_propiedad).toBe('2975');
        expect(row).not.toHaveProperty('ref'); // would raise 42703 against `leads`
        expect(row.tenant_id).toBe('tenant-uuid');
        expect(row.nombre).toBe('Ana');
        expect(typeof row.created_at).toBe('string');
    });

    it('stamps ref_propiedad = null when no ref was provided', async () => {
        const res = await submitLeadAction({ ...basePayload });

        expect(res.success).toBe(true);
        const row = inserts[0].rows[0];
        expect(row.ref_propiedad).toBeNull();
        expect(row).not.toHaveProperty('ref');
    });
});

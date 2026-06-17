// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

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

describe('submitLeadAction — leads backup insert', () => {
    beforeEach(() => {
        inserts.length = 0;
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
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

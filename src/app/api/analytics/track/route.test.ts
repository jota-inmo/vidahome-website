// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const RESOLVED = '11111111-2222-3333-4444-555555555555';
const inserts: Array<{ table: string; row: any }> = [];

// The route resolves the tenant + claim client via getPublicTenantContext; mock it
// to capture the inserts and assert the row carries the resolved tenant (not a
// hardcoded constant).
vi.mock('@/lib/tenantClient', () => ({
    getPublicTenantContext: async () => ({
        tenantId: RESOLVED,
        supabase: {
            from: (table: string) => ({
                insert: async (row: any) => {
                    inserts.push({ table, row });
                    return { error: null };
                },
            }),
        },
    }),
}));

import { POST } from './route';

function makeReq(body: unknown) {
    return new Request('http://agencia2.example/api/analytics/track', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
    }) as any;
}

describe('POST /api/analytics/track', () => {
    beforeEach(() => {
        inserts.length = 0;
    });

    it('stamps the resolved tenant_id on a page_view (host-resolved, not hardcoded)', async () => {
        const res = await POST(makeReq({ type: 'page_view', page_path: '/es', locale: 'es', session_id: 's1' }));
        expect(res.status).toBe(200);
        expect(inserts).toHaveLength(1);
        expect(inserts[0].table).toBe('analytics_page_views');
        expect(inserts[0].row.tenant_id).toBe(RESOLVED);
        expect(inserts[0].row.page_path).toBe('/es');
        expect(inserts[0].row.visitor_ip).toBe('client');
    });

    it('routes property_view to analytics_property_views with the claim tenant', async () => {
        const res = await POST(makeReq({ type: 'property_view', cod_ofer: 123, locale: 'en', session_id: 's2' }));
        expect(res.status).toBe(200);
        expect(inserts[0].table).toBe('analytics_property_views');
        expect(inserts[0].row.cod_ofer).toBe(123);
        expect(inserts[0].row.tenant_id).toBe(RESOLVED);
    });

    it('rejects property_view without cod_ofer (NOT NULL guard) — 400, no insert', async () => {
        const res = await POST(makeReq({ type: 'property_view', locale: 'es' }));
        expect(res.status).toBe(400);
        expect(inserts).toHaveLength(0);
    });

    it('rejects an unknown event type — 400', async () => {
        const res = await POST(makeReq({ type: 'nope', foo: 'bar' }));
        expect(res.status).toBe(400);
        expect(inserts).toHaveLength(0);
    });

    it('maps search and lead events to their tables, each carrying the resolved tenant', async () => {
        await POST(makeReq({ type: 'search', search_query: 'gandia', results_count: 5, session_id: 's3' }));
        await POST(makeReq({ type: 'lead', cod_ofer: 9, source: 'web', locale: 'es' }));
        expect(inserts[0].table).toBe('analytics_searches');
        expect(inserts[0].row.tenant_id).toBe(RESOLVED);
        expect(inserts[1].table).toBe('analytics_leads');
        expect(inserts[1].row.cod_ofer).toBe(9);
        expect(inserts[1].row.tenant_id).toBe(RESOLVED);
    });
});

/**
 * Analytics ingestion endpoint (P3.1 — Web Frente B, §5a).
 *
 * The public analytics hook (`useAnalytics`) used to insert directly into the
 * `analytics_*` tables with the plain anon client and a hardcoded VidaHome
 * `tenant_id`. The browser cannot resolve the tenant from the host nor mint a
 * tenant claim (SUPABASE_JWT_SECRET is server-only), so under strict RLS those
 * writes would be rejected. This route resolves the tenant server-side from the
 * request Host, mints the anon claim, and stamps `tenant_id` with the resolved
 * tenant — keeping analytics tenant-2 ready.
 *
 * Non-critical: analytics failures must never surface to the visitor. The hook
 * fire-and-forgets; this handler always returns 200 (even on insert error, which
 * it logs) so a transient DB hiccup doesn't spam the client console with 4xx/5xx.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getPublicTenantContext } from '@/lib/tenantClient';

const localeSchema = z.string().max(8).optional().default('es');
const sessionSchema = z.string().max(120).optional().default('');

const pageViewSchema = z.object({
    type: z.literal('page_view'),
    page_path: z.string().max(2048),
    locale: localeSchema,
    session_id: sessionSchema,
});

const propertyViewSchema = z.object({
    type: z.literal('property_view'),
    // analytics_property_views.cod_ofer is NOT NULL — require a positive number.
    cod_ofer: z.number().int().positive(),
    locale: localeSchema,
    session_id: sessionSchema,
    user_agent: z.string().max(1024).optional().default(''),
    referer: z.string().max(2048).optional().default(''),
    traffic_source: z.string().max(120).optional().default('direct'),
    utm_source: z.string().max(255).nullable().optional(),
    utm_medium: z.string().max(255).nullable().optional(),
    utm_campaign: z.string().max(255).nullable().optional(),
});

const searchSchema = z.object({
    type: z.literal('search'),
    search_query: z.string().max(500),
    locale: localeSchema,
    results_count: z.number().int().min(0).max(1_000_000).optional().default(0),
    session_id: sessionSchema,
});

const leadSchema = z.object({
    type: z.literal('lead'),
    // analytics_leads.cod_ofer is NOT NULL — require a positive number.
    cod_ofer: z.number().int().positive(),
    source: z.string().max(120).optional().default('direct'),
    locale: localeSchema,
    conversion_type: z.string().max(120).optional().default('lead'),
});

const trackSchema = z.discriminatedUnion('type', [
    pageViewSchema,
    propertyViewSchema,
    searchSchema,
    leadSchema,
]);

export async function POST(request: NextRequest) {
    let parsed;
    try {
        const rawBody = await request.json();
        const result = trackSchema.safeParse(rawBody);
        if (!result.success) {
            return NextResponse.json(
                { ok: false, error: 'Invalid analytics event' },
                { status: 400 },
            );
        }
        parsed = result.data;
    } catch {
        return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
    }

    try {
        const { supabase, tenantId } = await getPublicTenantContext();

        switch (parsed.type) {
            case 'page_view':
                await supabase.from('analytics_page_views').insert({
                    tenant_id: tenantId,
                    page_path: parsed.page_path,
                    locale: parsed.locale,
                    session_id: parsed.session_id,
                    visitor_ip: 'client', // Real IP intentionally not stored (RGPD).
                });
                break;
            case 'property_view':
                await supabase.from('analytics_property_views').insert({
                    tenant_id: tenantId,
                    cod_ofer: parsed.cod_ofer,
                    locale: parsed.locale,
                    session_id: parsed.session_id,
                    user_agent: parsed.user_agent,
                    referer: parsed.referer,
                    traffic_source: parsed.traffic_source,
                    utm_source: parsed.utm_source ?? null,
                    utm_medium: parsed.utm_medium ?? null,
                    utm_campaign: parsed.utm_campaign ?? null,
                });
                break;
            case 'search':
                await supabase.from('analytics_searches').insert({
                    tenant_id: tenantId,
                    search_query: parsed.search_query,
                    locale: parsed.locale,
                    results_count: parsed.results_count,
                    session_id: parsed.session_id,
                });
                break;
            case 'lead':
                await supabase.from('analytics_leads').insert({
                    tenant_id: tenantId,
                    cod_ofer: parsed.cod_ofer,
                    source: parsed.source,
                    locale: parsed.locale,
                    conversion_type: parsed.conversion_type,
                });
                break;
        }
    } catch (error) {
        // Non-critical: log and still return 200 so the visitor's page is never
        // affected by an analytics hiccup.
        console.warn('[Analytics] Error persisting event:', error);
    }

    return NextResponse.json({ ok: true });
}

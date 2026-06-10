/**
 * Tenant-scoped *anon* Supabase client for the public website (P3.1 — Web Frente B).
 *
 * The public site reads from Supabase with the anon key but, until now, with NO
 * tenant claim — so the RLS function `app.current_tenant_id()` resolved to NULL
 * and the transitional `claim-or-null` policies returned every tenant's rows.
 * With one tenant that's harmless; before onboarding a 2nd tenant it's a leak.
 *
 * This helper resolves the request Host → tenant (via `tenant_domains`, looked up
 * with the service role since that table has no anon policy by design — avoids a
 * domain→tenant enumeration oracle), mints a short-lived HS256 JWT carrying
 * `{ role:'anon', tenant_id }` signed with SUPABASE_JWT_SECRET, and returns a
 * Supabase client that sends it as the bearer. PostgREST verifies the signature,
 * exposes the claims as `request.jwt.claims`, and the RLS filters by tenant.
 * Mirrors the CRM's `api/_lib/tenantScopedClient.ts` (role 'authenticated' there,
 * 'anon' here).
 *
 * ── Graceful degradation (Estado 1 only) ──────────────────────────────────────
 * If SUPABASE_JWT_SECRET is absent (e.g. not yet set in the web's Vercel project),
 * we fall back to the plain anon client (no claim). Under the current TRANSITIONAL
 * policies (`tenant_id = app.current_tenant_id() OR app.current_tenant_id() IS NULL`)
 * a claimless reader still sees vidahome's rows → the public site never goes down
 * for a missing secret. This is safe ONLY while policies are transitional. When the
 * policies are tightened to STRICT (Estado 2 / Step 6), a claimless reader sees
 * NOTHING, so SUPABASE_JWT_SECRET MUST be present and verified before that step.
 *
 * Env vars (web Vercel project):
 *   - NEXT_PUBLIC_SUPABASE_URL / SUPABASE_URL   (already set)
 *   - NEXT_PUBLIC_SUPABASE_ANON_KEY (or _PUBLISHABLE_KEY / SUPABASE_ANON_KEY) (already set)
 *   - SUPABASE_SERVICE_ROLE_KEY                 (already set — used for the host lookup)
 *   - SUPABASE_JWT_SECRET                       (NEW — required for the claim to flow)
 */

import { headers } from 'next/headers';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SignJWT } from 'jose';
import { supabaseAdmin } from './supabase-admin';
import { VIDAHOME_TENANT_ID } from './tenant';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    '';
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET || '';

/** Access-token lifetime — short; a fresh JWT is minted per call. */
const ACCESS_TOKEN_TTL = '5m';

/** host → tenant_id cache (in-process, per warm lambda). TTL keeps it fresh
 *  enough to pick up a new domain mapping without a per-request DB round-trip. */
const HOST_CACHE_TTL_MS = 5 * 60 * 1000;
const hostTenantCache = new Map<string, { tenantId: string; expiresAt: number }>();

let warnedMissingSecret = false;

function normalizeHost(host: string | null | undefined): string {
    // Lowercase, trim, strip any :port suffix.
    return (host || '').toLowerCase().trim().split(':')[0];
}

/**
 * Resolve a Host header to a tenant_id via `tenant_domains` (service role, since
 * the table has no anon policy). Falls back to VidaHome on miss or error — the
 * single-tenant-safe default. (For a true multi-tenant world an unknown host
 * should arguably resolve to "no tenant"; that hardening lands with tenant-2
 * onboarding, when every live domain is guaranteed registered.)
 */
async function resolveTenantByHost(host: string): Promise<string> {
    if (!host) return VIDAHOME_TENANT_ID;

    const cached = hostTenantCache.get(host);
    if (cached && cached.expiresAt > Date.now()) return cached.tenantId;

    let tenantId = VIDAHOME_TENANT_ID;
    try {
        const { data } = await supabaseAdmin
            .from('tenant_domains')
            .select('tenant_id')
            .eq('domain', host)
            .maybeSingle();
        if (data?.tenant_id) tenantId = data.tenant_id as string;
    } catch {
        // Lookup failed — keep the VidaHome fallback (single-tenant safe).
    }
    hostTenantCache.set(host, { tenantId, expiresAt: Date.now() + HOST_CACHE_TTL_MS });
    return tenantId;
}

/**
 * Mints the signed anon tenant JWT. Exported for unit tests (claim shape is the
 * security-critical surface — a wrong `role` or missing `tenant_id` breaks RLS).
 * Reads SUPABASE_JWT_SECRET at call time so tests can set it.
 */
export async function mintAnonTenantJwt(tenantId: string, host: string): Promise<string> {
    const secret = process.env.SUPABASE_JWT_SECRET || '';
    if (!secret) throw new Error('mintAnonTenantJwt: SUPABASE_JWT_SECRET is not set');
    // payload { tenant_id, role:'anon' } + sub + aud:'authenticated' (Supabase's
    // configured audience) + iat + exp. `role:'anon'` sets the Postgres role for
    // RLS; the gateway still authenticates the request via the anon apikey header.
    return new SignJWT({ tenant_id: tenantId, role: 'anon' })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setSubject(`web:${host || 'unknown'}`)
        .setAudience('authenticated')
        .setIssuedAt()
        .setExpirationTime(ACCESS_TOKEN_TTL)
        .sign(new TextEncoder().encode(secret));
}

function plainAnonClient(): SupabaseClient {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
}

/**
 * Returns a public Supabase client whose requests carry a tenant-scoped anon JWT
 * (host-resolved). Use this for the public anon READS on tenantized tables
 * (property_metadata, fotos_inmuebles, encargos_public_view, featured_properties,
 * app_config). Service-role writes and admin paths keep using `supabaseAdmin`.
 *
 * Never throws for a missing secret — degrades to the plain anon client (see the
 * module header: safe only while policies are transitional).
 */
export async function getPublicTenantClient(): Promise<SupabaseClient> {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        // No Supabase config at all — return the plain client; the caller's query
        // will surface the real error.
        return plainAnonClient();
    }

    if (!JWT_SECRET) {
        if (!warnedMissingSecret) {
            warnedMissingSecret = true;
            console.warn(
                '[tenantClient] SUPABASE_JWT_SECRET not set — falling back to plain anon ' +
                '(no tenant claim). Safe only while RLS policies are transitional (Estado 1). ' +
                'Set it before tightening to strict (Step 6).',
            );
        }
        return plainAnonClient();
    }

    let host = '';
    try {
        const h = await headers();
        host = normalizeHost(h.get('host'));
    } catch {
        // headers() unavailable (e.g. static generation context) — fall back to
        // VidaHome via the empty-host path in resolveTenantByHost.
    }

    try {
        const tenantId = await resolveTenantByHost(host);
        const jwt = await mintAnonTenantJwt(tenantId, host);
        return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: `Bearer ${jwt}` } },
            auth: { persistSession: false, autoRefreshToken: false },
        });
    } catch (err) {
        // Mint/resolve failed unexpectedly — never take the public site down over
        // tenant scoping while policies are transitional.
        console.error('[tenantClient] mint failed, falling back to plain anon:', err);
        return plainAnonClient();
    }
}

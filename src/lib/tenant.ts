/**
 * Interim single-tenant constant — VidaHome.
 *
 * The web (inmovilla-next-app) is still single-tenant: it serves vidahome.es only.
 * Service-role writes (`supabaseAdmin`) bypass RLS, so the `tenant_id` column's
 * DEFAULT `app.current_tenant_id()` resolves to NULL (there is no JWT claim under
 * the service role) and the NOT NULL constraint rejects the row.
 *
 * Until the web gains per-request tenant resolution (P3.1 web workstream), any
 * service-role writer that inserts/upserts into a tenantized table MUST stamp this
 * constant explicitly.
 *
 * uuid v5 — matches the CRM `tenants` table seed (VidaHome, kind=paying).
 * DO NOT change without coordinating the database seed.
 */
export const VIDAHOME_TENANT_ID = '88afb7db-63ad-55dc-9668-e53e5c864fe9';

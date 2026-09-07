/**
 * POST /api/revalidate
 *
 * On-demand ISR revalidation hook. Called by the CRM's inmovilla-push
 * backend whenever the wizard mutates something that should reflect on
 * vidahome.es immediately — starting with the photo reorder flow (the
 * wizard's drag&drop → fotos_inmuebles + property_metadata sync).
 *
 * Request body: { path: string } — the Next.js route path to invalidate
 * (e.g. "/propiedades/2975" or "/es/propiedades/2975"). Must start with
 * "/", otherwise rejected with 400.
 *
 * Authentication:
 *   - If REVALIDATE_SECRET env var is set, the body must also contain
 *     { secret: string } matching it exactly.
 *   - If not set, the endpoint is open (fail-open) and every call is
 *     logged with a loud warning — audit 2026-09-05 (M-1) found this open
 *     by default lets anyone force cache invalidation in a loop (cheap
 *     DoS: each call is a Supabase round-trip + page regeneration). The
 *     CRM side (publishToWebHelper.ts / syncPhotosToWeb.ts) already sends
 *     `secret: process.env.REVALIDATE_SECRET` whenever it's configured
 *     there — setting the SAME value as `REVALIDATE_SECRET` on both this
 *     project and the CRM's Vercel project closes the gap with zero code
 *     change. Not flipped to hard fail-closed here because doing so before
 *     that env var exists on both sides would silently break the
 *     CRM→web sync pipeline in production.
 *
 * The endpoint supports both single-locale paths (`/propiedades/2975`)
 * and locale-prefixed paths (`/es/propiedades/2975`). To keep the CRM
 * side simple, callers can pass the unprefixed path; this handler then
 * invalidates all locale variants via revalidatePath so no matter what
 * locale the user viewed, the next request regenerates.
 */

import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

const LOCALES = ['es', 'en', 'fr', 'de', 'it', 'pl'];

export async function POST(req: NextRequest) {
    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
    }

    const { path, secret } = (body || {}) as { path?: unknown; secret?: unknown };

    if (typeof path !== 'string' || !path.startsWith('/')) {
        return NextResponse.json({ error: 'path_required' }, { status: 400 });
    }

    const expectedSecret = process.env.REVALIDATE_SECRET;
    if (expectedSecret) {
        if (secret !== expectedSecret) {
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
        }
    } else {
        // Ver comentario del fichero — fail-open intencional hasta que el
        // operador configure REVALIDATE_SECRET en ambos proyectos. Log
        // ruidoso para que no pase desapercibido en los runtime logs.
        console.warn('[revalidate] REVALIDATE_SECRET no configurada — endpoint sin autenticar. Ver comentario del fichero (auditoría 2026-09-05, M-1).');
    }

    // Invalidate the raw path PLUS every locale-prefixed variant so the
    // CRM caller doesn't have to know which locale the end user viewed.
    // revalidatePath is idempotent and cheap — cost is a single cache
    // tag invalidation per path, not an immediate regeneration.
    const paths = [path, ...LOCALES.map((l) => `/${l}${path}`)];
    for (const p of paths) {
        try {
            revalidatePath(p);
        } catch (err) {
            console.warn('[revalidate] failed for', p, err);
        }
    }

    return NextResponse.json({ revalidated: true, paths });
}

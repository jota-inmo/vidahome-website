import { fetchFichaDescriptionsAction } from '@/app/actions/sync-properties';
import { translatePropertiesAction } from '@/app/actions/translate-perplexity';
import { requireAdmin } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * POST /api/admin/fetch-ficha
 * Body: { refs: string[] }
 *
 * 1. Fetches description_es from Inmovilla ficha (via Arsys proxy) for the given refs.
 * 2. Automatically translates to EN/FR/DE/IT/PL via Perplexity for any ref that got a description.
 */
export async function POST(req: NextRequest) {
    if (!(await requireAdmin())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let refs: string[] = [];
    try {
        const body = await req.json();
        refs = Array.isArray(body.refs) ? body.refs : [];
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (refs.length === 0) {
        return NextResponse.json({ error: 'refs array is required' }, { status: 400 });
    }

    // Step 1 — fetch description_es from ficha
    const fichaResult = await fetchFichaDescriptionsAction(refs);

    if (!fichaResult.success) {
        return NextResponse.json({ error: fichaResult.error }, { status: 500 });
    }

    // Step 2 — translate to all other langs (only refs that got a description)
    let translated = 0;
    let translateError: string | undefined;
    if (fichaResult.fetched > 0 && fichaResult.updatedIds?.length) {
        try {
            const transResult = await translatePropertiesAction(
                fichaResult.updatedIds.map(String),
                fichaResult.updatedIds.length,
                ['en', 'fr', 'de', 'it', 'pl']
            );
            translated = transResult.translated;
        } catch (e: any) {
            translateError = e.message;
        }
    }

    return NextResponse.json({
        ...fichaResult,
        translated,
        translateError,
        message: [
            `✅ ${fichaResult.fetched} descripción(es) ES obtenidas.`,
            fichaResult.fetched > 0 ? `🌐 ${translated} traducidas a EN/FR/DE/IT/PL.` : '',
            fichaResult.missing > 0 ? `⚠️ ${fichaResult.missing} sin descripción en Inmovilla.` : '',
            translateError ? `⚠️ Error traduciendo: ${translateError}` : '',
        ].filter(Boolean).join(' '),
    });
}

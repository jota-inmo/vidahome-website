import { fetchFichaDescriptionsAction } from '@/app/actions/sync-properties';
import { requireAdmin } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/admin/fetch-ficha
 * Body: { refs: string[] }
 *
 * Fetches ficha descriptions from Inmovilla (via Arsys proxy) for the given refs
 * and saves description_es to property_metadata + properties backup table.
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

    const result = await fetchFichaDescriptionsAction(refs);

    if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
        ...result,
        message: `✅ ${result.fetched} descripciones obtenidas. Sin descripción: ${result.missing}`,
    });
}

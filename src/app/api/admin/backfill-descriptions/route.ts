import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: Request) {
    try {
        const { supabaseAdmin } = await import('@/lib/supabase-admin');
        const { InmovillaWebApiService } = await import('@/lib/api/web-service');

        const body = await request.json().catch(() => ({}));
        const batchSize: number = body.batchSize ?? 10;

        const {
            INMOVILLA_NUMAGENCIA,
            INMOVILLA_PASSWORD,
            INMOVILLA_ADDNUMAGENCIA,
            INMOVILLA_DOMAIN,
            INMOVILLA_LANG,
        } = process.env;

        if (!INMOVILLA_NUMAGENCIA || !INMOVILLA_PASSWORD) {
            return NextResponse.json({ error: 'Inmovilla credentials not configured' }, { status: 500 });
        }

        const api = new InmovillaWebApiService(
            INMOVILLA_NUMAGENCIA,
            INMOVILLA_PASSWORD,
            INMOVILLA_ADDNUMAGENCIA || '',
            parseInt(INMOVILLA_LANG || '1', 10),
            '',
            INMOVILLA_DOMAIN || 'vidahome-website.vercel.app'
        );

        // Get active properties with empty description_es
        const { data: props } = await supabaseAdmin
            .from('property_metadata')
            .select('cod_ofer, ref, descriptions')
            .eq('nodisponible', false)
            .limit(batchSize * 3); // over-fetch then filter

        if (!props) return NextResponse.json({ error: 'No properties found' }, { status: 500 });

        const needsDesc = props
            .filter((p: any) => {
                const es = (p.descriptions?.description_es || '').trim();
                return !es;
            })
            .slice(0, batchSize);

        if (needsDesc.length === 0) {
            return NextResponse.json({ success: true, message: 'All properties already have description_es', remaining: 0 });
        }

        let success = 0;
        let failed = 0;
        const results: string[] = [];

        for (const prop of needsDesc) {
            try {
                const details = await api.getPropertyDetails(prop.cod_ofer);
                const description = details?.descripciones || '';

                if (!description) {
                    results.push(`${prop.cod_ofer}: no description in API`);
                    failed++;
                    continue;
                }

                const existing = prop.descriptions || {};
                await supabaseAdmin
                    .from('property_metadata')
                    .update({ descriptions: { ...existing, description_es: description } })
                    .eq('cod_ofer', prop.cod_ofer);

                results.push(`${prop.cod_ofer}: ✓`);
                success++;
            } catch (e: any) {
                results.push(`${prop.cod_ofer}: error — ${e.message?.substring(0, 60)}`);
                failed++;
            }
        }

        // Count remaining
        const { count: remaining } = await supabaseAdmin
            .from('property_metadata')
            .select('cod_ofer', { count: 'exact', head: true })
            .eq('nodisponible', false)
            .filter('descriptions->>description_es', 'eq', '');

        return NextResponse.json({
            success: true,
            processed: needsDesc.length,
            ok: success,
            failed,
            remaining: remaining ?? '?',
            results,
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

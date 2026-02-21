import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

/**
 * Admin endpoint: Bulk sync all property descriptions from Inmovilla to Supabase.
 * This populates the property_metadata table so the catalog can show descriptions.
 *
 * Usage: POST /api/admin/sync-descriptions
 * Headers: x-admin-secret: <INMOVILLA_DEBUG_SECRET or 'vidahome_sync_2026'>
 *
 * This calls ficha for each property one by one, with a small delay to avoid
 * overwhelming the Inmovilla API. Returns a summary when done.
 */
export async function POST(request: Request) {
    const headerList = await headers();
    const secret = headerList.get('x-admin-secret') || '';

    if (secret !== 'vidahome_sync_2026' && secret !== process.env.INMOVILLA_DEBUG_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const numagencia = process.env.INMOVILLA_AGENCIA;
    const addnumagencia = process.env.INMOVILLA_ADDAGENCIA || '';
    const password = process.env.INMOVILLA_PASSWORD;
    const domain = process.env.INMOVILLA_DOMAIN || 'vidahome.es';

    if (!numagencia || !password) {
        return NextResponse.json({ error: 'Inmovilla credentials not configured' }, { status: 500 });
    }

    try {
        // Get public IP for Inmovilla auth
        let clientIp = '127.0.0.1';
        try {
            const ipRes = await fetch('https://api.ipify.org?format=json');
            if (ipRes.ok) clientIp = (await ipRes.json()).ip;
        } catch { }

        const { InmovillaWebApiService } = await import('@/lib/api/web-service');
        const { supabaseAdmin } = await import('@/lib/supabase-admin');

        // Step 1: Get the full property list (paginacion - fast, no descriptions)
        const listService = new InmovillaWebApiService(numagencia, password, addnumagencia, 1, clientIp, domain);
        const allProperties = await listService.getProperties({ page: 1 });

        console.log(`[SyncDescriptions] Found ${allProperties.length} properties. Starting sync...`);

        let synced = 0;
        let skipped = 0;
        let failed = 0;
        const errors: string[] = [];

        // Step 2: For each property, call ficha to get the description
        for (const prop of allProperties) {
            if (!prop.cod_ofer || isNaN(prop.cod_ofer)) {
                skipped++;
                continue;
            }

            try {
                const detailService = new InmovillaWebApiService(numagencia, password, addnumagencia, 1, clientIp, domain);
                const details = await detailService.getPropertyDetails(prop.cod_ofer);

                if (details?.descripciones && details.descripciones.length > 20) {
                    await supabaseAdmin.from('property_metadata').upsert({
                        cod_ofer: details.cod_ofer,
                        ref: details.ref || String(prop.cod_ofer),
                        description: details.descripciones,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'cod_ofer' });
                    synced++;
                    console.log(`[SyncDescriptions] ✓ Synced property ${details.cod_ofer}`);
                } else {
                    skipped++;
                    console.log(`[SyncDescriptions] - Skipped property ${prop.cod_ofer} (no description)`);
                }

                // Small delay to be nice to the Inmovilla API
                await new Promise(resolve => setTimeout(resolve, 150));
            } catch (propError: any) {
                failed++;
                errors.push(`cod_ofer=${prop.cod_ofer}: ${propError.message}`);
                console.error(`[SyncDescriptions] ✗ Failed property ${prop.cod_ofer}:`, propError.message);
            }
        }

        const summary = {
            total: allProperties.length,
            synced,
            skipped,
            failed,
            errors: errors.slice(0, 10) // max 10 error samples
        };

        console.log('[SyncDescriptions] Done:', summary);
        return NextResponse.json({ success: true, summary }, { status: 200 });

    } catch (error: any) {
        console.error('[SyncDescriptions] Fatal error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

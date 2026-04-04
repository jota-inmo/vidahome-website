import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createCatastroClient } from '@/lib/api/catastro';

export const maxDuration = 300; // 5 min — Vercel Pro

/**
 * POST /api/admin/backfill-construction-year
 *
 * Backfills ano_construccion in property_features using Catastro API.
 * Uses the referencia catastral stored in Inmovilla full_data.
 *
 * Strategy:
 * 1. Find active properties without ano_construccion
 * 2. Extract referencia catastral from full_data
 * 3. Query Catastro by RC → get anoConstruccion
 * 4. Update property_features
 *
 * Processes 5 properties per call with 10s delays.
 * Call repeatedly until remaining = 0.
 */
// GET for Vercel Cron, POST for manual calls
export async function GET(request: NextRequest) {
    return handleBackfill(request);
}
export async function POST(request: NextRequest) {
    return handleBackfill(request);
}

async function handleBackfill(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const adminPassword = process.env.ADMIN_PASSWORD;

    const token = authHeader?.replace('Bearer ', '');
    if (token !== cronSecret && token !== adminPassword) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const BATCH_SIZE = 5;
    const DELAY_MS = 10000; // 10s between Catastro calls

    try {
        // Find properties without ano_construccion (0 = already tried, skip those too)
        const { data: properties, error: fetchError } = await supabaseAdmin
            .from('property_features')
            .select('cod_ofer')
            .is('ano_construccion', null)
            .eq('nodisponible', false)
            .limit(BATCH_SIZE);

        if (fetchError) throw fetchError;

        if (!properties || properties.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'Todas las propiedades ya tienen año de construcción.',
                processed: 0,
                remaining: 0,
            });
        }

        // Count remaining
        const { count: remaining } = await supabaseAdmin
            .from('property_features')
            .select('cod_ofer', { count: 'exact', head: true })
            .is('ano_construccion', null)
            .eq('nodisponible', false);

        // Get full_data for these properties
        const codOfers = properties.map((p: any) => p.cod_ofer);
        const { data: metadataRows } = await supabaseAdmin
            .from('property_metadata')
            .select('cod_ofer, ref, full_data, poblacion')
            .in('cod_ofer', codOfers);

        const catastro = createCatastroClient();
        let updated = 0;
        let skipped = 0;
        let errors = 0;
        const details: string[] = [];

        for (const meta of metadataRows || []) {
            const fd = meta.full_data || {};
            const ref = meta.ref || meta.cod_ofer;

            // Try to find referencia catastral in full_data
            // Inmovilla may store it as: refcatastral, ref_catastral, catastro, referencia_catastral
            const rc = fd.refcatastral || fd.ref_catastral || fd.catastro ||
                fd.referencia_catastral || fd.refCatastral || fd.num_catastro || '';

            if (!rc || rc.length < 14) {
                // No RC available — try by address as fallback
                const calle = fd.calle || fd.direccion || '';
                const poblacion = meta.poblacion || fd.poblacion || '';

                if (!calle && !poblacion) {
                    details.push(`${ref}: sin RC ni dirección, saltado`);
                    skipped++;
                    await supabaseAdmin
                        .from('property_features')
                        .update({ ano_construccion: 0 })
                        .eq('cod_ofer', meta.cod_ofer);
                    continue;
                }

                // Try Catastro by address
                try {
                    const result = await catastro.searchByAddress({
                        provincia: fd.provincia || poblacion,
                        municipio: poblacion,
                        via: calle,
                        numero: fd.numero || fd.num || '1',
                    });

                    if (result.found && result.properties.length > 0) {
                        const withYear = result.properties.find((p: any) => p.anoConstruccion && p.anoConstruccion > 1800);
                        if (withYear?.anoConstruccion) {
                            await supabaseAdmin
                                .from('property_features')
                                .update({ ano_construccion: withYear.anoConstruccion })
                                .eq('cod_ofer', meta.cod_ofer);
                            details.push(`${ref}: ${withYear.anoConstruccion} (por dirección: ${poblacion}, ${calle})`);
                            updated++;
                        } else {
                            await supabaseAdmin
                                .from('property_features')
                                .update({ ano_construccion: 0 })
                                .eq('cod_ofer', meta.cod_ofer);
                            details.push(`${ref}: Catastro sin año (${poblacion}, ${calle})`);
                            skipped++;
                        }
                    } else {
                        await supabaseAdmin
                            .from('property_features')
                            .update({ ano_construccion: 0 })
                            .eq('cod_ofer', meta.cod_ofer);
                        details.push(`${ref}: no encontrado en Catastro (${poblacion}, ${calle})`);
                        skipped++;
                    }
                } catch (err: any) {
                    details.push(`${ref}: error dirección — ${err.message?.substring(0, 80)}`);
                    errors++;
                    await supabaseAdmin
                        .from('property_features')
                        .update({ ano_construccion: 0 })
                        .eq('cod_ofer', meta.cod_ofer);
                }

                await new Promise(r => setTimeout(r, DELAY_MS));
                continue;
            }

            // We have a referencia catastral — use it directly
            try {
                const cleanRc = rc.replace(/\s/g, '').toUpperCase();
                const result = await catastro.getPropertyDetails(cleanRc);

                if (result?.anoConstruccion && result.anoConstruccion > 1800) {
                    await supabaseAdmin
                        .from('property_features')
                        .update({ ano_construccion: result.anoConstruccion })
                        .eq('cod_ofer', meta.cod_ofer);
                    details.push(`${ref}: ${result.anoConstruccion} (RC: ${cleanRc.substring(0, 14)}...)`);
                    updated++;
                } else {
                    await supabaseAdmin
                        .from('property_features')
                        .update({ ano_construccion: 0 })
                        .eq('cod_ofer', meta.cod_ofer);
                    details.push(`${ref}: RC encontrada pero sin año (${cleanRc.substring(0, 14)})`);
                    skipped++;
                }
            } catch (err: any) {
                details.push(`${ref}: error RC — ${err.message?.substring(0, 80)}`);
                errors++;
                await supabaseAdmin
                    .from('property_features')
                    .update({ ano_construccion: 0 })
                    .eq('cod_ofer', meta.cod_ofer);
            }

            // Generous delay
            await new Promise(r => setTimeout(r, DELAY_MS));
        }

        console.log(`[Backfill] ano_construccion: ${updated} ok, ${skipped} sin dato, ${errors} err. ~${Math.max(0, (remaining || 0) - BATCH_SIZE)} quedan.`);

        return NextResponse.json({
            success: true,
            processed: (metadataRows || []).length,
            updated,
            skipped,
            errors,
            remaining: Math.max(0, (remaining || 0) - BATCH_SIZE),
            details,
        });
    } catch (error: any) {
        console.error('[Backfill] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

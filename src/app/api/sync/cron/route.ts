import { syncDeltaAction } from '@/app/actions/sync-properties';
import { translatePropertiesGeminiAction } from '@/app/actions/translate-gemini';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { InmovillaWebApiService } from '@/lib/api/web-service';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const { INMOVILLA_LANG, INMOVILLA_NUMAGENCIA, INMOVILLA_PASSWORD, INMOVILLA_ADDNUMAGENCIA } = process.env;

/**
 * GET /api/sync/cron
 * Called by Vercel Cron every 30 minutes.
 * 1. Delta sync: detects new, removed, and reactivated properties.
 * 2. Photo refresh: updates full_data + photos for properties with main_photo = NULL.
 */
export async function GET(request: NextRequest) {
    // Verify Vercel cron secret (mandatory)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // ── Step 1: Delta sync ──────────────────────────────────────
        const result = await syncDeltaAction();

        if (!result.success) {
            console.error('[Cron] Delta sync failed:', result.error);
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        const parts = [];
        if (result.added) parts.push(`${result.added} nuevas`);
        if (result.removed) parts.push(`${result.removed} inactivas`);
        if (result.reactivated) parts.push(`${result.reactivated} reactivadas`);

        // ── Step 2: Refresh photos for properties with main_photo = NULL ─
        let photosRefreshed = 0;

        if (INMOVILLA_NUMAGENCIA && INMOVILLA_PASSWORD) {
            // Skip CRM-owned rows: those are managed by the CRM's
            // publish_to_web flow and must not be overwritten by Inmovilla.
            const { data: needsPhotos } = await supabaseAdmin
                .from('property_metadata')
                .select('cod_ofer, ref')
                .is('main_photo', null)
                .eq('nodisponible', false)
                .neq('source', 'crm')
                .not('cod_ofer', 'is', null)
                .limit(3);

            if (needsPhotos && needsPhotos.length > 0) {
                const api = new InmovillaWebApiService(
                    INMOVILLA_NUMAGENCIA,
                    INMOVILLA_PASSWORD,
                    INMOVILLA_ADDNUMAGENCIA || '',
                    parseInt(INMOVILLA_LANG || '1', 10),
                    '127.0.0.1',
                    'vidahome.es'
                );

                for (const prop of needsPhotos) {
                    try {
                        const detail = await api.getPropertyDetails(prop.cod_ofer);
                        if (!detail) continue;

                        const raw = detail as any;
                        const numfotos = parseInt(raw.numfotos) || 0;
                        const numagencia = raw.numagencia;
                        const fotoletra = raw.fotoletra;

                        if (numfotos > 0 && numagencia && fotoletra) {
                            const photos: string[] = [];
                            for (let i = 1; i <= numfotos; i++) {
                                photos.push(`https://fotos15.inmovilla.com/${numagencia}/${prop.cod_ofer}/${fotoletra}-${i}.jpg`);
                            }
                            await supabaseAdmin
                                .from('property_metadata')
                                .update({ photos, main_photo: photos[0], full_data: raw, updated_at: new Date().toISOString() })
                                .eq('cod_ofer', prop.cod_ofer);
                            photosRefreshed++;
                        } else {
                            // No photos available — mark as 'none' to skip next time
                            await supabaseAdmin
                                .from('property_metadata')
                                .update({ main_photo: 'none' })
                                .eq('cod_ofer', prop.cod_ofer);
                        }
                    } catch (e: any) {
                        console.warn(`[Cron] Photo refresh failed for ${prop.ref}:`, e.message);
                    }
                }
            }
        }

        if (photosRefreshed > 0) parts.push(`${photosRefreshed} fotos actualizadas`);

        // ── Step 3: Auto-translate missing descriptions (Gemini) ──
        let translationsResult = { translated: 0, errors: 0 };

        try {
            translationsResult = await translatePropertiesGeminiAction(
                undefined, // all pending
                2,         // max 2 properties per cron (= ~10 API calls, well within free tier)
            );

            if (translationsResult.translated > 0) {
                parts.push(`${translationsResult.translated} traducidas`);
            }
            if (translationsResult.errors > 0) {
                console.warn(`[Cron] Translation errors: ${translationsResult.errors}`);
            }
        } catch (e: any) {
            console.warn('[Cron] Auto-translate failed:', e.message);
        }

        const message = parts.length
            ? `${parts.join(', ')}. Sin cambios: ${result.unchanged}`
            : `Sin cambios (${result.unchanged} propiedades al dia)`;

        console.log(`[Cron] ${message}`);

        return NextResponse.json({
            ...result,
            photos_refreshed: photosRefreshed,
            translations: translationsResult,
            message,
        });
    } catch (error: any) {
        console.error('[Cron] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

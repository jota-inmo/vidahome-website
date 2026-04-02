import { syncDeltaAction } from '@/app/actions/sync-properties';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/sync/cron
 * Called by Vercel Cron every 30 minutes.
 * Runs delta sync: detects new, removed, and reactivated properties in Inmovilla.
 */
export async function GET(request: NextRequest) {
    // Verify Vercel cron secret (if configured)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const result = await syncDeltaAction();

        if (!result.success) {
            console.error('[Cron] Delta sync failed:', result.error);
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        const parts = [];
        if (result.added) parts.push(`${result.added} nuevas`);
        if (result.removed) parts.push(`${result.removed} inactivas`);
        if (result.reactivated) parts.push(`${result.reactivated} reactivadas`);

        const message = parts.length
            ? `${parts.join(', ')}. Sin cambios: ${result.unchanged}`
            : `Sin cambios (${result.unchanged} propiedades al dia)`;

        console.log(`[Cron] ${message}`);

        return NextResponse.json({ ...result, message });
    } catch (error: any) {
        console.error('[Cron] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

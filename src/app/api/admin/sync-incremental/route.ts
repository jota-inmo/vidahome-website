import { syncPropertiesIncrementalAction } from '@/app/actions/inmovilla';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

/**
 * API endpoint for incremental property syncing
 * Requires admin session cookie.
 */
export async function GET(request: NextRequest) {
    try {
        if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Get batch size from query params (default 8 for 2-minute interval)
        const url = new URL(request.url);
        const batchSize = Math.min(parseInt(url.searchParams.get('batchSize') || '8'), 30);

        // Call incremental sync
        const result = await syncPropertiesIncrementalAction(batchSize);

        console.log('[API] Sync result:', result);

        return NextResponse.json(
            {
                success: result.success,
                synced: result.synced,
                total: result.total,
                isComplete: result.isComplete,
                message: result.isComplete 
                    ? '✅ All properties synced successfully!'
                    : `Synced ${result.synced} properties. ${result.total - (result.synced)} remaining.`,
                error: result.error
            },
            { status: result.success ? 200 : 500 }
        );
    } catch (error: any) {
        console.error('[API] Sync incremental error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST for manual trigger
 */
export async function POST(request: NextRequest) {
    try {
        if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const body = await request.json().catch(() => ({}));
        const batchSize = Math.min(body.batchSize || 8, 30);

        const result = await syncPropertiesIncrementalAction(batchSize);

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('[API] POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

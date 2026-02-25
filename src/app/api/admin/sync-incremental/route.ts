import { syncPropertiesIncrementalAction } from '@/app/actions/inmovilla';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint for incremental property syncing
 * 
 * Call this from a cron job every 30 seconds to sync properties in batches
 * 
 * Usage:
 * - GET /api/admin/sync-incremental
 * - GET /api/admin/sync-incremental?batchSize=20
 * 
 * Security: Requires SYNC_SECRET in Authorization header
 * Example: curl -H "Authorization: Bearer YOUR_SYNC_SECRET" https://vidahome-website.vercel.app/api/admin/sync-incremental
 */
export async function GET(request: NextRequest) {
    try {
        // Security: Verify sync secret
        const authHeader = request.headers.get('authorization');
        const syncSecret = process.env.SYNC_SECRET;

        if (syncSecret && (!authHeader || !authHeader.includes(syncSecret))) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get batch size from query params (default 10)
        const url = new URL(request.url);
        const batchSize = Math.min(parseInt(url.searchParams.get('batchSize') || '10'), 30);

        // Call incremental sync
        const result = await syncPropertiesIncrementalAction(batchSize);

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
        // Verify sync secret
        const authHeader = request.headers.get('authorization');
        const syncSecret = process.env.SYNC_SECRET;

        if (syncSecret && (!authHeader || !authHeader.includes(syncSecret))) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json().catch(() => ({}));
        const batchSize = Math.min(body.batchSize || 10, 30);

        const result = await syncPropertiesIncrementalAction(batchSize);

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

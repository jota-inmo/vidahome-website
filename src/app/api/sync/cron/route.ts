/**
 * Scheduled sync endpoint for Vercel Cron
 * Runs once per day at 7 AM Madrid time to sync properties from Inmovilla
 * 
 * Setup:
 * 1. vercel.json cron schedule: "0 6 * * *" (6 AM UTC = 7 AM Madrid in winter, 8 AM in summer)
 * 2. Deploy to Vercel
 * 3. Check logs in Vercel Dashboard ➜ Function Logs ➜ Crons
 */

import { syncPropertiesFromInmovillaAction } from '@/app/actions/inmovilla';

export const runtime = 'nodejs';

interface CronResponse {
  success: boolean;
  timestamp: string;
  synced: number;
  error?: string;
}

export async function GET(request: Request): Promise<Response> {
  try {
    // Verify request from Vercel
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Cron] Starting scheduled property sync from Inmovilla...');

    // Execute the sync
    const result = await syncPropertiesFromInmovillaAction();

    const response: CronResponse = {
      success: result.success,
      timestamp: new Date().toISOString(),
      synced: result.synced || 0,
      ...(result.error && { error: result.error }),
    };

    console.log('[Cron] Sync completed:', response);

    return Response.json(response, {
      status: result.success ? 200 : 500,
    });
  } catch (error) {
    console.error('[Cron] Error:', error);

    return Response.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        synced: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}


import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * Rate Limiter for public forms using Supabase.
 * In a serverless environment (Vercel), memory-based limits don't work well.
 * We use a dedicated table or check against existing submissions.
 */

export interface RateLimitConfig {
    key: string;      // Identifier for the action (e.g., 'submit_lead')
    limit: number;    // Max attempts
    windowMs: number; // Time window in milliseconds
}

export async function checkRateLimit(config: RateLimitConfig): Promise<{ success: boolean; remaining: number }> {
    const headerList = await headers();
    const ip = headerList.get('x-forwarded-for')?.split(',')[0] ||
        headerList.get('x-real-ip') ||
        '127.0.0.1';

    const identifier = `${config.key}:${ip}`;
    const now = new Date();
    const windowStart = new Date(now.getTime() - config.windowMs);

    try {
        // We can use a dedicated rate_limits table if it exists, 
        // but for now let's query the specific lead tables based on IP if possible.
        // Since the lead tables don't have IP yet, let's use a generic rate_limits table.
        // If the table doesn't exist, this will fail gracefully or we create it.

        const { data, error } = await supabaseAdmin
            .from('rate_limits')
            .select('*')
            .eq('identifier', identifier)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
            console.warn('[RateLimit] Error checking rate limit:', error);
            return { success: false, remaining: 0 }; // Fail CLOSED — deny on error
        }

        if (!data) {
            // First attempt
            await supabaseAdmin.from('rate_limits').insert([
                {
                    identifier,
                    count: 1,
                    last_attempt: now.toISOString(),
                    reset_at: new Date(now.getTime() + config.windowMs).toISOString()
                }
            ]);
            return { success: true, remaining: config.limit - 1 };
        }

        const lastAttempt = new Date(data.last_attempt);
        const resetAt = new Date(data.reset_at);

        if (now > resetAt) {
            // Window expired, reset
            await supabaseAdmin
                .from('rate_limits')
                .update({
                    count: 1,
                    last_attempt: now.toISOString(),
                    reset_at: new Date(now.getTime() + config.windowMs).toISOString()
                })
                .eq('identifier', identifier);
            return { success: true, remaining: config.limit - 1 };
        }

        if (data.count >= config.limit) {
            return { success: false, remaining: 0 };
        }

        // Increment count
        await supabaseAdmin
            .from('rate_limits')
            .update({
                count: data.count + 1,
                last_attempt: now.toISOString()
            })
            .eq('identifier', identifier);

        return { success: true, remaining: config.limit - (data.count + 1) };

    } catch (e) {
        console.error('[RateLimit] Critical failure:', e);
        return { success: false, remaining: 0 }; // Fail CLOSED — deny on error
    }
}

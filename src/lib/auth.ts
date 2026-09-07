import { cookies } from 'next/headers';
import crypto from 'crypto';
import { getAdminSessionSecret } from './adminSessionSecret';

/**
 * Verify admin session from cookies.
 * Reusable across server actions and API routes.
 * Returns true if the caller is an authenticated admin.
 */
export async function requireAdmin(): Promise<boolean> {
    const COOKIE_NAME = 'admin_session';
    // Auditoría 2026-09-05 (B-10): secreto derivado, ya no el password en claro.
    const secret = getAdminSessionSecret();

    const session = (await cookies()).get(COOKIE_NAME);
    if (!session?.value || !secret) return false;

    const token = session.value;
    const TOKEN_SEPARATOR = '.';
    if (!token.includes(TOKEN_SEPARATOR)) return false;

    const lastDotIndex = token.lastIndexOf(TOKEN_SEPARATOR);
    const payload = token.substring(0, lastDotIndex);
    const signature = token.substring(lastDotIndex + 1);

    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

    try {
        return crypto.timingSafeEqual(
            Buffer.from(signature, 'hex'),
            Buffer.from(expectedSignature, 'hex')
        );
    } catch {
        return false;
    }
}

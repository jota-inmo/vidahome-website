import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';

const cookieStore = { value: undefined as string | undefined };
vi.mock('next/headers', () => ({
    cookies: async () => ({ get: () => (cookieStore.value ? { value: cookieStore.value } : undefined) }),
}));

import { requireAdmin } from './auth';
import { getAdminSessionSecret } from './adminSessionSecret';

function token(issuedAt: number): string {
    const payload = `admin:${issuedAt}`;
    const sig = crypto.createHmac('sha256', getAdminSessionSecret()).update(payload).digest('hex');
    return `${payload}.${sig}`;
}

describe('requireAdmin', () => {
    beforeEach(() => {
        process.env.ADMIN_PASSWORD = 'test-password';
        cookieStore.value = undefined;
    });

    it('acepta una sesión reciente', async () => {
        cookieStore.value = token(Date.now() - 60_000);
        expect(await requireAdmin()).toBe(true);
    });

    it('rechaza una sesión firmada correctamente pero de hace 25 h', async () => {
        cookieStore.value = token(Date.now() - 25 * 60 * 60 * 1000);
        expect(await requireAdmin()).toBe(false);
    });

    it('rechaza sin cookie o con firma falsa', async () => {
        expect(await requireAdmin()).toBe(false);
        cookieStore.value = `admin:${Date.now()}.deadbeef`;
        expect(await requireAdmin()).toBe(false);
    });
});

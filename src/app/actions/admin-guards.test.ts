import { describe, it, expect, vi, beforeEach } from 'vitest';

// Tripwire: toda action que usa supabaseAdmin con fines admin debe empezar
// con requireAdmin(). Sin sesiÃ³n, NO puede tocarse supabaseAdmin.
// Con claves presentes, sin guarda estas actions llegarían a supabaseAdmin
// (si no, saldrían antes por "API key not configured" y el test sería falso verde).
process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test';
process.env.GEMINI_API_KEY = 'test';
process.env.PERPLEXITY_API_KEY = 'test';
const adminTouched = vi.fn();
vi.mock('@/lib/supabase-admin', () => ({
    supabaseAdmin: new Proxy({}, { get: () => { adminTouched(); throw new Error('supabaseAdmin usado sin sesiÃ³n'); } }),
}));
vi.mock('@/lib/auth', () => ({ requireAdmin: async () => false }));
vi.mock('next/cache', () => ({ revalidateTag: vi.fn(), revalidatePath: vi.fn() }));

import * as blog from './blog';
import * as analytics from './analytics';
import * as translations from './translations';
import * as translateBlog from './translate-blog';
import * as translateHero from './translate-hero';
import * as translateGemini from './translate-gemini';
import * as translatePerplexity from './translate-perplexity';

const form = new FormData();
form.set('file', new File(['x'], 'x.png', { type: 'image/png' }));
const post = { title: 't', slug: 's', content: 'c', excerpt: 'e', locale: 'es' } as never;

const cases: Array<[string, () => Promise<unknown>]> = [
    ['getAdminBlogPostsAction', () => blog.getAdminBlogPostsAction('es')],
    ['createBlogPostAction', () => blog.createBlogPostAction(post)],
    ['updateBlogPostAction', () => blog.updateBlogPostAction('1', post)],
    ['deleteBlogPostAction', () => blog.deleteBlogPostAction('1')],
    ['uploadBlogImageAction', () => blog.uploadBlogImageAction(form)],
    ['getAnalyticsDashboard', () => analytics.getAnalyticsDashboard(30)],
    ['getPropertiesForTranslationAction', () => translations.getPropertiesForTranslationAction()],
    ['translateBlogPostAction', () => translateBlog.translateBlogPostAction()],
    ['translateBlogContentAction', () => translateBlog.translateBlogContentAction('1')],
    ['translateHeroAction', () => translateHero.translateHeroAction()],
    ['translatePropertiesGeminiAction', () => translateGemini.translatePropertiesGeminiAction()],
    ['translatePropertiesAction (perplexity)', () => translatePerplexity.translatePropertiesAction()],
    ['updateTranslationAction', () => translatePerplexity.updateTranslationAction(1, 'en', 'x')],
];

describe('server actions admin sin sesiÃ³n', () => {
    beforeEach(() => adminTouched.mockClear());

    it.each(cases)('%s no toca supabaseAdmin y no devuelve Ã©xito', async (_name, run) => {
        const result = (await run()) as { success?: boolean; errors?: number };
        expect(adminTouched).not.toHaveBeenCalled();
        expect(result.success === true).toBe(false);
        if (result.success === undefined) expect(result.errors).toBeGreaterThan(0);
    });
});

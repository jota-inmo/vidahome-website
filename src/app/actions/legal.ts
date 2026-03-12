'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';

export interface LegalPage {
    slug: string;
    title_es: string;
    title_en: string;
    title_fr: string;
    title_de: string;
    title_it: string;
    title_pl: string;
    content_es: string;
    content_en: string;
    content_fr: string;
    content_de: string;
    content_it: string;
    content_pl: string;
    updated_at?: string;
}

export async function getLegalPageAction(slug: string): Promise<LegalPage | null> {
    try {
        const { data, error } = await supabaseAdmin
            .from('legal_pages')
            .select('*')
            .eq('slug', slug)
            .maybeSingle();

        if (error) throw error;
        return data as LegalPage;
    } catch (e) {
        console.error(`Error fetching legal page ${slug}:`, e);
        return null;
    }
}

export async function getAllLegalPagesAction(): Promise<LegalPage[]> {
    try {
        const { data, error } = await supabaseAdmin
            .from('legal_pages')
            .select('*')
            .order('slug', { ascending: true });

        if (error) throw error;
        return (data || []) as LegalPage[];
    } catch (e) {
        console.error('Error fetching all legal pages:', e);
        return [];
    }
}

export async function saveLegalPageAction(page: LegalPage) {
    try {
        if (!(await requireAdmin())) return { success: false, error: 'No autorizado' };

        const { error } = await supabaseAdmin
            .from('legal_pages')
            .upsert({
                ...page,
                updated_at: new Date().toISOString()
            });

        if (error) throw error;

        revalidatePath('/[locale]/legal', 'layout');
        revalidatePath('/[locale]/privacy', 'layout');
        revalidatePath('/[locale]/cookies', 'layout');

        return { success: true };
    } catch (e: any) {
        console.error('Error saving legal page:', e);
        return { success: false, error: e.message };
    }
}

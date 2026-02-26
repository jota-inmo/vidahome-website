'use server';

import { revalidatePath } from 'next/cache';
import { unstable_noStore as noStore } from 'next/cache';
import { requireAdmin } from '@/lib/auth';

export interface HeroSlide {
    id: string;
    video_path: string;
    link_url: string;
    title: string;       // Legacy / fallback (español)
    titles?: Record<string, string>; // Multi-lang: { es: '...', en: '...', fr: '...' }
    order: number;
    active: boolean;
    type: 'video' | 'image';
    poster?: string;
}

export async function getHeroSlidesAction(onlyActive = false): Promise<HeroSlide[]> {
    try {
        noStore(); // Disable caching for real-time updates
        const { supabase } = await import('@/lib/supabase');
        let query = supabase
            .from('hero_slides')
            .select('*')
            .order('order', { ascending: true });

        if (onlyActive) {
            query = query.eq('active', true);
        }

        const { data, error } = await query;

        if (error) throw error;
        return (data || []) as HeroSlide[];
    } catch (e) {
        console.error('Error fetching hero slides:', e);
        return [];
    }
}

export async function saveHeroSlideAction(slide: Partial<HeroSlide>) {
    try {
        if (!(await requireAdmin())) return { success: false, error: 'No autorizado' };
        const { supabaseAdmin } = await import('@/lib/supabase-admin');

        // Limpiar ID si es una cadena vacía para evitar errores de UUID en Postgres
        const dataToSave = { ...slide };
        if (dataToSave.id === '') delete dataToSave.id;

        console.log('⏳ Sincronizando Hero Slide en Supabase...', dataToSave);

        const { error } = await supabaseAdmin
            .from('hero_slides')
            .upsert(dataToSave);

        if (error) throw error;

        // Revalidate all locales for home page
        revalidatePath('/');
        revalidatePath('/es');
        revalidatePath('/en');
        revalidatePath('/fr');
        revalidatePath('/de');
        revalidatePath('/it');
        revalidatePath('/pl');
        
        return { success: true };
    } catch (e: any) {
        console.error('Error saving hero slide:', e);
        return { success: false, error: e.message };
    }
}

export async function deleteHeroSlideAction(id: string) {
    try {
        if (!(await requireAdmin())) return { success: false, error: 'No autorizado' };
        const { supabaseAdmin } = await import('@/lib/supabase-admin');
        const { error } = await supabaseAdmin
            .from('hero_slides')
            .delete()
            .eq('id', id);

        if (error) throw error;

        // Revalidate all locales for home page
        revalidatePath('/');
        revalidatePath('/es');
        revalidatePath('/en');
        revalidatePath('/fr');
        revalidatePath('/de');
        revalidatePath('/it');
        revalidatePath('/pl');
        
        return { success: true };
    } catch (e: any) {
        console.error('Error deleting hero slide:', e);
        return { success: false, error: e.message };
    }
}

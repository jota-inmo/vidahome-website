'use server';

import { revalidatePath } from 'next/cache';

export interface HeroSlide {
    id: string;
    video_path: string;
    link_url: string;
    title: string;
    order: number;
    active: boolean;
    type: 'video' | 'image';
    poster?: string;
}

export async function getHeroSlidesAction(onlyActive = false): Promise<HeroSlide[]> {
    try {
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
        const { supabaseAdmin } = await import('@/lib/supabase-admin');

        // Limpiar ID si es una cadena vacía para evitar errores de UUID en Postgres
        const dataToSave = { ...slide };
        if (dataToSave.id === '') delete dataToSave.id;

        console.log('⏳ Sincronizando Hero Slide en Supabase...', dataToSave);

        const { error } = await supabaseAdmin
            .from('hero_slides')
            .upsert(dataToSave);

        if (error) throw error;

        revalidatePath('/');
        return { success: true };
    } catch (e: any) {
        console.error('Error saving hero slide:', e);
        return { success: false, error: e.message };
    }
}

export async function deleteHeroSlideAction(id: string) {
    try {
        const { supabaseAdmin } = await import('@/lib/supabase-admin');
        const { error } = await supabaseAdmin
            .from('hero_slides')
            .delete()
            .eq('id', id);

        if (error) throw error;

        revalidatePath('/');
        return { success: true };
    } catch (e: any) {
        console.error('Error deleting hero slide:', e);
        return { success: false, error: e.message };
    }
}

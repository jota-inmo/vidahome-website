'use server';

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

        const { error } = await supabaseAdmin
            .from('hero_slides')
            .upsert(slide);

        if (error) throw error;

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
        return { success: true };
    } catch (e: any) {
        console.error('Error deleting hero slide:', e);
        return { success: false, error: e.message };
    }
}

'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';

const HERO_TITLES = {
    es: 'Hogares excepcionales, experiencia inigualable',
    en: 'Homes that inspire, where luxury finds its place',
    fr: 'Vivre exceptionnellement, au cœur du Grau',
    de: 'Außergewöhnliche Häuser, leidenschaftlich vermittelt',
    it: 'Case straordinarie, dove nascono i vostri sogni',
    pl: 'Niezwykłe mieszkania, doświadczenie bez granic'
};

export async function populateHeroTitles() {
    try {
        console.log('🌍 Populating hero translations via supabaseAdmin...\n');

        // Get all hero slides
        const { data: slides, error: fetchError } = await supabaseAdmin
            .from('hero_slides')
            .select('*');

        if (fetchError) throw fetchError;

        if (!slides || slides.length === 0) {
            return { success: false, message: 'No slides found' };
        }

        let updated = 0;
        for (const slide of slides) {
            const { error: updateError } = await supabaseAdmin
                .from('hero_slides')
                .update({
                    titles: HERO_TITLES,
                    title: HERO_TITLES.es
                })
                .eq('id', slide.id);

            if (updateError) {
                console.error(`❌ Error updating ${slide.id}:`, updateError);
            } else {
                updated++;
                console.log(`✅ Updated slide ${slide.id}`);
            }
        }

        return { 
            success: true, 
            message: `Updated ${updated}/${slides.length} slides`,
            updatedCount: updated,
            totalCount: slides.length
        };

    } catch (error: any) {
        console.error('❌ Error:', error.message);
        return { success: false, error: error.message };
    }
}

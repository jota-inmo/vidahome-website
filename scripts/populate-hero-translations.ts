import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceRole) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRole);

// Culturally-appropriate hero slide titles for each language
const HERO_TITLES = {
    es: 'Hogares excepcionales, experiencia inigualable',
    en: 'Homes that inspire, where luxury finds its place',
    fr: 'Vivre exceptionnellement, au cœur du Grau',
    de: 'Außergewöhnliche Häuser, leidenschaftlich vermittelt',
    it: 'Case straordinarie, dove nascono i vostri sogni',
    pl: 'Niezwykłe mieszkania, doświadczenie bez granic'
};

async function populateHeroTranslations() {
    try {
        console.log('🌍 Updating hero slides with multilingual titles...\n');

        // Get existing hero slides
        const { data: slides, error: fetchError } = await supabase
            .from('hero_slides')
            .select('*')
            .order('order', { ascending: true });

        if (fetchError) throw fetchError;

        if (!slides || slides.length === 0) {
            console.log('⚠️  No hero slides found. Creating a default one...');
            
            // Create default slide with all translations
            const { error: insertError } = await supabase
                .from('hero_slides')
                .insert([
                    {
                        id: crypto.randomUUID(),
                        video_path: '/videos/cocina.mp4',
                        title: HERO_TITLES.es,
                        titles: HERO_TITLES,
                        link_url: '',
                        order: 0,
                        active: true,
                        type: 'video'
                    }
                ]);

            if (insertError) throw insertError;
            console.log('✅ Default hero slide created with all translations\n');
            return;
        }

        // Update existing slides with translations
        for (const slide of slides) {
            console.log(`📝 Processing slide: ${slide.id}`);
            
            const updatedTitles = HERO_TITLES;

            const { data: updated, error: updateError } = await supabase
                .from('hero_slides')
                .update({
                    titles: updatedTitles,
                    title: HERO_TITLES.es // Keep sync with Spanish title
                })
                .eq('id', slide.id)
                .select();

            if (updateError) throw updateError;

            if (updated && updated.length > 0) {
                const updatedSlide = updated[0];
                console.log(`✅ Updated slide ${slide.id}`);
                console.log(`   Stored titles: ${JSON.stringify(updatedSlide.titles)}\n`);
            }
        }

        console.log('🎉 All hero slides updated successfully!');
    } catch (error: any) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

populateHeroTranslations();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceRole) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRole);

const HERO_TITLES = {
    es: 'Hogares excepcionales, experiencia inigualable',
    en: 'Homes that inspire, where luxury finds its place',
    fr: 'Vivre exceptionnellement, au cœur du Grau',
    de: 'Außergewöhnliche Häuser, leidenschaftlich vermittelt',
    it: 'Case straordinarie, dove nascono i vostri sogni',
    pl: 'Niezwykłe mieszkania, doświadczement bez granic'
};

async function updateHeroTranslations() {
    try {
        console.log('🌍 Force updating hero slides with all translations...\n');

        // Get first slide to test
        const { data: slides, error: fetchError } = await supabase
            .from('hero_slides')
            .select('*')
            .limit(1);

        if (fetchError) throw fetchError;
        if (!slides || slides.length === 0) throw new Error('No slides found');

        const slide = slides[0];
        console.log(`📝 Updating slide: ${slide.id}`);
        console.log(`   Current titles: ${JSON.stringify(slide.titles)}`);

        // Attempt update with explicit type
        const { data: updateData, error } = await supabase
            .from('hero_slides')
            .update({
                titles: HERO_TITLES
            })
            .eq('id', slide.id)
            .select('id, title, titles');

        if (error) {
            console.error('❌ Update error:', error);
            throw error;
        }

        console.log(`\n✅ Update response rows affected:`, updateData?.length || 0);

        // Now fetch to verify
        const { data: verifyData, error: verifyError } = await supabase
            .from('hero_slides')
            .select('id, title, titles')
            .eq('id', slide.id)
            .single();

        if (verifyError) throw verifyError;

        console.log(`\n📋 After update (verified):`);
        console.log(`   title: ${verifyData?.title}`);
        console.log(`   titles: ${JSON.stringify(verifyData?.titles, null, 2)}`);

    } catch (error: any) {
        console.error('❌ Error:', error.message || error);
        process.exit(1);
    }
}

updateHeroTranslations();

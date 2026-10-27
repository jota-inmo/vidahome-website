import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceRole) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRole);

async function checkHeroData() {
    try {
        console.log('🔍 Checking hero_slides data in Supabase...\n');

        const { data: slides, error } = await supabase
            .from('hero_slides')
            .select('id, title, titles')
            .limit(1);

        if (error) throw error;

        if (!slides || slides.length === 0) {
            console.log('❌ No hero slides found');
            return;
        }

        const slide = slides[0];
        console.log('📋 First Hero Slide:');
        console.log(`   ID: ${slide.id}`);
        console.log(`   title (legacy): ${slide.title}`);
        console.log(`   titles (JSONB):`);
        console.log(JSON.stringify(slide.titles, null, 2));
    } catch (error: any) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkHeroData();

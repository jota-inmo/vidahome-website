import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceRole) {
    console.error('❌ Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRole);

const HERO_TITLES = {
    es: 'Hogares excepcionales, experiencia inigualable',
    en: 'Homes that inspire, where luxury finds its place',
    fr: 'Vivre exceptionnellement, au cœur du Grau',
    de: 'Außergewöhnliche Häuser, leidenschaftlich vermittelt',
    it: 'Case straordinarie, dove nascono i vostri sogni',
    pl: 'Niezwykłe mieszkania, doświadczenie bez granic'
};

async function updateWithSQL() {
    try {
        console.log('🔧 Using RPC/SQL to update hero_slides...\n');

        // Use RPC call if available, otherwise use raw SQL
        const { data, error } = await supabase.rpc('update_hero_titles', {
            new_titles: HERO_TITLES
        }).select();

        if (error) {
            console.log('ℹ️  RPC not available, trying direct upsert instead...\n');
            
            // Get all slides
            const { data: slides, error: fetchErr } = await supabase
                .from('hero_slides')
                .select('*');

            if (fetchErr) throw fetchErr;

            // Upsert with explicit titles
            for (const slide of slides) {
                const { error: upsertErr } = await supabase
                    .from('hero_slides')
                    .upsert({
                        id: slide.id,
                        titles: HERO_TITLES,
                        title: HERO_TITLES.es,
                        video_path: slide.video_path,
                        link_url: slide.link_url,
                        order: slide.order,
                        active: slide.active,
                        type: slide.type,
                        poster: slide.poster
                    });

                if (upsertErr) {
                    console.error(`❌ Upsert error for ${slide.id}:`, upsertErr);
                } else {
                    console.log(`✅ Upserted slide ${slide.id}`);
                }
            }

            // Verify
            const { data: verify } = await supabase
                .from('hero_slides')
                .select('id, titles')
                .limit(1)
                .single();

            console.log(`\n✅ Verification - titles: ${JSON.stringify(verify?.titles, null, 2)}`);
            return;
        }

        console.log('✅ RPC executed:', data);

    } catch (error: any) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

updateWithSQL();

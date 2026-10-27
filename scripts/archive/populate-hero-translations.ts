import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceRole) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRole);

// Per-slide titles indexed by slide order (0-4)
const HERO_TITLES_BY_ORDER: Record<number, Record<string, string>> = {
    0: {
        es: 'Hogares excepcionales, experiencia inigualable',
        en: 'Homes that inspire, where luxury finds its place',
        fr: 'Vivre exceptionnellement, au cœur du Grau',
        de: 'Außergewöhnliche Häuser, leidenschaftlich vermittelt',
        it: 'Case straordinarie, dove nascono i vostri sogni',
        pl: 'Niezwykłe mieszkania, doświadczenie bez granic'
    },
    1: {
        es: 'Vive el Mediterráneo desde tu propia piscina',
        en: 'Live the Mediterranean from your own pool',
        fr: 'Vivez la Méditerranée depuis votre propre piscine',
        de: 'Das Mittelmeer erleben — vom eigenen Pool aus',
        it: 'Vivi il Mediterraneo dalla tua piscina privata',
        pl: 'Poczuj Morze Śródziemne we własnym basenie'
    },
    2: {
        es: 'Espacios donde cada detalle cuenta',
        en: 'Spaces where every detail matters',
        fr: 'Des espaces où chaque détail compte',
        de: 'Räume, in denen jedes Detail zählt',
        it: 'Spazi dove ogni dettaglio conta',
        pl: 'Przestrzenie, gdzie każdy detal ma znaczenie'
    },
    3: {
        es: 'El lugar donde los sueños se convierten en hogar',
        en: 'The place where dreams become home',
        fr: 'L\'endroit où les rêves deviennent un foyer',
        de: 'Der Ort, wo Träume zum Zuhause werden',
        it: 'Il luogo dove i sogni diventano casa',
        pl: 'Miejsce, gdzie marzenia stają się domem'
    },
    4: {
        es: 'Comodidad y estilo en cada rincón',
        en: 'Comfort and style in every corner',
        fr: 'Confort et élégance à chaque coin',
        de: 'Komfort und Stil in jedem Winkel',
        it: 'Comfort e stile in ogni angolo',
        pl: 'Komfort i styl w każdym zakątku'
    }
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
                        title: HERO_TITLES_BY_ORDER[0].es,
                        titles: HERO_TITLES_BY_ORDER[0],
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

        // Update existing slides with per-slide translations
        for (const slide of slides) {
            const order: number = slide.order ?? 0;
            const slideTitles = HERO_TITLES_BY_ORDER[order] ?? HERO_TITLES_BY_ORDER[0];
            console.log(`📝 Processing slide order ${order}: "${slideTitles.es}"`);

            const { data: updated, error: updateError } = await supabase
                .from('hero_slides')
                .update({
                    titles: slideTitles,
                    title: slideTitles.es
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

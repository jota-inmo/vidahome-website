import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║ ANÁLISIS DE COBERTURA DE TRADUCCIONES  ║');
    console.log('╚════════════════════════════════════════╝\n');

    // Get all properties with descriptions
    const { data: props } = await supabase
        .from('property_metadata')
        .select('cod_ofer, descriptions')
        .not('descriptions', 'is', null)
        .limit(100);
    
    if (!props) {
        console.log('❌ No properties found');
        return;
    }

    const stats = {
        total: props.length,
        with_en: 0,
        with_es: 0,
        with_fr: 0,
        with_de: 0,
        with_it: 0,
        with_pl: 0,
        only_es: 0,
        fully_translated: 0
    };

    const missingEnList = [];

    for (const prop of props) {
        const desc = prop.descriptions as Record<string, string>;
        const keys = Object.keys(desc);

        if (desc.description_en) stats.with_en++;
        if (desc.description_es) stats.with_es++;
        if (desc.description_fr) stats.with_fr++;
        if (desc.description_de) stats.with_de++;
        if (desc.description_it) stats.with_it++;
        if (desc.description_pl) stats.with_pl++;

        if (keys.length === 1 && desc.description_es) {
            stats.only_es++;
        }

        if (keys.length === 6) {  // All 6 languages
            stats.fully_translated++;
        }

        if (!desc.description_en && desc.description_es) {
            missingEnList.push(prop.cod_ofer);
        }
    }

    console.log('📊 STATISTICS:\n');
    console.log(`Total properties: ${stats.total}`);
    console.log(`With EN translation: ${stats.with_en} (${((stats.with_en/stats.total)*100).toFixed(1)}%)`);
    console.log(`With ES translation: ${stats.with_es} (${((stats.with_es/stats.total)*100).toFixed(1)}%)`);
    console.log(`With FR translation: ${stats.with_fr} (${((stats.with_fr/stats.total)*100).toFixed(1)}%)`);
    console.log(`With DE translation: ${stats.with_de} (${((stats.with_de/stats.total)*100).toFixed(1)}%)`);
    console.log(`With IT translation: ${stats.with_it} (${((stats.with_it/stats.total)*100).toFixed(1)}%)`);
    console.log(`With PL translation: ${stats.with_pl} (${((stats.with_pl/stats.total)*100).toFixed(1)}%)`);
    console.log(`\nOnly in Spanish: ${stats.only_es}`);
    console.log(`Fully translated (all 6): ${stats.fully_translated}`);
    
    console.log(`\n❌ MISSING ENGLISH (${missingEnList.length}):`);
    console.log(`First 10: ${missingEnList.slice(0, 10).join(', ')}`);
}

main().catch(console.error);

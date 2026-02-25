import { getPropertyDetailAction } from '../src/app/actions/inmovilla.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function main() {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║ DIAGNOSTICANDO TRADUCCIONES AL INGLÉS  ║');
    console.log('╚════════════════════════════════════════╝\n');

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Primera: verificar la BD directamente
    console.log('📊 CHECKING DATABASE (property_metadata.descriptions):\n');
    const { data: props } = await supabase
        .from('property_metadata')
        .select('cod_ofer, descriptions')
        .not('descriptions', 'is', null)
        .limit(3);
    
    if (props) {
        for (const prop of props) {
            console.log(`Property ${prop.cod_ofer}:`);
            const desc = prop.descriptions as Record<string, string>;
            console.log(`  • Keys available: ${Object.keys(desc).join(', ')}`);
            console.log(`  • description_en: ${desc.description_en ? '✅ YES' : '❌ NO'}`);
            if (desc.description_en) {
                console.log(`    Preview: "${desc.description_en.substring(0, 60)}..."`);
            }
            console.log();
        }
    }

    // Segundo: verificar lo que retorna la acción
    console.log('🔍 CHECKING ACTION RESPONSE (getPropertyDetailAction):\n');
    const resultEN = await getPropertyDetailAction(27838876, 'en');
    if (resultEN.success && resultEN.data) {
        const p = resultEN.data;
        console.log(`Property 27838876 (EN):`);
        console.log(`  • descripciones length: ${p.descripciones?.length || 0}`);
        console.log(`  • descripciones preview: "${p.descripciones?.substring(0, 60) || 'EMPTY'}..."`);
        console.log();
    }

    // Tercero: comparar con otros idiomas
    console.log('🌍 COMPARACIÓN CON OTROS IDIOMAS:\n');
    const locales = ['es', 'en', 'fr', 'de', 'pl'];
    for (const locale of locales) {
        const result = await getPropertyDetailAction(27838876, locale);
        if (result.success && result.data) {
            const p = result.data;
            console.log(`${locale.toUpperCase()}: "${p.descripciones?.substring(0, 50)}..."`);
        }
    }
}

main().catch(console.error);

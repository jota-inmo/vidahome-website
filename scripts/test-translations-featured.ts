import { getFeaturedPropertiesWithDetailsAction } from '../src/app/actions/inmovilla.js';

async function main() {
    const result = await getFeaturedPropertiesWithDetailsAction('es');
    
    if (result.success && result.data?.[0]) {
        const p = result.data[0];
        console.log('\n=== FEATURED PROPERTY (ES) ===\n');
        console.log(`Property ${p.cod_ofer}:`);
        console.log(`  descripciones (length): ${p.descripciones?.length || 0}`);
        console.log(`  descripciones (first 100): "${p.descripciones?.substring(0, 100) || '❌ EMPTY'}"`);
        console.log(`  all_descriptions keys: ${Object.keys(p.all_descriptions || {}).join(', ') || '❌ EMPTY'}`);
    } else {
        console.log('❌ No featured properties found');
    }

    // Test another locale
    const resultFR = await getFeaturedPropertiesWithDetailsAction('fr');
    if (resultFR.success && resultFR.data?.[0]) {
        const p = resultFR.data[0];
        console.log('\n=== FEATURED PROPERTY (FR) ===\n');
        console.log(`Property ${p.cod_ofer}:`);
        console.log(`  descripciones (first 100): "${p.descripciones?.substring(0, 100) || '❌ EMPTY'}"`);
    }
}

main().catch(console.error);

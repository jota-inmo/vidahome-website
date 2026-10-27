import { getFeaturedPropertiesWithDetailsAction } from '../src/app/actions/inmovilla.js';

async function main() {
    const result = await getFeaturedPropertiesWithDetailsAction('es');
    
    console.log('\n=== FEATURED PROPERTIES ===\n');
    if (result.success && result.data?.[0]) {
        const p = result.data[0];
        console.log(`Property ${p.cod_ofer}:`);
        console.log(`  mainImage: ${p.mainImage ? '✅' : '❌'} - ${p.mainImage}`);
        console.log(`  habitaciones: ${p.habitaciones || '❌'}`);
        console.log(`  banyos: ${p.banyos || '❌'}`);
        console.log(`  m_cons: ${p.m_cons || '❌'}`);
        console.log(`  Total properties: ${result.data.length}`);
    } else {
        console.log('❌ No featured properties found');
    }
}

main().catch(console.error);

import { fetchPropertiesAction } from '../src/app/actions/inmovilla.js';
import { getPropertyDetailAction } from '../src/app/actions/inmovilla.js';
import { getFeaturedPropertiesWithDetailsAction } from '../src/app/actions/inmovilla.js';

async function main() {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║ SIMULATING USER DATA FLOW              ║');
    console.log('╚════════════════════════════════════════╝\n');

    // 1. Portfolio/Homepage
    console.log('🏠 HOMEPAGE (getFeaturedPropertiesWithDetailsAction):\n');
    const featured = await getFeaturedPropertiesWithDetailsAction('es');
    if (featured.success && featured.data?.[0]) {
        const p = featured.data[0];
        console.log(`Property ID: ${p.cod_ofer}`);
        console.log(`Photo URL: ${p.mainImage ? '✅' : '❌'} ${p.mainImage || 'NO URL'}`);
        console.log(`Rooms: ${p.habitaciones || '❌'}`);
        console.log(`Baths: ${p.banyos || '❌'}`);
        console.log(`m²: ${p.m_cons || '❌'}`);
        console.log(`Description length: ${p.descripciones?.length || 0}`);
        console.log(`Description preview: ${p.descripciones?.substring(0, 50) || '❌ EMPTY'}\n`);
    }

    // 2. Portfolio List Page
    console.log('📋 PORTFOLIO LIST PAGE (fetchPropertiesAction):\n');
    const list = await fetchPropertiesAction();
    if (list.success && list.data?.[0]) {
        const p = list.data[0];
        console.log(`Property ID: ${p.cod_ofer}`);
        console.log(`Photo URL: ${p.mainImage ? '✅' : '❌'} ${p.mainImage || 'NO URL'}`);
        console.log(`Rooms: ${p.habitaciones || '❌'}`);
        console.log(`Baths: ${p.banyos || '❌'}`);
        console.log(`m²: ${p.m_cons || '❌'}`);
        console.log(`Description length: ${p.descripciones?.length || 0}`);
        console.log(`Description preview: ${p.descripciones?.substring(0, 50) || '❌ EMPTY'}\n`);
    }

    // 3. Detail Page
    console.log('🔍 DETAIL PAGE (getPropertyDetailAction es):\n');
    const detailES = await getPropertyDetailAction(27838876, 'es');
    if (detailES.success && detailES.data) {
        const p = detailES.data;
        console.log(`Property ID: ${p.cod_ofer}`);
        console.log(`Photo URL: ${p.mainImage ? '✅' : '❌'} ${p.mainImage || 'NO URL'}`);
        console.log(`Rooms: ${p.habitaciones || '❌'}`);
        console.log(`Baths: ${p.banyos || '❌'}`);
        console.log(`m²: ${p.m_cons || '❌'}`);
        console.log(`Photos array: ${p.fotos_lista?.length || 0} fotos`);
        console.log(`Description (ES): ${p.descripciones?.substring(0, 50) || '❌ EMPTY'}\n`);
    }

    // 4. Detail Page FR
    console.log('🔍 DETAIL PAGE (getPropertyDetailAction fr):\n');
    const detailFR = await getPropertyDetailAction(27838876, 'fr');
    if (detailFR.success && detailFR.data) {
        const p = detailFR.data;
        console.log(`Description (FR): ${p.descripciones?.substring(0, 50) || '❌ EMPTY'}\n`);
    }
}

main().catch(console.error);

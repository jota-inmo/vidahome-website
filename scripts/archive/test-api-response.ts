import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

async function testFetchPropertiesAction() {
    const { fetchPropertiesAction } = await import('../src/app/actions/inmovilla.js');
    
    console.log('📡 Calling fetchPropertiesAction...\n');
    const result = await fetchPropertiesAction();
    
    console.log(`Success: ${result.success}`);
    console.log(`Properties count: ${result.data?.length || 0}\n`);
    
    if (result.data && result.data.length > 0) {
        const prop = result.data[0];
        console.log('First property:');
        console.log(`  cod_ofer: ${prop.cod_ofer}`);
        console.log(`  ref: ${prop.ref}`);
        console.log(`  mainImage: ${prop.mainImage}`);
        console.log(`  habitaciones: ${prop.habitaciones}`);
        console.log(`  banyos: ${prop.banyos}`);
        console.log(`  m_cons: ${prop.m_cons}`);
        console.log(`  precio: ${prop.precio}`);
        console.log(`  precioinmo: ${prop.precioinmo}`);
        console.log(`  precioalq: ${prop.precioalq}`);
        console.log(`  descripciones length: ${prop.descripciones?.length || 0}`);
        console.log(`  keyacci: ${prop.keyacci}`);
        
        // Try to fetch property detail too
        const { getPropertyDetailAction } = await import('../src/app/actions/inmovilla.js');
        console.log(`\n📄 Fetching detail for property ${prop.cod_ofer}...\n`);
        const detailResult = await getPropertyDetailAction(prop.cod_ofer);
        
        if (detailResult.success && detailResult.data) {
            const detail = detailResult.data;
            console.log('Property Detail:');
            console.log(`  cod_ofer: ${detail.cod_ofer}`);
            console.log(`  main_photo: ${detail.main_photo}`);
            console.log(`  fotos_lista type: ${Array.isArray(detail.fotos_lista) ? 'Array' : typeof detail.fotos_lista}`);
            console.log(`  fotos_lista count: ${detail.fotos_lista?.length || 0}`);
            if (detail.fotos_lista && detail.fotos_lista.length > 0) {
                console.log(`  First foto: ${detail.fotos_lista[0]}`);
            }
        } else {
            console.log('Error fetching detail:', detailResult.error);
        }
    }
}

testFetchPropertiesAction().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});

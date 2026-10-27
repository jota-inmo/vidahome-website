import { fetchPropertiesAction } from '../src/app/actions/inmovilla.js';

async function main() {
    const result = await fetchPropertiesAction();
    
    if (result.success && result.data?.[0]) {
        const p = result.data[0];
        console.log('\n=== FULL OBJECT ===\n');
        console.log(JSON.stringify(p, null, 2));
        
        console.log('\n=== SPECIFIC FIELDS ===\n');
        console.log('habitaciones:', p.habitaciones, typeof p.habitaciones);
        console.log('banyos:', p.banyos, typeof p.banyos);
        console.log('m_cons:', p.m_cons, typeof p.m_cons);
        console.log('mainImage:', p.mainImage);
    }
}

main().catch(console.error);

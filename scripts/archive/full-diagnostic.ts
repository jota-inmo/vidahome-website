import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

async function fullDiagnostic() {
    const { fetchPropertiesAction, getPropertyDetailAction } = await import('../src/app/actions/inmovilla.js');
    
    console.log('\n=== PORTFOLIO DATA ===\n');
    const listResult = await fetchPropertiesAction();
    
    if (listResult.success && listResult.data?.[0]) {
        const prop = listResult.data[0];
        console.log(`Property ${prop.cod_ofer} (${prop.ref}):`);
        console.log(`  mainImage: ${prop.mainImage ? '✅' : '❌'}`);
        console.log(`  habitaciones: ${prop.habitaciones || '❌ MISSING/0'}`);
        console.log(`  banyos: ${prop.banyos || '❌ MISSING/0'}`);
        console.log(`  m_cons: ${prop.m_cons || '❌ MISSING/0'}`);
        console.log(`  precio: ${prop.precio || '❌ MISSING/0'}`);
        console.log(`  precioinmo: ${prop.precioinmo || '❌ MISSING/0'}`);
        console.log(`  precioalq: ${prop.precioalq || '❌ MISSING/0'}`);
        console.log(`  keyacci: ${prop.keyacci || '❌ MISSING'}`);
    }
    
    console.log('\n=== DETAIL DATA ===\n');
    if (listResult.success && listResult.data?.[0]) {
        const detailResult = await getPropertyDetailAction(listResult.data[0].cod_ofer);
        if (detailResult.success && detailResult.data) {
            const detail = detailResult.data;
            console.log(`Property ${detail.cod_ofer}:`);
            console.log(`  main_photo: ${detail.main_photo ? '✅' : '❌'}`);
            console.log(`  fotos_lista: ${detail.fotos_lista?.length || 0} fotos`);
            console.log(`  habitaciones: ${detail.habitaciones || '❌ MISSING/0'}`);
            console.log(`  banyos: ${detail.banyos || '❌ MISSING/0'}`);
            console.log(`  m_cons: ${detail.m_cons || '❌ MISSING/0'}`);
        }
    }
    
    // Check database directly
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    console.log('\n=== DATABASE CHECK ===\n');
    
    // Check property_features
    const { data: feat } = await supabase
        .from('property_features')
        .select('cod_ofer, habitaciones, habitaciones_simples, habitaciones_dobles, banos')
        .limit(3);
    
    console.log('property_features:');
    feat?.forEach((f: any) => {
        console.log(`  ${f.cod_ofer}: ${f.habitaciones} hab, ${f.banos} banyos`);
    });
    
    // Check property_metadata
    const { data: meta } = await supabase
        .from('property_metadata')
        .select('cod_ofer, main_photo, photos')
        .limit(3);
    
    console.log('\nproperty_metadata:');
    meta?.forEach((m: any) => {
        console.log(`  ${m.cod_ofer}: photos=${m.photos?.length || 0}, main_photo=${m.main_photo ? '✅' : '❌'}`);
    });
}

fullDiagnostic().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});

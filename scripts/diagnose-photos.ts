/**
 * Complete diagnostic of photo display issue
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local  
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

async function diagnose() {
    const { fetchPropertiesAction, getPropertyDetailAction } = await import('../src/app/actions/inmovilla.js');
    const { createClient } = await import('@supabase/supabase-js');
    
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('PHOTO DISPLAY DIAGNOSTIC\n');
    
    // 1. Test fetchPropertiesAction
    console.log('1️⃣  Testing fetchPropertiesAction...\n');
    const listResult = await fetchPropertiesAction();
    
    if (!listResult.success) {
        console.error('❌ fetchPropertiesAction failed:', listResult.error);
        return;
    }
    
    console.log(`✅ Got ${listResult.data?.length || 0} properties\n`);
    
    const testProp = listResult.data?.[0];
    if (!testProp) {
        console.error('❌ No properties returned');
        return;
    }
    
    console.log(`Test property: ${testProp.cod_ofer} (${testProp.ref})`);
    console.log(`  mainImage: ${testProp.mainImage || '❌ MISSING'}`);
    console.log(`  habitaciones: ${testProp.habitaciones}`);
    console.log(`  banyos: ${testProp.banyos}`);
    console.log(`  m_cons: ${testProp.m_cons}`);
    console.log(`  precio: ${testProp.precio}\n`);
    
    if (!testProp.mainImage) {
        console.error('❌ mainImage is missing or null!\n');
    } else {
        console.log('✅ mainImage path exists\n');
    }
    
    // 2. Test database directly
    console.log('2️⃣  Testing Supabase database directly...\n');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: dbRow, error: dbError } = await supabase
        .from('property_metadata')
        .select('cod_ofer, main_photo, photos, full_data')
        .eq('cod_ofer', testProp.cod_ofer)
        .single();
    
    if (dbError) {
        console.error('❌ Database query failed:', dbError.message);
    } else {
        console.log(`✅ Database row found\n`);
        console.log(`  main_photo: ${dbRow.main_photo || '❌ MISSING'}`);
        console.log(`  photos count: ${dbRow.photos?.length || '❌ MISSING'}`);
        const fullData = dbRow.full_data || {};
        console.log(`  full_data.numagencia: ${fullData.numagencia}`);
        console.log(`  full_data.fotoletra: ${fullData.fotoletra}`);
        console.log(`  full_data.numfotos: ${fullData.numfotos}\n`);
    }
    
    // 3. Test photo URL construction
    console.log('3️⃣  Verifying photo URL construction...\n');
    if (testProp.mainImage) {
        console.log(`URL: ${testProp.mainImage}`);
        
        // Parse to verify format
        const url = new URL(testProp.mainImage);
        const parts = url.pathname.split('/').filter(Boolean);
        console.log(`  Domain: ${url.hostname}`);
        console.log(`  Path parts: ${parts.join(' / ')}`);
        
        // Try to fetch it
        try {
            const response = await fetch(testProp.mainImage, { method: 'HEAD' });
            console.log(`  Status: ${response.status} (${response.status === 200 ? '✅' : '❌'})`);
        } catch (err) {
            console.error(`  Fetch error: ${err.message}`);
        }
    }
    
    // 4. Test property detail for gallery
    console.log('\n4️⃣  Testing property detail for gallery...\n');
    const detailResult = await getPropertyDetailAction(testProp.cod_ofer);
    
    if (!detailResult.success) {
        console.error('❌ getPropertyDetailAction failed:', detailResult.error);
    } else {
        const detail = detailResult.data;
        console.log(`✅ Detail fetched\n`);
        console.log(`  fotos_lista type: ${Array.isArray(detail.fotos_lista) ? 'Array' : typeof detail.fotos_lista}`);
        console.log(`  fotos_lista count: ${detail.fotos_lista?.length || '❌ MISSING'}`);
        
        if (detail.fotos_lista && detail.fotos_lista.length > 0) {
            console.log(`  First foto: ${detail.fotos_lista[0]}`);
        }
    }
    
    console.log('\n═══════════════════════════════════════════════════════════\n');
}

diagnose().catch(err => {
    console.error('Diagnostic failed:', err.message);
    process.exit(1);
});

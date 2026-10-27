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

async function testSyncPhoto() {
    console.log('🔄 Importing API...');
    
    const { createInmovillaApi } = await import('./src/lib/api/properties.js');
    const { createClient } = await import('@supabase/supabase-js');
    
    const token = process.env.INMOVILLA_TOKEN;
    const authType = (process.env.INMOVILLA_AUTH_TYPE) || 'Token';
    
    const api = createInmovillaApi(token, authType);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('📡 Fetching a test property from Inmovilla...');
    const properties = await api.getProperties({ page: 1 });
    const testProp = properties[0];
    
    if (!testProp) {
        console.error('no properties found');
        return;
    }
    
    console.log(`\n📦 Test property: ${testProp.cod_ofer} (${testProp.ref})`);
    console.log(`   numfotos: ${testProp.numfotos}`);
    console.log(`   fotoletra: ${testProp.fotoletra}`);
    console.log(`   numagencia: ${testProp.numagencia}`);
    
    console.log('\n📄 Fetching details...');
    const details = await api.getPropertyDetails(testProp.cod_ofer);
    
    if (!details) {
        console.error('no details');
        return;
    }
    
    console.log(`   numfotos from details: ${details.numfotos}`);
    console.log(`   fotoletra from details: ${details.fotoletra}`);
    console.log(`   numagencia from details: ${details.numagencia}`);
    
    // Build URLs
    const numFotos = details.numfotos ? parseInt(details.numfotos) : 0;
    const numAgencia = details.numagencia || testProp.numagencia || '';
    const fotoLetra = details.fotoletra || testProp.fotoletra || '';
    
    console.log(`\n🖼️  Building URLs...`);
    let photos = [];
    if (numFotos > 0 && numAgencia && fotoLetra) {
        for (let i = 1; i <= numFotos; i++) {
            photos.push(`https://fotos15.inmovilla.com/${numAgencia}/${testProp.cod_ofer}/${fotoLetra}-${i}.jpg`);
        }
    }
    
    console.log(`   Total photos to save: ${photos.length}`);
    if (photos.length > 0) {
        console.log(`   First photo: ${photos[0]}`);
    }
    
    // Update Supabase
    console.log(`\n💾 Updating property in Supabase...`);
    const { error } = await supabase
        .from('property_metadata')
        .update({
            photos: photos,
            main_photo: photos[0] || null
        })
        .eq('cod_ofer', testProp.cod_ofer);
    
    if (error) {
        console.error('   Error:', error.message);
    } else {
        console.log('   ✅ Updated successfully');
    }
    
    // Verify
    console.log(`\n🔍 Verifying update...`);
    const { data, error: fetchError } = await supabase
        .from('property_metadata')
        .select('cod_ofer, main_photo, photos')
        .eq('cod_ofer', testProp.cod_ofer)
        .single();
    
    if (fetchError) {
        console.error('   Error:', fetchError.message);
    } else {
        console.log(`   cod_ofer: ${data.cod_ofer}`);
        console.log(`   main_photo: ${data.main_photo}`);
        console.log(`   photos count: ${data.photos ? data.photos.length : 0}`);
    }
}

testSyncPhoto().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});

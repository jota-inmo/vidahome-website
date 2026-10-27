/**
 * Build photo URLs from existing full_data in property_metadata
 * This extracts numfotos, fotoletra, numagencia from stored full_data
 * and constructs the photo URLs without hitting Inmovilla API
 */
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

async function buildPhotosFromFullData() {
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('📡 Fetching properties with empty photos...');
    const { data, error } = await supabase
        .from('property_metadata')
        .select('cod_ofer, full_data, photos')
        .or('photos.is.null,photos.eq.{}');
    
    if (error) {
        console.error('Error fetching:', error.message);
        return;
    }
    
    console.log(`Found ${data?.length || 0} properties with no photos`);
    
    let updated = 0;
    
    for (const row of data || []) {
        const fullData = row.full_data || {};
        
        const numFotos = fullData.numfotos ? parseInt(fullData.numfotos) : 0;
        const numAgencia = fullData.numagencia || '';
        const fotoLetra = fullData.fotoletra || '';
        
        if (numFotos > 0 && numAgencia && fotoLetra) {
            // Build photo URLs
            const photos = [];
            for (let i = 1; i <= numFotos; i++) {
                photos.push(`https://fotos15.inmovilla.com/${numAgencia}/${row.cod_ofer}/${fotoLetra}-${i}.jpg`);
            }
            
            const mainPhoto = photos[0];
            
            // Update the record
            const { error: updateError } = await supabase
                .from('property_metadata')
                .update({
                    photos: photos,
                    main_photo: mainPhoto
                })
                .eq('cod_ofer', row.cod_ofer);
            
            if (updateError) {
                console.warn(`Error updating ${row.cod_ofer}:`, updateError.message);
            } else {
                updated++;
                console.log(`✅ ${row.cod_ofer}: ${photos.length} fotos`);
            }
            
            // Small delay to avoid overload
            await new Promise(r => setTimeout(r, 100));
        }
    }
    
    console.log(`\n✨ Updated ${updated} properties with photos`);
}

buildPhotosFromFullData().catch(err => {
    console.error('❌ Failed:', err.message);
    process.exit(1);
});

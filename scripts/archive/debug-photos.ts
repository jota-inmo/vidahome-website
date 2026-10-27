import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPhotos() {
    try {
        console.log('Checking property_metadata table for photos...\n');
        
        // Get first 3 properties
        const { data, error } = await supabase
            .from('property_metadata')
            .select('cod_ofer, ref, main_photo, photos')
            .limit(3);
        
        if (error) {
            console.error('ERROR:', error.message);
            return;
        }
        
        console.log('First 3 properties:');
        data?.forEach((prop: any) => {
            console.log(`\nProperty ${prop.cod_ofer} (${prop.ref}):`);
            console.log(`  main_photo: ${prop.main_photo}`);
            console.log(`  photos array: ${JSON.stringify(prop.photos, null, 2)}`);
        });
        
        // Also check property_features for data
        console.log('\n\n--- Checking property_features table ---\n');
        const { data: features, error: featError } = await supabase
            .from('property_features')
            .select('cod_ofer, precio, habitaciones, habitaciones_simples, habitaciones_dobles')
            .limit(3);
        
        if (featError) {
            console.error('ERROR:', featError.message);
            return;
        }
        
        console.log('First 3 properties features:');
        features?.forEach((feat: any) => {
            console.log(`\nProperty ${feat.cod_ofer}:`);
            console.log(`  precio: ${feat.precio}`);
            console.log(`  habitaciones: ${feat.habitaciones}`);
            console.log(`  habitaciones_simples: ${feat.habitaciones_simples}`);
            console.log(`  habitaciones_dobles: ${feat.habitaciones_dobles}`);
        });
        
    } catch (err: any) {
        console.error('Exception:', err.message);
    }
}

checkPhotos();

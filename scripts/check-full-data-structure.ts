import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkFullData() {
    // Get a property with detailed full_data
    const { data } = await supabase
        .from('property_metadata')
        .select('cod_ofer, full_data, main_photo, photos')
        .eq('cod_ofer', 28189625)
        .single();
    
    if (data?.full_data) {
        console.log('\n=== FULL_DATA STRUCTURE ===\n');
        console.log(JSON.stringify(data.full_data, null, 2));
    }
}

checkFullData().catch(console.error);

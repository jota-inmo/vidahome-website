import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkFeatures() {
    // Get property features for this specific property
    const { data, error } = await supabase
        .from('property_features')
        .select('*')
        .eq('cod_ofer', 28189625)
        .single();
    
    if (error) {
        console.log('❌ Property features not found');
    } else if (data) {
        console.log('\n=== PROPERTY_FEATURES STRUCTURE ===\n');
        console.log(JSON.stringify(data, null, 2));
    }
}

checkFeatures().catch(console.error);

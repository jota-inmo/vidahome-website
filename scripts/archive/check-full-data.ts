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

async function checkFullData() {
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('Checking full_data structure...\n');
    
    const { data, error } = await supabase
        .from('property_metadata')
        .select('cod_ofer, full_data')
        .limit(3);
    
    if (error) {
        console.error('Error:', error.message);
        return;
    }
    
    data?.forEach(row => {
        const fd = row.full_data || {};
        console.log(`Property ${row.cod_ofer}:`);
        console.log(`  habitaciones: ${fd.habitaciones}`);
        console.log(`  banyos: ${fd.banyos}`);
        console.log(`  m_cons: ${fd.m_cons}`);
        console.log(`  precio: ${fd.precio}`);
        console.log(`  precioinmo: ${fd.precioinmo}`);
        console.log('');
    });
}

checkFullData().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});

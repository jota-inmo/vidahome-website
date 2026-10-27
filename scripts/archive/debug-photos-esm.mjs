#!/usr/bin/env node
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

// Log to verify env vars are loaded
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

const { createClient } = await import('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data, error } = await supabase
    .from('property_metadata')
    .select('cod_ofer, ref, main_photo, photos')
    .limit(3);

if (error) {
    console.error('ERROR:', error.message);
} else {
    console.log('\n📸 First 3 properties:');
    data.forEach(prop => {
        console.log(`\nProperty ${prop.cod_ofer} (${prop.ref}):`);
        console.log(`  main_photo: ${prop.main_photo || 'NULL'}`);
        if (prop.photos && Array.isArray(prop.photos)) {
            console.log(`  photos (${prop.photos.length} items):`);
            prop.photos.forEach((p, i) => {
                console.log(`    [${i}]: ${p}`);
            });
        } else {
            console.log(`  photos: ${prop.photos}`);
        }
    });
}

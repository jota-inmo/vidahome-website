import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { resolve } from 'path';

dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function runSql() {
    const sqlPath = resolve(process.cwd(), 'sql/legal_and_settings_setup.sql');
    const sql = readFileSync(sqlPath, 'utf8');

    // Since Supabase JS doesn't have a direct raw SQL execution method,
    // and we don't have a custom function defined yet, we'll try to 
    // perform the operations using the client if possible, 
    // or just inform the user if we can't run the SQL file directly.
    
    // HOWEVER, for this specific case, I'll try to use a common trick 
    // if there is an 'exec_sql' RPC, but likely there isn't.
    
    // Instead, I'll just check if the table exists.
    console.log('Checking for legal_pages table...');
    const { error: checkError } = await supabase.from('legal_pages').select('slug').limit(1);
    
    if (checkError) {
        console.log('Table legal_pages does not exist. Please run the SQL file [sql/legal_and_settings_setup.sql] in your Supabase SQL Editor.');
        console.log('I have created the file for you.');
    } else {
        console.log('Table legal_pages already exists.');
    }
    
    // Ensure notifications_email setting is there
    const { data: existing } = await supabase.from('company_settings').select('key').eq('key', 'notifications_email').maybeSingle();
    if (!existing) {
        console.log('Adding notifications_email to company_settings...');
        await supabase.from('company_settings').insert({
            key: 'notifications_email',
            value: 'info@vidahome.es',
            updated_at: new Date().toISOString()
        });
    }
}

runSql();

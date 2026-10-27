import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
    console.log('--- Starting Migration: Support Multi-language Descriptions ---');

    // Add 'descriptions' JSONB column if it doesn't exist
    // Note: Supabase JS client doesn't support ALTER TABLE directly via its API, 
    // but we can use an RPC or just warn the user to run it in the SQL Editor.
    // However, I can try to see if I can perform a small operation to test if col exists.

    const { error } = await supabase.rpc('execute_sql', {
        sql_query: "ALTER TABLE property_metadata ADD COLUMN IF NOT EXISTS descriptions JSONB DEFAULT '{}'::jsonb;"
    });

    if (error) {
        console.log('Note: RPC execute_sql might be restricted. If the following fails, please run this in Supabase SQL Editor:');
        console.log("ALTER TABLE property_metadata ADD COLUMN IF NOT EXISTS descriptions JSONB DEFAULT '{}'::jsonb;");

        // Alternative: Try to select it to see if it's there
        const { error: selectError } = await supabase.from('property_metadata').select('descriptions').limit(1);
        if (selectError) {
            console.error('Column "descriptions" does not exist yet. Please add it via SQL Editor.');
        } else {
            console.log('Column "descriptions" already exists.');
        }
    } else {
        console.log('Column "descriptions" added successfully via RPC.');
    }
}

migrate();

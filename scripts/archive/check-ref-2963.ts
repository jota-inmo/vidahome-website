import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkRef2963() {
    console.log('🔍 Buscando ref 2963 en Supabase...\n');

    // Check by ref
    const { data: byRef, error: errRef } = await supabase
        .from('property_metadata')
        .select('cod_ofer, ref, tipo, precio, poblacion, nodisponible, updated_at')
        .eq('ref', '2963');

    if (errRef) {
        console.error('❌ Error buscando por ref:', errRef.message);
    } else if (byRef && byRef.length > 0) {
        console.log('✅ ENCONTRADA por ref:');
        console.table(byRef);
    } else {
        console.log('❌ NO existe ningún registro con ref=2963 en Supabase');
    }

    // Check sync_progress
    console.log('\n📊 Verificando estado del sync...');
    const { data: progress } = await supabase
        .from('sync_progress')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

    if (progress && progress.length > 0) {
        console.log('\nÚltimos registros de sync_progress:');
        progress.forEach((p: any) => {
            console.log(`  - Status: ${p.status} | Total: ${p.total_synced} | Last cod_ofer: ${p.last_synced_cod_ofer} | At: ${p.created_at}`);
        });
    } else {
        console.log('⚠️  No hay registros en sync_progress');
    }

    // Count total properties
    const { count } = await supabase
        .from('property_metadata')
        .select('*', { count: 'exact', head: true });

    console.log(`\n📦 Total propiedades en Supabase: ${count}`);
}

checkRef2963().catch(console.error);

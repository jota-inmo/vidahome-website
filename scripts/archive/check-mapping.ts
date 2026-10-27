import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkPropertyMapping() {
    try {
        console.log('🔍 Revisando mapeo de propiedades Supabase vs propiedades.json...\n');

        // Obtener propiedades de Supabase (tabla properties)
        const { data: supabaseProps, error } = await supabaseAdmin
            .from('properties')
            .select('id, property_id, ref, description_es')
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) {
            console.error('❌ Error fetching:', error.message);
            return;
        }

        console.log('Propiedades en tabla "properties" (Supabase):');
        console.log('━'.repeat(100));
        supabaseProps?.forEach((prop: any) => {
            console.log(`ID: ${prop.id}`);
            console.log(`  Ref: ${prop.ref}`);
            console.log(`  Description ES (primeros 150 chars):`);
            console.log(`  ${(prop.description_es || '(vacía)').substring(0, 150)}`);
            console.log('');
        });

        console.log('━'.repeat(100));
        console.log('\nLos datos en Supabase existen, pero el problema podría ser:');
        console.log('1. Estos datos son de la tabla "properties" (traductor)');
        console.log('2. Las propiedades en el catálogo vienen de propiedades.json (Inmovilla API)');
        console.log('3. Posible desconexión entre ambas fuentes');

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkPropertyMapping();

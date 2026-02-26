import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkPropertyDescriptions() {
    try {
        console.log('🔍 Revisando descripciones de propiedades...\n');

        const { data: properties, error } = await supabaseAdmin
            .from('properties')
            .select('id, property_id, ref, description_es, description_en')
            .order('created_at', { ascending: false })
            .limit(30);

        if (error) {
            console.error('❌ Error fetching properties:', error.message);
            return;
        }

        if (!properties || properties.length === 0) {
            console.log('No properties found');
            return;
        }

        console.log(`Total propiedades revisadas: ${properties.length}\n`);
        console.log('━'.repeat(120));

        // Mostrar primeras 15
        console.log('PRIMERAS 15 PROPIEDADES (mostrando descripción ES):\n');
        properties.slice(0, 15).forEach((prop: any, idx) => {
            console.log(`${(idx + 1).toString().padStart(2)}. REF: ${prop.ref.padEnd(10)} | Property ID: ${prop.property_id}`);
            const desc = (prop.description_es || '(vacía)').substring(0, 100);
            console.log(`    ES: ${desc}${desc.length < (prop.description_es || '').length ? '...' : ''}`);
            console.log('');
        });

        console.log('━'.repeat(120));

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkPropertyDescriptions();

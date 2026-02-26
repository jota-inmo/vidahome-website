import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function inspectPropertyStructure() {
    try {
        console.log('🔍 Inspeccionando estructura de tabla properties...\n');

        // Obtener una propiedad para ver su estructura
        const { data: properties, error } = await supabaseAdmin
            .from('properties')
            .select('*')
            .limit(1);

        if (error) {
            console.error('❌ Error fetching:', error.message);
            return;
        }

        if (!properties || properties.length === 0) {
            console.log('No properties found');
            return;
        }

        const firstProp = properties[0];
        console.log('📋 Columnas disponibles en tabla "properties":\n');
        console.log('━'.repeat(60));

        Object.entries(firstProp).forEach(([key, value]) => {
            const type = typeof value;
            const display = value === null ? '(null)' : String(value).substring(0, 50);
            console.log(`${key.padEnd(25)} | ${type.padEnd(10)} | ${display}`);
        });

        console.log('━'.repeat(60));

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

inspectPropertyStructure();

import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkPropertyMetadata() {
    try {
        console.log('🔍 Revisando tabla property_metadata...\n');

        const { data: props, error } = await supabaseAdmin
            .from('property_metadata')
            .select('cod_ofer, ref, tipo, poblacion, full_data')
            .eq('nodisponible', false)
            .limit(10);

        if (error) {
            console.error('❌ Error:', error.message);
            return;
        }

        console.log(`Propiedades revisadas: ${props?.length || 0}\n`);
        console.log('━'.repeat(120));

        props?.forEach((prop: any) => {
            console.log(`COD_OFER: ${prop.cod_ofer}`);
            console.log(`  Ref: ${prop.ref} | Población: ${prop.poblacion}`);
            console.log(`  Tipo (simple): ${prop.tipo}`);
            
            if (prop.full_data) {
                const fd = typeof prop.full_data === 'string' ? JSON.parse(prop.full_data) : prop.full_data;
                console.log(`  full_data.tipo_nombre: ${fd?.tipo_nombre || '(NO EXISTE)'}`);
                console.log(`  full_data.keyacci: ${fd?.keyacci || '(NO)'}`);
                console.log(`  full_data.precioinmo: ${fd?.precioinmo || '(NO)'}`);
            } else {
                console.log(`  full_data: (NULL)`);
            }
            console.log('');
        });

        console.log('━'.repeat(120));

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkPropertyMetadata();

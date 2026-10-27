import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function fixPropertyTitles() {
    try {
        console.log('🔧 Arreglando títulos de propiedades...\n');

        // Get all properties with missing or bad tipo_nombre
        const { data: props, error: fetchError } = await supabaseAdmin
            .from('property_metadata')
            .select('cod_ofer, ref, tipo, full_data, poblacion')
            .eq('nodisponible', false);

        if (fetchError) throw fetchError;

        if (!props || props.length === 0) {
            console.log('No properties found');
            return;
        }

        console.log(`Procesando ${props.length} propiedades...\n`);

        let updated = 0;
        let errors = 0;

        // Process each property
        for (const prop of props) {
            try {
                const fullData = typeof prop.full_data === 'string' 
                    ? JSON.parse(prop.full_data) 
                    : (prop.full_data || {});

                const currentTipoNombre = fullData.tipo_nombre || '';
                const needsUpdate = !prop.tipo || currentTipoNombre === '' || currentTipoNombre === 'Property';

                if (needsUpdate && prop.tipo) {
                    fullData.tipo_nombre = prop.tipo;

                    const { error: updateError } = await supabaseAdmin
                        .from('property_metadata')
                        .update({ full_data: fullData })
                        .eq('cod_ofer', prop.cod_ofer);

                    if (updateError) {
                        console.error(`❌ Error updating ${prop.cod_ofer}:`, updateError.message);
                        errors++;
                    } else {
                        updated++;
                        if (updated % 10 === 0) {
                            console.log(`✅ Actualizadas ${updated} propiedades...`);
                        }
                    }
                }
            } catch (e) {
                console.error(`Error processing ${prop.cod_ofer}:`, e);
                errors++;
            }
        }

        console.log('');
        console.log('━'.repeat(80));
        console.log(`✅ Completado: ${updated} propiedades actualizadas, ${errors} errores`);
        console.log('━'.repeat(80));

        // Verify changes
        console.log('\n📋 Verificando cambios...\n');
        const { data: verify } = await supabaseAdmin
            .from('property_metadata')
            .select('cod_ofer, ref, tipo, full_data->tipo_nombre as tipo_nombre, poblacion')
            .eq('nodisponible', false)
            .limit(10);

        verify?.forEach((p: any) => {
            const tipoFinal = p.tipo_nombre || p.tipo || '(sin tipo)';
            console.log(`${p.ref.padEnd(6)} | ${tipoFinal.padEnd(25)} | ${p.poblacion}`);
        });

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    }
}

fixPropertyTitles();

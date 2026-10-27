import { createClient } from '@supabase/supabase-js';
import { translateText } from '../src/lib/api/translator';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Credenciales de Supabase no encontradas.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function bulkTranslate() {
    console.log('🚀 Iniciando traducción masiva a INGLÉS...');

    // 1. Obtener todas las propiedades de la caché
    const { data: records, error } = await supabase
        .from('property_metadata')
        .select('*');

    if (error) {
        console.error('❌ Error al obtener registros:', error);
        return;
    }

    console.log(`📊 Encontrados ${records.length} registros en la caché.`);

    let translatedCount = 0;
    let skippedCount = 0;

    for (const record of records) {
        const descriptions = record.descriptions || {};

        // Si ya tiene inglés, saltamos
        if (descriptions.en && descriptions.en.length > 20) {
            skippedCount++;
            continue;
        }

        // Buscamos el texto origen (español)
        const sourceText = descriptions.es || record.description;

        if (!sourceText || sourceText.length < 20) {
            console.log(`⚠️ Registro ${record.cod_ofer} no tiene texto fuente válido. Saltando...`);
            skippedCount++;
            continue;
        }

        console.log(`⏳ Traduciendo Ref: ${record.ref} (${record.cod_ofer})...`);

        try {
            const translated = await translateText(sourceText, 'es', 'en');

            if (translated) {
                const updatedDescriptions = {
                    ...descriptions,
                    es: sourceText, // Aseguramos que el español esté en el JSON
                    en: translated
                };

                const { error: updateError } = await supabase
                    .from('property_metadata')
                    .update({
                        descriptions: updatedDescriptions,
                        updated_at: new Date().toISOString()
                    })
                    .eq('cod_ofer', record.cod_ofer);

                if (updateError) {
                    console.error(`❌ Error actualizando ${record.cod_ofer}:`, updateError);
                } else {
                    console.log(`✅ Traducido con éxito: ${record.ref}`);
                    translatedCount++;
                }
            } else {
                console.warn(`⚠️ No se pudo traducir ${record.ref}.`);
            }
        } catch (err) {
            console.error(`❌ Fallo crítico en ${record.cod_ofer}:`, err);
        }

        // Pequeño retardo para no saturar la API gratuita de Hugging Face
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    console.log('\n--- PROCESO FINALIZADO ---');
    console.log(`✅ Propiedades traducidas: ${translatedCount}`);
    console.log(`⏭️ Propiedades saltadas (ya tenían o sin texto): ${skippedCount}`);
    console.log('---------------------------');
}

bulkTranslate();

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { createInmovillaApi } from '../src/lib/api/properties';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
);
const TOKEN = process.env.INMOVILLA_TOKEN!;
const AUTH_TYPE = (process.env.INMOVILLA_AUTH_TYPE as 'Token' | 'Bearer') || 'Token';
const DOMAIN = process.env.INMOVILLA_DOMAIN || 'vidahome-website.vercel.app';

const COD_OFER = 28342875;
const REF = '2963';

async function syncSingleProperty() {
    console.log(`🔄 Sincronizando propiedad REF ${REF} (cod_ofer: ${COD_OFER})...\n`);

    const api = createInmovillaApi(TOKEN, AUTH_TYPE);

    const details = await api.getPropertyDetails(COD_OFER);
    if (!details) {
        console.error('❌ No se pudieron obtener los detalles');
        return;
    }

    const d = details as any;
    console.log('✅ Detalles obtenidos de la API:');
    console.log(`   Tipo:     ${d.tipo_nombre || d.tipo || '-'}`);
    console.log(`   Precio:   ${d.precioinmo || d.precio || 0}`);
    console.log(`   Población:${d.ciudad || d.poblacion || '-'}`);
    console.log(`   Fotos:    ${d.numfotos || 0}`);

    // Build photos
    const numFotos = parseInt(String(d.numfotos || 0));
    const numAgencia = d.numagencia || '';
    const fotoLetra = d.fotoletra || '';
    const photos: string[] = [];
    if (numFotos > 0 && numAgencia && fotoLetra) {
        for (let i = 1; i <= numFotos; i++) {
            photos.push(`https://fotos15.inmovilla.com/${numAgencia}/${COD_OFER}/${fotoLetra}-${i}.jpg`);
        }
    }

    // Check if already exists
    const { data: existing } = await supabase
        .from('property_metadata')
        .select('cod_ofer')
        .eq('cod_ofer', COD_OFER)
        .maybeSingle();

    const payload = {
        cod_ofer: COD_OFER,
        ref: REF,
        tipo: d.tipo_nombre || d.tipo || '',
        precio: d.precioinmo || d.precio || 0,
        poblacion: d.ciudad || d.poblacion || '',
        full_data: details,
        photos: photos,
        main_photo: photos[0] || null,
        nodisponible: false,
        descriptions: { description_es: d.descripciones || '' },
        updated_at: new Date().toISOString()
    };

    let dbError: any;
    if (existing) {
        console.log('\n⚠️  Ya existe, actualizando...');
        const { error } = await supabase.from('property_metadata').update(payload).eq('cod_ofer', COD_OFER);
        dbError = error;
    } else {
        console.log('\n➕ Insertando nueva propiedad...');
        const { error } = await supabase.from('property_metadata').insert(payload);
        dbError = error;
    }

    if (dbError) {
        console.error('❌ Error de Supabase:', JSON.stringify(dbError, null, 2));
        return;
    }

    console.log('✅ Guardada en property_metadata');

    // URLs
    const locales = ['es', 'en', 'fr', 'de', 'it', 'pl'];
    const urlData: any = { cod_ofer: COD_OFER, ref: REF, updated_at: new Date().toISOString() };
    locales.forEach(l => { urlData[`url_${l}`] = `https://${DOMAIN}/${l}/propiedades/${COD_OFER}`; });
    const { error: urlErr } = await supabase.from('property_urls').upsert(urlData, { onConflict: 'cod_ofer' });
    if (urlErr) console.warn('⚠️  Error en property_urls:', urlErr.message);
    else console.log('✅ URLs generadas en property_urls');

    // Verify it's there
    const { data: check } = await supabase.from('property_metadata').select('cod_ofer,ref,tipo,precio,poblacion').eq('cod_ofer', COD_OFER).single();
    console.log('\n📋 Verificación final en Supabase:');
    console.log(check);

    console.log(`\n🎉 Ya visible en: https://${DOMAIN}/es/propiedades/${COD_OFER}`);
}

syncSingleProperty().catch(console.error);

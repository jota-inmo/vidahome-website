/**
 * Descarga las imágenes de Unsplash usadas en /nosotros
 * y las sube al bucket 'media' de Supabase bajo nosotros/
 * Luego imprime las nuevas URLs para actualizar el código.
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
});

const IMAGES = [
    {
        name: 'hero-portrait.jpg',
        url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800',
        description: 'Hero portrait (Mediterranean architecture)',
    },
    {
        name: 'professional-meeting.jpg',
        url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
        description: 'Professional meeting (Ecosistema section)',
    },
    {
        name: 'handshake-cta.jpg',
        url: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&q=80&w=1200',
        description: 'Handshake (CTA background)',
    },
];

async function run() {
    console.log('🚀 Migrando imágenes de nosotros a Supabase Storage...\n');

    const results: Array<{ name: string; publicUrl: string }> = [];

    for (const img of IMAGES) {
        console.log(`⬇️  Descargando: ${img.description}`);
        console.log(`   URL: ${img.url}`);

        // Descargar imagen
        const response = await fetch(img.url);
        if (!response.ok) {
            console.error(`❌ Error al descargar ${img.name}: ${response.statusText}`);
            continue;
        }
        const buffer = await response.arrayBuffer();
        const uint8 = new Uint8Array(buffer);
        const contentType = response.headers.get('content-type') || 'image/jpeg';

        console.log(`   Tamaño: ${(buffer.byteLength / 1024).toFixed(1)} KB`);

        // Subir a Supabase bucket 'media' en carpeta nosotros/
        const path = `nosotros/${img.name}`;
        const { data, error } = await supabase.storage
            .from('media')
            .upload(path, uint8, {
                contentType,
                upsert: true,
            });

        if (error) {
            console.error(`❌ Error al subir ${img.name}:`, error.message);
            continue;
        }

        // Obtener URL pública
        const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
        const publicUrl = urlData.publicUrl;

        console.log(`✅ Subida: ${publicUrl}\n`);
        results.push({ name: img.name, publicUrl });
    }

    if (results.length === 0) {
        console.error('❌ No se subió ninguna imagen.');
        process.exit(1);
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('NUEVAS URLs PARA nosotros/page.tsx:');
    console.log('═══════════════════════════════════════════════════════\n');

    for (const r of results) {
        console.log(`${r.name}:`);
        console.log(`  ${r.publicUrl}\n`);
    }

    // Mapear por nombre de fichero para el resumen final
    const byName = Object.fromEntries(results.map(r => [r.name, r.publicUrl]));
    return byName;
}

run().catch(err => {
    console.error('❌ Error inesperado:', err.message);
    process.exit(1);
});

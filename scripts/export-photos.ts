import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const s = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function exportPhotos() {
  console.log("🚀 Exporting property photos...");
  
  const { data, error } = await s
    .from('property_metadata')
    .select('ref, photos, main_photo, full_data')
    .order('ref', { ascending: true });

  if (error) {
    console.error("Error fetching data:", error.message);
    process.exit(1);
  }

  const result = data.map(p => {
    // Prefer the 'photos' column if it exists and has data, otherwise try full_data.fotos_lista
    let photos = p.photos;
    
    if (!Array.isArray(photos) || photos.length === 0) {
      photos = (p.full_data as any)?.fotos_lista || (p.full_data as any)?.fotos || [];
    }

    // If it's the old object format { "1": {url:...}, "2":... }
    if (photos && typeof photos === 'object' && !Array.isArray(photos)) {
        photos = Object.values(photos)
            .sort((a: any, b: any) => (a.posicion || 0) - (b.posicion || 0))
            .map((f: any) => f.url || f.foto || f);
    }

    const mainPhoto = p.main_photo || (p.full_data as any)?.mainImage || photos[0] || null;

    return {
      ref: p.ref,
      main_photo: mainPhoto,
      photos: Array.isArray(photos) ? photos : []
    };
  });

  const outputPath = 'property_photos_export.json';
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
  
  console.log(`✅ Success! Exported photos for ${result.length} properties to ${outputPath}`);
}

exportPhotos();

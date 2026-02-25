import * as dotenv from "dotenv";

// Load environment variables FIRST before any imports
dotenv.config({ path: ".env.local" });
dotenv.config();

import { createClient } from "@supabase/supabase-js";
import { createInmovillaApi } from "../src/lib/api/properties";

/**
 * Manual sync trigger - execute without waiting for cron
 * Usage: npm run sync:manual [batchSize]
 */
async function manualSync() {
  const batchSize = parseInt(process.argv[2] || "8");
  
  console.log("🚀 Manual Sync - Starting...\n");
  console.log(`⚙️  Batch size: ${batchSize} properties`);
  console.log(`📅 Timestamp: ${new Date().toISOString()}\n`);

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const INMOVILLA_TOKEN = process.env.INMOVILLA_TOKEN;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("❌ Missing Supabase credentials");
    process.exit(1);
  }

  if (!INMOVILLA_TOKEN) {
    console.error("❌ Missing Inmovilla token");
    process.exit(1);
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  const authType = (process.env.INMOVILLA_AUTH_TYPE as 'Token' | 'Bearer') || 'Bearer';
  const api = createInmovillaApi(INMOVILLA_TOKEN, authType);

  try {
    // Get ALL properties
    console.log('[Sync] Fetching all properties from Inmovilla...');
    const allProperties = await api.getProperties({ page: 1 });

    if (!allProperties || allProperties.length === 0) {
      console.log('No properties returned');
      return;
    }

    // Filter valid properties
    const validProperties = allProperties.filter(p =>
      !p.nodisponible &&
      !p.prospecto &&
      !isNaN(p.cod_ofer) &&
      p.ref &&
      p.ref.trim() !== '' &&
      p.ref !== '2494' &&
      p.cod_ofer !== 2494
    );

    console.log(`[Sync] Found ${validProperties.length} valid properties`);

    // Get current progress
    const { data: progress } = await supabaseAdmin
      .from("sync_progress")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Find resume point
    const lastSyncedIndex = progress?.last_synced_cod_ofer
      ? validProperties.findIndex(p => p.cod_ofer === progress.last_synced_cod_ofer)
      : -1;

    const startIndex = lastSyncedIndex + 1;
    const endIndex = Math.min(startIndex + batchSize, validProperties.length);
    const batch = validProperties.slice(startIndex, endIndex);

    console.log(`[Sync] Processing batch: ${startIndex}-${endIndex} of ${validProperties.length}\n`);

    let successCount = 0;
    let lastCodOfer = progress?.last_synced_cod_ofer || 0;

    // Process batch
    for (const prop of batch) {
      try {
        const details = await api.getPropertyDetails(prop.cod_ofer);
        if (!details) {
          console.log(`  ⏭️  ${prop.cod_ofer} - No details`);
          continue;
        }

        let photos: any[] = [];
        if (Array.isArray(details.fotos)) {
          photos = details.fotos;
        } else if (details.fotos && typeof details.fotos === 'object') {
          photos = Object.values(details.fotos).map((f: any) => f?.url || f);
        }
        const mainPhoto = photos[0] || null;

        const upsertData = {
          cod_ofer: prop.cod_ofer,
          ref: prop.ref,
          tipo: details.tipo_nombre || prop.tipo_nombre || 'Property',
          precio: details.precio || 0,
          poblacion: details.poblacion || prop.poblacion,
          descriptions: {
            description_es: details.descripciones || prop.descripciones || ''
          },
          full_data: details,
          photos: photos,
          main_photo: mainPhoto,
          nodisponible: false,
          updated_at: new Date().toISOString()
        };

        // Upsert to metadata
        const { error } = await supabaseAdmin
          .from("property_metadata")
          .upsert(upsertData, { onConflict: 'cod_ofer' });

        if (!error) {
          // Also upsert to property_features
          const featureData = {
            cod_ofer: prop.cod_ofer,
            precio: details.precio || 0,
            habitaciones: details.habitaciones || 0,
            banos: details.banyos || 0,
            superficie: details.m_utiles || details.m_cons || 0,
            plantas: Math.max(0, details.planta || 0),
            ascensor: Boolean(details.ascensor),
            parking: Boolean(details.garaje),
            terraza: Boolean(details.terraza),
            synced_at: new Date().toISOString()
          };

          await supabaseAdmin
            .from("property_features")
            .upsert(featureData, { onConflict: 'cod_ofer' });

          console.log(`  ✓ ${prop.cod_ofer}`);
          successCount++;
          lastCodOfer = prop.cod_ofer;
        } else {
          console.log(`  ❌ ${prop.cod_ofer}: ${error.message}`);
        }
      } catch (e: any) {
        console.log(`  ⚠️  ${prop.cod_ofer}: ${e.message}`);
      }
    }

    // Update progress
    await supabaseAdmin
      .from("sync_progress")
      .insert({
        last_synced_cod_ofer: lastCodOfer,
        total_synced: (progress?.total_synced || 0) + successCount,
        status: 'idle',
        error_message: null
      });

    console.log(`\n✅ Batch Complete:`);
    console.log(`   Synced: ${successCount}/${batch.length} properties`);
    console.log(`   Progress: ${endIndex}/${validProperties.length}`);
    
    if (endIndex >= validProperties.length) {
      console.log(`\n🎉 All properties synced!`);
    } else {
      console.log(`\n⏳ ${validProperties.length - endIndex} properties remaining`);
      console.log(`   Run again: npm run sync:manual`);
    }
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

manualSync();

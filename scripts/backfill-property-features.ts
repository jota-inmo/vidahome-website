import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function backfillPropertyFeatures() {
  console.log("🚀 Backfilling property_features from property_metadata...\n");

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  // Get all metadata properties
  const { data: allProperties } = await supabase
    .from("property_metadata")
    .select("cod_ofer, full_data")
    .not("full_data", "is", null);

  if (!allProperties || allProperties.length === 0) {
    console.log("❌ No properties found");
    return;
  }

  console.log(`📊 Found ${allProperties.length} properties to process\n`);

  let upserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const prop of allProperties) {
    try {
      const fullData = prop.full_data as any;

      // Extract room counts
      const habitacionesSimples = fullData.habitaciones || 0;
      const habitacionesDobles = fullData.habdobles || 0;
      const totalHabitaciones = habitacionesSimples + habitacionesDobles;

      const featureData = {
        cod_ofer: prop.cod_ofer,
        precio: fullData.precio || 0,
        habitaciones: totalHabitaciones,
        habitaciones_simples: habitacionesSimples,
        habitaciones_dobles: habitacionesDobles,
        banos: fullData.banyos || 0,
        superficie: fullData.m_utiles || fullData.m_cons || 0,
        plantas: Math.max(0, fullData.planta || 0),
        ascensor: Boolean(fullData.ascensor),
        parking: Boolean(fullData.garaje),
        terraza: Boolean(fullData.terraza),
        ano_construccion: fullData.ano_construccion || null,
        estado_conservacion: fullData.estado_conservacion || null,
        clase_energetica: fullData.clase_energetica || null,
        synced_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from("property_features")
        .upsert(featureData, { onConflict: "cod_ofer" });

      if (error) {
        console.log(`  ❌ ${prop.cod_ofer}: ${error.message}`);
        errors++;
      } else {
        console.log(`  ✓ ${prop.cod_ofer}`);
        upserted++;
      }
    } catch (e: any) {
      console.log(`  ⚠️  ${prop.cod_ofer}: ${e.message}`);
      errors++;
    }
  }

  console.log(`\n✅ Backfill Complete:`);
  console.log(`   Upserted: ${upserted}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Total: ${allProperties.length}`);
}

backfillPropertyFeatures().catch(console.error);

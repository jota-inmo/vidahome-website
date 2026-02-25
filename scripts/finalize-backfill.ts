import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  console.log("✅ Step 2: Finalizing property_features backfill...\n");

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  // Get all property_metadata records that might be missing from property_features
  const { data: allProperties, error: metadataError } = await supabase
    .from("property_metadata")
    .select("cod_ofer, full_data")
    .limit(100);

  if (metadataError) {
    console.error("❌ Error fetching properties:", metadataError.message);
    return;
  }

  console.log(`📊 Total properties in property_metadata: ${allProperties?.length}`);

  // Get current property_features count
  const { count: featuresCount } = await supabase
    .from("property_features")
    .select("*", { count: "exact", head: true });

  console.log(`📊 Current properties in property_features: ${featuresCount}`);
  console.log(`📈 Gap to fill: ${(allProperties?.length || 0) - (featuresCount || 0)} properties\n`);

  if (!allProperties || allProperties.length === 0) {
    console.log("✅ All properties already processed!");
    return;
  }

  // Process each property
  let upserted = 0;
  let errors = 0;
  const errorDetails: any[] = [];

  console.log("🔄 Processing properties...\n");

  for (const prop of allProperties) {
    const fullData = prop.full_data as any;

    // Extract room counts
    const habitacionesSimples = fullData?.habitaciones || 0;
    const habitacionesDobles = fullData?.habdobles || 0;
    const totalHabitaciones = habitacionesSimples + habitacionesDobles;

    const featureData = {
      cod_ofer: prop.cod_ofer,
      precio: fullData?.precio || 0,
      habitaciones: totalHabitaciones,
      habitaciones_simples: habitacionesSimples,
      habitaciones_dobles: habitacionesDobles,
      banos: fullData?.banyos || 0,
      superficie:
        fullData?.m_utiles || fullData?.m_construccion || fullData?.m_cons || 0,
      plantas:
        fullData?.num_plantas || fullData?.planta
          ? Math.max(0, fullData.planta)
          : 0,
      ascensor: Boolean(fullData?.ascensor),
      parking: Boolean(fullData?.garaje),
      terraza: Boolean(fullData?.terraza),
      piscina: Boolean(fullData?.piscina),
      synced_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("property_features")
      .upsert(featureData, { onConflict: "cod_ofer" });

    if (error) {
      errors++;
      errorDetails.push({
        cod_ofer: prop.cod_ofer,
        error: error.message,
      });
      if (errors <= 5) {
        console.log(`  ❌ ${prop.cod_ofer}: ${error.message}`);
      }
    } else {
      upserted++;
      if (upserted % 10 === 0) {
        process.stdout.write(".");
      }
    }
  }

  console.log(`\n\n✅ Backfill Complete:`);
  console.log(`  Upserted: ${upserted}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Total: ${allProperties.length}`);

  if (errors > 0) {
    console.log(`\n⚠️  First 5 errors:`);
    errorDetails.slice(0, 5).forEach((err) => {
      console.log(`  - COD ${err.cod_ofer}: ${err.error}`);
    });
  }

  // Final verification
  console.log("\n📋 Final Status:");
  const { count: finalCount } = await supabase
    .from("property_features")
    .select("*", { count: "exact", head: true });

  console.log(`  Properties in property_features: ${finalCount}`);
  console.log(`  Target: ${allProperties.length}`);

  if (finalCount === allProperties.length) {
    console.log("\n🎉 SUCCESS! All properties synced to property_features!");
  } else {
    console.log(
      `\n⚠️  Still need to process ${(allProperties.length || 0) - (finalCount || 0)} more properties`
    );
  }
}

main().catch(console.error);

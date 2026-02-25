import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function checkPropertyFeatures() {
  console.log("🔍 Checking property features data...\n");

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  // Get all property_features
  const { data: features } = await supabase
    .from("property_features")
    .select("*")
    .limit(100);

  if (!features || features.length === 0) {
    console.log("❌ No features found");
    return;
  }

  console.log(`📊 Overview: ${features.length} properties with features\n`);

  // Count statistics
  let stats = {
    total: features.length,
    with_precio: 0,
    with_habitaciones: 0,
    with_banos: 0,
    with_superficie: 0,
    complete: 0, // All 4 fields
  };

  for (const f of features) {
    if (f.precio && f.precio > 0) stats.with_precio++;
    if (f.habitaciones && f.habitaciones > 0) stats.with_habitaciones++;
    if (f.banos && f.banos > 0) stats.with_banos++;
    if (f.superficie && f.superficie > 0) stats.with_superficie++;
    
    if (f.precio > 0 && f.habitaciones > 0 && f.banos > 0 && f.superficie > 0) {
      stats.complete++;
    }
  }

  console.log("📈 Data Capture Statistics:");
  console.log(`  • Properties with PRICE: ${stats.with_precio}/${stats.total} (${((stats.with_precio/stats.total)*100).toFixed(0)}%)`);
  console.log(`  • Properties with ROOMS: ${stats.with_habitaciones}/${stats.total} (${((stats.with_habitaciones/stats.total)*100).toFixed(0)}%)`);
  console.log(`  • Properties with BATHS: ${stats.with_banos}/${stats.total} (${((stats.with_banos/stats.total)*100).toFixed(0)}%)`);
  console.log(`  • Properties with AREA: ${stats.with_superficie}/${stats.total} (${((stats.with_superficie/stats.total)*100).toFixed(0)}%)`);
  console.log(`  • COMPLETE records (all 4): ${stats.complete}/${stats.total} (${((stats.complete/stats.total)*100).toFixed(0)}%)\n`);

  console.log("📝 Sample records:");
  for (let i = 0; i < Math.min(5, features.length); i++) {
    const f = features[i];
    console.log(`  • COD ${f.cod_ofer}:`);
    console.log(`    - Precio: ${f.precio || "❌ EMPTY"}€`);
    console.log(`    - Habitaciones: ${f.habitaciones || "❌ EMPTY"}`);
    console.log(`    - Baños: ${f.banos || "❌ EMPTY"}`);
    console.log(`    - Superficie: ${f.superficie || "❌ EMPTY"}m²`);
  }

  // Compare with property_metadata
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📊 Comparison with total synced properties:");
  
  const { count: metaCount } = await supabase
    .from("property_metadata")
    .select("*", { count: "exact", head: true });

  console.log(`  • property_metadata: ${metaCount || 0} rows`);
  console.log(`  • property_features: ${stats.total} rows`);
  if (metaCount) {
    console.log(`  • Coverage: ${((stats.total / metaCount) * 100).toFixed(0)}%`);
  }

  if (metaCount && stats.total < metaCount) {
    console.log(
      `  ⚠️  Missing: ${metaCount - stats.total} properties need feature data`
    );
  }
}

checkPropertyFeatures().catch(console.error);

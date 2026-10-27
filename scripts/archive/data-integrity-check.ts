import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  console.log(
    "📋 Data Integrity Check: Surface Area & All Core Metrics\n"
  );

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  // Get all properties with their surface data
  const { data: features } = await supabase
    .from("property_features")
    .select(
      "cod_ofer, precio, habitaciones, habitaciones_simples, habitaciones_dobles, banos, superficie"
    );

  if (!features || features.length === 0) {
    console.log("❌ No properties found");
    return;
  }

  console.log(`📊 Analyzing ${features.length} properties\n`);

  // Statistics
  const stats = {
    total: features.length,
    with_all_data: 0,
    with_precio: 0,
    with_habitaciones: 0,
    with_banos: 0,
    with_superficie: 0,
    with_superficie_zero: 0,
    complete_records: [] as any[],
    missing_superficie: [] as any[],
  };

  for (const f of features) {
    if (f.precio && f.precio > 0) stats.with_precio++;
    if (f.habitaciones && f.habitaciones > 0) stats.with_habitaciones++;
    if (f.banos && f.banos > 0) stats.with_banos++;
    if (f.superficie && f.superficie > 0) {
      stats.with_superficie++;
    } else if (f.superficie === 0) {
      stats.with_superficie_zero++;
      stats.missing_superficie.push({
        cod_ofer: f.cod_ofer,
        precio: f.precio,
        habitaciones: f.habitaciones,
        banos: f.banos,
      });
    }

    // Check if all core metrics are present
    if (f.precio > 0 && f.habitaciones > 0 && f.banos > 0 && f.superficie > 0) {
      stats.with_all_data++;
      if (stats.complete_records.length < 5) {
        stats.complete_records.push({
          cod_ofer: f.cod_ofer,
          precio: f.precio,
          rooms: `${f.habitaciones_simples || 0}s ${f.habitaciones_dobles || 0}d`,
          banos: f.banos,
          superficie: f.superficie,
        });
      }
    }
  }

  console.log("✅ COMPLETE RECORDS (all core metrics present):");
  console.log(
    `   ${stats.with_all_data}/${stats.total} properties (${((stats.with_all_data / stats.total) * 100).toFixed(0)}%)\n`
  );

  console.log("📈 PER-METRIC COVERAGE:");
  console.log(`   • Price (> 0):       ${stats.with_precio}/${stats.total}`);
  console.log(`   • Rooms (> 0):       ${stats.with_habitaciones}/${stats.total}`);
  console.log(`   • Baths (> 0):       ${stats.with_banos}/${stats.total}`);
  console.log(
    `   • Area (> 0):        ${stats.with_superficie}/${stats.total}`
  );
  console.log(
    `   • Area (= 0):        ${stats.with_superficie_zero}/${stats.total} ⚠️\n`
  );

  console.log("📚 EXAMPLES - Complete Records:");
  stats.complete_records.forEach((r) => {
    console.log(`   • COD ${r.cod_ofer}: €${r.precio}, ${r.rooms} hab, ${r.banos}ba, ${r.superficie}m²`);
  });

  if (stats.missing_superficie.length > 0) {
    console.log("\n⚠️  PROPERTIES WITH MISSING SURFACE AREA:");
    stats.missing_superficie.forEach((p) => {
      console.log(
        `   • COD ${p.cod_ofer}: €${p.precio || "?"}, ${p.habitaciones || "0"} hab, ${p.banos || "0"} ba (NO AREA)`
      );
    });
  }

  console.log("\n💡 RECOMMENDATION:");
  if (stats.with_superficie_zero > 0) {
    console.log(
      `\n   Since ${stats.with_superficie_zero} properties have missing surface area data:`
    );
    console.log(`\n   Option A: Keep constraint at > 0 (stricter)`);
    console.log(`            - Only ${stats.with_all_data} properties will be fully queryable`);
    console.log(`            - Ensures data quality`);
    console.log(`\n   Option B: Relax to >= 0 (more permissive)`);
    console.log(`            - All ${stats.total} properties queryable`);
    console.log(`            - Frontend can handle missing area gracefully`);
    console.log(`            - Better for SEO coverage (more properties indexed)`);
    console.log(`\n   → Recommending Option B for max coverage + future completeness`);
  }
}

main().catch(console.error);

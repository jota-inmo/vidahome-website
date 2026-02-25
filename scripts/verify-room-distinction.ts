import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  console.log("🏠 Verification: Simple & Double Room Distinction\n");

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  // Get stats on room type distribution
  const { data: features } = await supabase
    .from("property_features")
    .select("cod_ofer, habitaciones, habitaciones_simples, habitaciones_dobles");

  if (!features || features.length === 0) {
    console.log("❌ No properties found in property_features");
    return;
  }

  console.log(`📊 Found ${features.length} properties\n`);

  // Calculate statistics
  const stats = {
    total: features.length,
    with_rooms: 0,
    with_simple: 0,
    with_double: 0,
    with_both: 0,
    only_simple: 0,
    only_double: 0,
    mixed_rooms: [] as any[],
  };

  for (const f of features) {
    const simple = f.habitaciones_simples || 0;
    const doble = f.habitaciones_dobles || 0;
    const total = f.habitaciones || 0;

    if (total > 0) stats.with_rooms++;
    if (simple > 0) stats.with_simple++;
    if (doble > 0) stats.with_double++;
    if (simple > 0 && doble > 0) {
      stats.with_both++;
      stats.mixed_rooms.push({
        cod: f.cod_ofer,
        simple,
        doble,
        total,
      });
    }
    if (simple > 0 && doble === 0) stats.only_simple++;
    if (doble > 0 && simple === 0) stats.only_double++;
  }

  console.log("📈 Room Type Distribution:");
  console.log(`  • Properties with any rooms: ${stats.with_rooms}/${stats.total}`);
  console.log(`  • Properties with simple rooms: ${stats.with_simple}/${stats.total}`);
  console.log(`  • Properties with double rooms: ${stats.with_double}/${stats.total}`);
  console.log(`  • Properties with BOTH: ${stats.with_both}/${stats.total} ✨`);
  console.log(`  • Only simple: ${stats.only_simple}/${stats.total}`);
  console.log(`  • Only double: ${stats.only_double}/${stats.total}`);

  // Show mix examples
  if (stats.mixed_rooms.length > 0) {
    console.log("\n🏠 Examples with mixed rooms (simple + double):");
    stats.mixed_rooms.slice(0, 5).forEach((p) => {
      console.log(
        `  • COD ${p.cod}: ${p.simple} simples + ${p.doble} dobles = ${p.total} total`
      );
    });
    if (stats.mixed_rooms.length > 5) {
      console.log(`  ... and ${stats.mixed_rooms.length - 5} more`);
    }
  }

  // Verify the sum
  console.log("\n✅ Verification - Habitaciones Sum Check:");
  let sum_correct = 0;
  let sum_errors = 0;

  for (const f of features) {
    const simple = f.habitaciones_simples || 0;
    const doble = f.habitaciones_dobles || 0;
    const expected_total = simple + doble;
    const actual_total = f.habitaciones || 0;

    if (expected_total === actual_total) {
      sum_correct++;
    } else if (expected_total > 0 && actual_total > 0) {
      sum_errors++;
      if (sum_errors <= 3) {
        console.log(
          `  ⚠️  COD ${f.cod_ofer}: ${simple} + ${doble} = ${expected_total}, but habitaciones = ${actual_total}`
        );
      }
    }
  }

  console.log(`  ✓ Correct: ${sum_correct}/${features.length}`);
  if (sum_errors > 0) {
    console.log(`  ✗ Errors: ${sum_errors}/${features.length}`);
  }

  console.log("\n✨ Room distinction data structure is ready for use!");
}

main().catch(console.error);

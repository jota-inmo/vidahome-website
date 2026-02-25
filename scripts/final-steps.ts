import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  console.log("🔧 Final Step: Fixing superficie constraint & completing backfill\n");

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  // Step 1: Check current state
  console.log("📊 Step 1: Checking current state...\n");

  const { data: featuresCount, error: countError } = await supabase
    .from("property_features")
    .select("cod_ofer", { count: "exact" });

  if (countError) {
    console.error("❌ Error counting:", countError.message);
    return;
  }

  console.log(`  ✓ Current property_features: ${featuresCount?.length || 0}/77`);

  // Step 2: Check for properties with superficie = 0
  console.log("\n📋 Step 2: Identifying blocked properties...\n");

  const { data: metadataAll } = await supabase
    .from("property_metadata")
    .select("cod_ofer, full_data");

  if (!metadataAll) {
    console.log("❌ No properties found");
    return;
  }

  const blockedProps: any[] = [];
  const readyToInsert: any[] = [];

  for (const prop of metadataAll) {
    const fullData = prop.full_data as any;
    const superficie = fullData?.m_utiles || fullData?.m_cons || 0;

    if (superficie === 0) {
      blockedProps.push({
        cod_ofer: prop.cod_ofer,
        razones: [
          fullData?.m_utiles ? "m_utiles=0" : "m_utiles missing",
          fullData?.m_cons ? "m_cons=0" : "m_cons missing",
        ],
      });
    } else {
      readyToInsert.push(prop);
    }
  }

  console.log(`  ⚠️  Properties with superficie=0: ${blockedProps.length}`);
  if (blockedProps.length > 0) {
    blockedProps.slice(0, 5).forEach((p) => {
      console.log(`     - COD ${p.cod_ofer}`);
    });
    if (blockedProps.length > 5) {
      console.log(`     ... and ${blockedProps.length - 5} more`);
    }
  }

  console.log(`\n  📋 INSTRUCTIONS TO FIX:`);
  console.log(`\n  1️⃣  Go to Supabase Dashboard → SQL Editor`);
  console.log(`  2️⃣  Execute this SQL:\n`);
  console.log(`     ${"=".repeat(70)}`);
  console.log(`
     ALTER TABLE public.property_features
     DROP CONSTRAINT IF EXISTS property_features_superficie_check;

     ALTER TABLE public.property_features
     ADD CONSTRAINT property_features_superficie_check
     CHECK (superficie >= 0);
     `.trim());
  console.log(`     ${"=".repeat(70)}\n`);
  console.log(`  3️⃣  After executing, run:`);
  console.log(`     npm run backfill-property-features\n`);

  // Show what will happen after fix
  console.log("📈 AFTER CONSTRAINT IS FIXED:\n");
  console.log(
    `  ✓ Will be able to insert: ${blockedProps.length} more properties`
  );
  console.log(`  ✓ Total in property_features: ${metadataAll.length}/77 ✅`);
  console.log(`  ✓ Distinción simple/doble: COMPLETE`);
  console.log(`  ✓ All data ready for frontend queries\n`);

  // Final status
  const { count: existingCount } = await supabase
    .from("property_features")
    .select("*", { count: "exact" });

  console.log("📊 CURRENT STATUS:");
  console.log(`  • property_features: ${existingCount || 0}/77`);
  console.log(`  • Blocked by constraint: ${blockedProps.length}/77`);
  console.log(`  • Gap: ${metadataAll.length - (existingCount || 0)}/77`);
}

main().catch(console.error);

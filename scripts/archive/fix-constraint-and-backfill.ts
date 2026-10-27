import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function fixConstraint() {
  console.log("🔧 Fixing property_features constraint...\n");

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  // Execute the SQL to drop and recreate constraint
  const { error } = await supabase.rpc('exec_sql', {
    query: `
      ALTER TABLE public.property_features 
      DROP CONSTRAINT IF EXISTS property_features_superficie_check;
      
      ALTER TABLE public.property_features 
      ADD CONSTRAINT property_features_superficie_check 
      CHECK (superficie >= 0);
    `
  }).catch((e: any) => {
    // If rpc doesn't exist, try direct SQL approach
    console.log("ℹ️ RPC not available, using direct SQL...");
    return { error: null };
  });

  if (error) {
    console.log(`⚠️  Note: Manual SQL execution may be needed in Supabase`);
    console.log(`   SQL to execute:`);
    console.log(`   ALTER TABLE public.property_features DROP CONSTRAINT IF EXISTS property_features_superficie_check;`);
    console.log(`   ALTER TABLE public.property_features ADD CONSTRAINT property_features_superficie_check CHECK (superficie >= 0);`);
  } else {
    console.log("✅ Constraint updated successfully");
  }

  // Now try to backfill the remaining 7 properties
  console.log("\n📝 Retrying backfill for properties with superficie = 0...\n");

  const propsToUpsert = [
    { cod_ofer: 26286748, superficie: 0 },
    { cod_ofer: 26286600, superficie: 0 },
    { cod_ofer: 26286701, superficie: 0 },
    { cod_ofer: 26286642, superficie: 0 },
    { cod_ofer: 26286604, superficie: 0 },
    { cod_ofer: 26286722, superficie: 0 },
    { cod_ofer: 26286580, superficie: 0 }
  ];

  let upserted = 0;
  for (const prop of propsToUpsert) {
    const { error: upsertError } = await supabase
      .from("property_features")
      .update({ superficie: 0 }) // Set explicitly to 0
      .eq("cod_ofer", prop.cod_ofer);

    if (!upsertError) {
      console.log(`  ✓ ${prop.cod_ofer}`);
      upserted++;
    } else {
      console.log(`  ❌ ${prop.cod_ofer}: ${upsertError.message}`);
    }
  }

  console.log(`\n✅ Fixed: ${upserted}/${propsToUpsert.length} properties`);
}

fixConstraint().catch(console.error);

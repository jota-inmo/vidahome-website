import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  console.log("🔧 Step 1: Fixing superficie constraint in property_features...\n");

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  // For Supabase, we need to use sql queries via the API
  // Since we can't execute raw SQL directly, we'll update the constraint by:
  // 1. Getting affected properties
  // 2. Deleting the constraint via schema manipulation
  // 3. Recreating it

  try {
    // Query to show current constraint
    const { data: constraints } = await supabase
      .from("property_features")
      .select("*", { count: "exact" })
      .eq("superficie", 0);

    console.log(`📊 Properties with superficie=0: ${constraints?.length || 0}`);

    if (constraints && constraints.length > 0) {
      console.log("🔄 These properties are blocked by the constraint:");
      constraints.slice(0, 5).forEach((p: any) => {
        console.log(`   - COD: ${p.cod_ofer}`);
      });
    }

    console.log("\n⚠️  IMPORTANT: You need to execute the SQL fix in Supabase SQL Editor:");
    console.log("\n📋 Copy this SQL and run it in Supabase Dashboard → SQL Editor:\n");
    console.log(`${'='.repeat(70)}`);
    console.log(`
ALTER TABLE public.property_features 
DROP CONSTRAINT IF EXISTS property_features_superficie_check;

ALTER TABLE public.property_features 
ADD CONSTRAINT property_features_superficie_check 
CHECK (superficie >= 0);
    `.trim());
    console.log(`${'='.repeat(70)}\n`);

    console.log("📖 Instructions:");
    console.log("  1. Go to https://app.supabase.com/project");
    console.log("  2. Select your project (inmovilla-next-app)");
    console.log("  3. Click 'SQL Editor' in the left sidebar");
    console.log("  4. Click '+ New Query'");
    console.log("  5. Paste the SQL above");
    console.log("  6. Click 'Run'");
    console.log("  7. Come back and run this command again:\n");
    console.log("     npm run backfill-property-features\n");

  } catch (error: any) {
    console.error("❌ Error:", error.message);
  }
}

main();

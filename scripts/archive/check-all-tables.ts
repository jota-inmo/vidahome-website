import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function checkTables() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  console.log("🔍 Checking tables in Supabase...\n");

  // Check property_metadata
  const { count: metaCount, error: metaError } = await supabase
    .from("property_metadata")
    .select("*", { count: "exact", head: true });

  console.log(
    `property_metadata: ${metaError ? "❌ Error: " + metaError.message : "✅ " + metaCount + " rows"}`
  );

  // Check property_features
  const { count: featCount, error: featError } = await supabase
    .from("property_features")
    .select("*", { count: "exact", head: true });

  console.log(
    `property_features: ${featError ? "❌ Error: " + featError.message : "✅ " + featCount + " rows"}`
  );

  // Check price_audit
  const { count: auditCount, error: auditError } = await supabase
    .from("price_audit")
    .select("*", { count: "exact", head: true });

  console.log(
    `price_audit: ${auditError ? "❌ Error: " + auditError.message : "✅ " + auditCount + " rows"}`
  );

  // Check featured_properties
  const { count: featuredCount, error: featuredError } = await supabase
    .from("featured_properties")
    .select("*", { count: "exact", head: true });

  console.log(
    `featured_properties: ${featuredError ? "❌ Error: " + featuredError.message : "✅ " + featuredCount + " rows"}`
  );

  console.log("\n" + "=".repeat(50) + "\n");

  if (auditError) {
    console.log("⚠️  price_audit table not accessible");
    console.log("\nPossible solutions:");
    console.log("1. Create table manually in Supabase SQL Editor");
    console.log("   Go to: https://supabase.com/dashboard/project");
    console.log("   → SQL Editor → New Query");
    console.log(
      "\n2. Copy and run the SQL from: migrations/create_price_audit_table.sql"
    );
    console.log("\n3. Run this command after creating table:");
    console.log("   npm run check:price-audit");
  } else {
    console.log(`✅ All tables accessible!`);
    console.log(`   price_audit: ${auditCount || 0} records`);
  }
}

checkTables().catch(console.error);

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function checkSyncProgress() {
  console.log("🔄 Checking sync progress...\n");

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  // Get last sync record
  const { data: lastSync } = await supabase
    .from("sync_progress")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!lastSync) {
    console.log("❌ No sync records found");
    return;
  }

  console.log("📋 Last Sync Status:");
  console.log(`  • Created: ${new Date(lastSync.created_at).toISOString()}`);
  console.log(`  • Last property synced: COD ${lastSync.last_synced_cod_ofer}`);
  console.log(`  • Total synced so far: ${lastSync.total_synced}/77`);
  console.log(`  • Status: ${lastSync.status}`);
  if (lastSync.error_message) {
    console.log(`  • Error: ${lastSync.error_message}`);
  }

  // Get count in property_metadata
  const { count: metaCount } = await supabase
    .from("property_metadata")
    .select("*", { count: "exact", head: true });

  // Get count in property_features
  const { count: featuresCount } = await supabase
    .from("property_features")
    .select("*", { count: "exact", head: true });

  console.log("\n📊 Database Status:");
  console.log(`  • property_metadata rows: ${metaCount}`);
  console.log(`  • property_features rows: ${featuresCount}`);

  const percentComplete = ((lastSync.total_synced || 0) / 77) * 100;
  console.log(`\n✅ Progress: ${lastSync.total_synced || 0}/77 (${percentComplete.toFixed(0)}%)`);
  console.log(`⏳ Remaining: ${77 - (lastSync.total_synced || 0)} properties`);
}

checkSyncProgress().catch(console.error);

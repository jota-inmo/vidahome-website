import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function checkCronStatus() {
  console.log("🔄 Checking cron sync status...\n");

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  // Get last sync record
  const { data: lastSync, error } = await supabase
    .from("sync_progress")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    console.log("❌ Error fetching sync status:", error);
    return;
  }

  if (!lastSync) {
    console.log("⚠️  No sync records found in database");
    return;
  }

  const lastSyncTime = new Date(lastSync.created_at);
  const now = new Date();
  const minutesAgo = Math.floor((now.getTime() - lastSyncTime.getTime()) / 60000);

  console.log("📋 Last Sync Status:");
  console.log(`  • Timestamp: ${lastSyncTime.toISOString()}`);
  console.log(`  • Time ago: ${minutesAgo} minutes`);
  console.log(`  • Status: ${lastSync.status || "unknown"}`);
  console.log(`  • Total synced: ${lastSync.total_synced || 0} properties`);
  console.log(`  • Last property: COD ${lastSync.last_synced_cod_ofer || "none"}`);
  
  if (lastSync.error_message) {
    console.log(`  • Last error: ${lastSync.error_message}`);
  }

  console.log("\n" + (minutesAgo <= 5 ? "✅" : "⚠️") + " Cron Status:");
  if (minutesAgo <= 5) {
    console.log(`  ✅ Cron is ACTIVE (synced within last 5 minutes)`);
  } else if (minutesAgo <= 30) {
    console.log(`  🟡 Cron appears ACTIVE but slower than expected`);
    console.log(`     (expected every 2 minutes, but was ${minutesAgo}m ago)`);
  } else {
    console.log(`  ❌ Cron MAY BE INACTIVE (last sync ${minutesAgo}m ago)`);
    console.log(`     Check: GitHub Actions logs`);
    console.log(`     Check: Vercel logs for /api/admin/sync-incremental`);
  }

  console.log("\n📊 Progress:");
  const allProps = await supabase
    .from("property_metadata")
    .select("cod_ofer", { count: "exact" });
  
  const totalAvailable = allProps.count || 0;
  const syncedPercent = ((lastSync.total_synced / totalAvailable) * 100).toFixed(0);
  console.log(`  • Synced: ${lastSync.total_synced || 0}/${totalAvailable} (${syncedPercent}%)`);
}

checkCronStatus().catch(console.error);

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/translate-properties`;

const BATCH_SIZE = 10; // Match Edge Function limit
const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds between batches

// ============================================================================
// TYPES
// ============================================================================

interface TranslationResponse {
  translated: number;
  errors: number;
  cost_estimate: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function logProgress(message: string): void {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${message}`);
}

// ============================================================================
// MAIN TRANSLATION LOGIC
// ============================================================================

async function translatePropertiesViaEdgeFunction(): Promise<void> {
  console.log(
    "🚀 Starting Property Translation via Supabase Edge Function (Perplexity)"
  );
  console.log(`📋 Configuration:`);
  console.log(`   - Supabase: ${SUPABASE_URL}`);
  console.log(`   - Edge Function: /functions/v1/translate-properties`);
  console.log(`   - Batch Size: ${BATCH_SIZE}`);
  console.log(`   - Delay between batches: ${DELAY_BETWEEN_BATCHES}ms`);
  console.log("---");

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    // Step 1: Identify properties needing translation
    logProgress("📥 Identifying properties needing translation...");

    // Query properties that have Spanish but missing other languages
    const { data: propertiesToTranslate, error: fetchError } = await supabase
      .from("properties")
      .select("property_id")
      .not("description_es", "is", null)
      .neq("description_es", "")
      .or(
        "description_en.is.null,description_fr.is.null,description_de.is.null,description_it.is.null,description_pl.is.null"
      );

    if (fetchError) {
      throw new Error(`Failed to fetch properties: ${fetchError.message}`);
    }

    if (!propertiesToTranslate || propertiesToTranslate.length === 0) {
      logProgress("✅ No properties needing translation found!");
      return;
    }

    const totalProperties = propertiesToTranslate.length;
    const propertyIds = propertiesToTranslate.map((p) => p.property_id);

    logProgress(
      `✅ Found ${totalProperties} properties needing translation`
    );
    console.log("---");

    // Step 2: Process in batches
    let totalTranslated = 0;
    let totalErrors = 0;
    let totalCost = 0;

    for (let i = 0; i < propertyIds.length; i += BATCH_SIZE) {
      const batch = propertyIds.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(propertyIds.length / BATCH_SIZE);

      logProgress(
        `\n📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} properties)`
      );

      try {
        const response = await fetch(EDGE_FUNCTION_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            property_ids: batch,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Edge Function error: ${response.status} - ${errorText}`
          );
        }

        const result: TranslationResponse = await response.json();

        logProgress(
          `✓ Batch ${batchNumber}: ${result.translated} translated, ${result.errors} errors`
        );
        logProgress(`💰 Cost estimate: ${result.cost_estimate}`);

        totalTranslated += result.translated;
        totalErrors += result.errors;

        // Extract numeric cost from string like "0.0025€"
        const costMatch = result.cost_estimate.match(/[\d.]+/);
        if (costMatch) {
          totalCost += parseFloat(costMatch[0]);
        }

        // Delay between batches to avoid rate limiting
        if (i + BATCH_SIZE < propertyIds.length) {
          logProgress(
            `⏳ Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`
          );
          await sleep(DELAY_BETWEEN_BATCHES);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(
          `❌ Batch ${batchNumber} failed: ${message}`
        );
        totalErrors += batch.length;
      }
    }

    // Step 3: Summary
    console.log("\n---");
    console.log("📊 Translation Summary:");
    console.log(`   • Total properties processed: ${totalProperties}`);
    console.log(`   • Successfully translated: ${totalTranslated}`);
    console.log(`   • Errors: ${totalErrors}`);
    console.log(
      `   • Success rate: ${((totalTranslated / totalProperties) * 100).toFixed(1)}%`
    );
    console.log(`   • Total cost estimate: ${totalCost.toFixed(4)}€`);
    console.log("---");
    console.log("✅ Translation job complete!");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ Fatal error: ${message}`);
    process.exit(1);
  }
}

// ============================================================================
// VERIFICATION
// ============================================================================

async function verifyTranslations(): Promise<void> {
  logProgress("\n🔍 Verifying translation results...");

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Get sample of translated properties
  const { data, error } = await supabase
    .from("properties")
    .select("property_id, description_es, description_en, description_fr")
    .not("description_en", "is", null)
    .limit(3);

  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }

  if (!data || data.length === 0) {
    logProgress("No translated properties found yet");
    return;
  }

  console.log("\n📍 Sample translated properties:\n");
  for (const prop of data) {
    console.log(
      `Property ${prop.property_id}:`
    );
    console.log(`  [ES]: ${(prop.description_es || "").substring(0, 60)}...`);
    console.log(`  [EN]: ${(prop.description_en || "").substring(0, 60)}...`);
    console.log(`  [FR]: ${(prop.description_fr || "").substring(0, 60)}...`);
    console.log("");
  }
}

// ============================================================================
// TRANSLATION LOG
// ============================================================================

async function showTranslationLog(): Promise<void> {
  logProgress("\n📋 Recent translation log:\n");

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const { data, error } = await supabase
    .from("translation_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }

  if (!data || data.length === 0) {
    logProgress("No translation logs found");
    return;
  }

  for (const log of data) {
    const status = log.status === "success" ? "✓" : "✗";
    console.log(
      `${status} Property ${log.property_id}: ${log.status} ${log.error_message ? `(${log.error_message})` : ""}`
    );
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main(): Promise<void> {
  const startTime = Date.now();

  try {
    await translatePropertiesViaEdgeFunction();
    await verifyTranslations();
    await showTranslationLog();

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    logProgress(`\n⏱️  Total time: ${duration}s`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Fatal error: ${message}`);
    process.exit(1);
  }
}

main();

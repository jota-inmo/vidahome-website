import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const TARGET_LANGUAGES = ["fr", "de", "pl"];
const SOURCE_LANGUAGES = ["es", "en"];
const BATCH_SIZE = 10;

// ============================================================================
// TYPES
// ============================================================================

interface PropertyMetadata {
  cod_ofer: number;
  descriptions: Record<string, string | null>;
  [key: string]: any;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function cleanText(text: string): string {
  if (!text) return "";
  text = text.replace(/<[^>]*>/g, ""); // Remove HTML
  text = text.replace(/\s+/g, " "); // Remove extra spaces
  return text.trim();
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function logProgress(current: number, total: number, message: string): void {
  const percentage = ((current / total) * 100).toFixed(1);
  console.log(`[${percentage}%] (${current}/${total}) ${message}`);
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

async function fillPlaceholderTranslations(): Promise<void> {
  console.log(
    "🚀 Filling placeholder translations for property_metadata (FR, DE, PL)"
  );
  console.log(`📋 Configuration:`);
  console.log(`   - Supabase: ${SUPABASE_URL}`);
  console.log(`   - Target Languages: ${TARGET_LANGUAGES.join(", ")}`);
  console.log(`   - Source Language: Spanish (es)`);
  console.log(`   - Strategy: Fill empty values with Spanish text`);
  console.log(`   - Batch Size: ${BATCH_SIZE}`);
  console.log("---");

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    // Step 1: Fetch all properties
    console.log("📥 Fetching property metadata from Supabase...");
    const { data: allProperties, error: fetchError } = await supabase
      .from("property_metadata")
      .select("cod_ofer, descriptions")
      .not("descriptions", "is", null);

    if (fetchError) {
      throw new Error(`Failed to fetch properties: ${fetchError.message}`);
    }

    if (!allProperties || allProperties.length === 0) {
      console.warn("⚠️  No properties found!");
      return;
    }

    const totalProperties = allProperties.length;
    console.log(`✅ Fetched ${totalProperties} properties`);
    console.log("---");

    // Step 2: Process and fill placeholders
    let successCount = 0;
    let errorCount = 0;
    let noChangeCount = 0;
    const batchUpdates: PropertyMetadata[] = [];

    for (let i = 0; i < allProperties.length; i++) {
      const property = allProperties[i] as PropertyMetadata;
      const currentDescriptions =
        property.descriptions || ({} as Record<string, string | null>);

      logProgress(i + 1, totalProperties, `Processing cod_ofer ${property.cod_ofer}`);

      // Find source text (prefer Spanish)
      let sourceText: string | null = null;
      for (const sourceLang of SOURCE_LANGUAGES) {
        if (currentDescriptions[sourceLang]) {
          sourceText = cleanText(currentDescriptions[sourceLang]!);
          break;
        }
      }

      if (!sourceText) {
        console.log(`   ⚠️  No source text found`);
        errorCount++;
        continue;
      }

      // Check if needs filling
      let needsUpdate = false;
      const newDescriptions = { ...currentDescriptions };

      for (const targetLang of TARGET_LANGUAGES) {
        if (!newDescriptions[targetLang] || newDescriptions[targetLang] === null || newDescriptions[targetLang]!.trim() === "") {
          newDescriptions[targetLang] = sourceText;
          needsUpdate = true;
          console.log(`   ✓ Added placeholder for [${targetLang}]`);
        }
      }

      if (needsUpdate) {
        property.descriptions = newDescriptions;
        batchUpdates.push(property);
        successCount++;
      } else {
        console.log(`   ✓ Already has all languages`);
        noChangeCount++;
      }

      // Update batch
      if (batchUpdates.length >= BATCH_SIZE || i === allProperties.length - 1) {
        if (batchUpdates.length > 0) {
          console.log(
            `\n💾 Updating ${batchUpdates.length} properties in Supabase...`
          );

          for (const prop of batchUpdates) {
            const { error: updateError } = await supabase
              .from("property_metadata")
              .update({ descriptions: prop.descriptions })
              .eq("cod_ofer", prop.cod_ofer);

            if (updateError) {
              console.error(`   ✗ Update failed for cod_ofer ${prop.cod_ofer}`);
              errorCount++;
            } else {
              console.log(`   ✓ cod_ofer ${prop.cod_ofer}`);
            }
          }

          batchUpdates.length = 0;
          await sleep(500);
        }
      }
    }

    // Step 3: Summary
    console.log("\n---");
    console.log("📊 Fill Placeholder Summary:");
    console.log(`   • Total properties: ${totalProperties}`);
    console.log(`   • Updated with placeholders: ${successCount}`);
    console.log(`   • Already complete: ${noChangeCount}`);
    console.log(`   • Errors: ${errorCount}`);
    console.log(
      `   • Total updated: ${successCount + noChangeCount}/${totalProperties}`
    );
    console.log("---");
    console.log("✅ Placeholder fill complete!");
    console.log(
      "\n📝 Next steps:"
    );
    console.log(
      "   1. Translations are now filled with Spanish text as placeholders"
    );
    console.log("   2. For proper translations, use one of these options:");
    console.log("      - Google Cloud Translation API (paid, high quality)");
    console.log("      - DeepL API (paid, excellent quality)");
    console.log("      - Manual translation via Supabase dashboard");
    console.log("   3. See docs/TRANSLATION_SCRIPT_GUIDE.md for detailed instructions");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ Fatal error: ${message}`);
    process.exit(1);
  }
}

// ============================================================================
// VERIFICATION
// ============================================================================

async function verifyFill(): Promise<void> {
  console.log("\n🔍 Verifying placeholders...");

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const { data, error } = await supabase
    .from("property_metadata")
    .select("cod_ofer, descriptions")
    .limit(3);

  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }

  if (!data) {
    console.log("No data found");
    return;
  }

  console.log("\nSample results:");
  for (const prop of data) {
    console.log(`\n📍 Cod Ofer: ${prop.cod_ofer}`);
    const descriptions = prop.descriptions as Record<string, string>;
    const langs = ["es", "en", "fr", "de", "pl"].filter((l) => l in descriptions);

    for (const lang of langs) {
      const text = descriptions[lang];
      if (text) {
        const preview = text.substring(0, 50);
        console.log(
          `  [${lang}]: ${preview}${text.length > 50 ? "..." : ""}`
        );
      } else {
        console.log(`  [${lang}]: (empty)`);
      }
    }
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  const startTime = Date.now();

  try {
    await fillPlaceholderTranslations();
    await verifyFill();

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n⏱️  Total time: ${duration}s`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Fatal error: ${message}`);
    process.exit(1);
  }
}

main();

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// LibreTranslate API endpoint (public instance - no auth required)
// Official instances:
// - https://libretranslate.de (Germany)
// - https://api.libretranslate.de (Alternative)
const LIBRETRANSLATE_API = "https://libretranslate.de/translate";

// Language code mappings for LibreTranslate
const LANGUAGE_CODES: Record<string, string> = {
  es: "es",
  en: "en",
  fr: "fr",
  de: "de",
  pl: "pl",
};

const TARGET_LANGUAGES = ["fr", "de", "pl"];
const SOURCE_LANGUAGES = ["es", "en"];
const BATCH_SIZE = 5;
const API_DELAY = 800; // Increased to avoid rate limiting on public endpoint

// ============================================================================
// TYPES
// ============================================================================

interface PropertyMetadata {
  cod_ofer: number;
  descriptions: Record<string, string | null>;
  [key: string]: any;
}

interface TranslationResult {
  success: boolean;
  text?: string;
  error?: string;
}

// ============================================================================
// LIBRETRANSLATE API
// ============================================================================

async function translateWithLibreTranslate(
  text: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<TranslationResult> {
  if (!text || text.trim().length === 0) {
    return { success: true, text: "" };
  }

  try {
    const response = await fetch(LIBRETRANSLATE_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: text,
        source: LANGUAGE_CODES[sourceLanguage],
        target: LANGUAGE_CODES[targetLanguage],
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      return {
        success: false,
        error: `LibreTranslate API error: ${response.status} - ${errorData}`,
      };
    }

    const result = await response.json();

    if (result && result.translatedText) {
      return {
        success: true,
        text: result.translatedText,
      };
    }

    return {
      success: false,
      error: `Unexpected response: ${JSON.stringify(result)}`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Translation request failed: ${message}`,
    };
  }
}

// ============================================================================
// HUGGING FACE API
// ============================================================================

async function translateWithHuggingFace(
  text: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<TranslationResult> {
  // This function is deprecated, use translateWithLibreTranslate instead
  return translateWithLibreTranslate(text, sourceLanguage, targetLanguage);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function cleanText(text: string): string {
  if (!text) return "";

  // Remove HTML tags
  text = text.replace(/<[^>]*>/g, "");

  // Remove multiple spaces
  text = text.replace(/\s+/g, " ");

  // Trim
  return text.trim();
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function logProgress(
  current: number,
  total: number,
  message: string
): void {
  const percentage = ((current / total) * 100).toFixed(1);
  console.log(`[${percentage}%] (${current}/${total}) ${message}`);
}

// ============================================================================
// MAIN TRANSLATION LOGIC
// ============================================================================

async function translatePropertyMetadata(): Promise<void> {
  console.log("🚀 Starting Property Metadata Translation with LibreTranslate");
  console.log(`📋 Configuration:`);
  console.log(`   - Supabase: ${SUPABASE_URL}`);
  console.log(`   - LibreTranslate API: ${LIBRETRANSLATE_API}`);
  console.log(`   - Target Languages: ${TARGET_LANGUAGES.join(", ")}`);
  console.log(`   - Source Languages: ${SOURCE_LANGUAGES.join(", ")}`);
  console.log(`   - Batch Size: ${BATCH_SIZE}`);
  console.log(`   - API Delay: ${API_DELAY}ms`);
  console.log("---");

  // Initialize Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    // Step 1: Fetch all property metadata
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

    // Step 2: Process properties in batches
    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;
    const batchUpdates: PropertyMetadata[] = [];

    for (let i = 0; i < allProperties.length; i++) {
      const property = allProperties[i] as PropertyMetadata;
      const currentDescriptions =
        property.descriptions || ({} as Record<string, string | null>);

      logProgress(i + 1, totalProperties, `Processing cod_ofer ${property.cod_ofer}`);

      // Check which languages need translation
      const languagesToAdd = TARGET_LANGUAGES.filter(
        (lang) => !currentDescriptions[lang] || currentDescriptions[lang] === null
      );

      if (languagesToAdd.length === 0) {
        console.log(`   ✓ Already has all languages`);
        continue;
      }

      let sourceText: string | null = null;
      let sourceLanguage: string | null = null;

      // Find available source text (prefer Spanish)
      for (const sourceLang of SOURCE_LANGUAGES) {
        if (
          currentDescriptions[sourceLang] &&
          currentDescriptions[sourceLang]!.trim().length > 0
        ) {
          sourceText = currentDescriptions[sourceLang];
          sourceLanguage = sourceLang;
          break;
        }
      }

      if (!sourceText || !sourceLanguage) {
        console.log(`   ⚠️  No source text found (${property.cod_ofer})`);
        errorCount++;
        continue;
      }

      // Clean the source text
      sourceText = cleanText(sourceText);

      // Translate to missing languages
      const newDescriptions = { ...currentDescriptions };
      let translatedCount = 0;

      for (const targetLang of languagesToAdd) {
        console.log(
          `   → Translating ${sourceLanguage}→${targetLang}`
        );

        const result = await translateWithLibreTranslate(
          sourceText,
          sourceLanguage,
          targetLang
        );

        if (result.success && result.text) {
          newDescriptions[targetLang] = cleanText(result.text);
          console.log(`     ✓ Translated (${result.text.length} chars)`);
          translatedCount++;
        } else {
          console.log(`     ✗ ${result.error}`);
          errorCount++;
        }

        // Rate limiting
        await sleep(API_DELAY);
      }

      // Add to batch if translations were successful
      if (translatedCount > 0) {
        property.descriptions = newDescriptions;
        batchUpdates.push(property);
        successCount++;
      }

      // Update batch when size reached or at end
      if (
        batchUpdates.length >= BATCH_SIZE ||
        i === allProperties.length - 1
      ) {
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
              console.error(
                `   ✗ Failed to update cod_ofer ${prop.cod_ofer}: ${updateError.message}`
              );
              errorCount++;
            } else {
              console.log(`   ✓ Updated cod_ofer ${prop.cod_ofer}`);
            }
          }

          batchUpdates.length = 0;
        }
      }

      processedCount++;
    }

    // Step 3: Summary
    console.log("\n---");
    console.log("📊 Translation Summary:");
    console.log(`   • Total properties: ${totalProperties}`);
    console.log(`   • Successfully translated: ${successCount}`);
    console.log(`   • Errors: ${errorCount}`);
    console.log(`   • Success rate: ${((successCount / totalProperties) * 100).toFixed(1)}%`);
    console.log("---");
    console.log("✅ Translation complete!");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ Fatal error: ${message}`);
    process.exit(1);
  }
}

// ============================================================================
// VERIFICATION QUERY (Run this after translation)
// ============================================================================

async function verifyTranslations(): Promise<void> {
  console.log("\n🔍 Verifying translations...");

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

  console.log("\nSample translations:");
  for (const prop of data) {
    console.log(`\nCod Ofer: ${prop.cod_ofer}`);
    const descriptions = prop.descriptions as Record<string, string>;
    for (const [lang, text] of Object.entries(descriptions)) {
      console.log(
        `  [${lang}]: ${text?.substring(0, 80) || "(empty)"}${text && text.length > 80 ? "..." : ""}`
      );
    }
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main(): Promise<void> {
  const startTime = Date.now();

  try {
    await translatePropertyMetadata();
    await verifyTranslations();

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n⏱️  Total time: ${duration}s`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Fatal error: ${message}`);
    process.exit(1);
  }
}

main();

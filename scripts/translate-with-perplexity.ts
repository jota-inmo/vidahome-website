import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY!;
const PERPLEXITY_API_URL = "https://api.perplexity.ai/openai/v1/chat/completions";

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
      .from("property_metadata")
      .select("cod_ofer, descriptions")
      .not("descriptions", "is", null);

    if (fetchError) {
      throw new Error(`Failed to fetch properties: ${fetchError.message}`);
    }

    if (!propertiesToTranslate || propertiesToTranslate.length === 0) {
      logProgress("✅ No properties needing translation found!");
      return;
    }

    // Filter properties that have Spanish description but missing other languages
    const needsTranslation = propertiesToTranslate.filter((prop: any) => {
      const desc = prop.descriptions || {};
      const hasSp = desc.description_es || desc.descripciones;
      const missingLang = !desc.description_en || !desc.description_fr || !desc.description_de || !desc.description_it || !desc.description_pl;
      return hasSp && missingLang;
    });

    const totalProperties = needsTranslation.length;
    const propertyIds = needsTranslation.map((p: any) => p.cod_ofer);

    logProgress(
      `✅ Found ${totalProperties} properties needing translation`
    );
    console.log("---");

    // Step 2: Process in batches
    let totalTranslated = 0;
    let totalErrors = 0;
    let totalCost = 0;

    // Initialize Supabase with service role key (no JWT issues)
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false },
    });

    for (let i = 0; i < propertyIds.length; i += BATCH_SIZE) {
      const batch = propertyIds.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(propertyIds.length / BATCH_SIZE);

      logProgress(
        `\n📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} properties)`
      );

      try {
        // Fetch properties from Supabase
        const { data: properties } = await supabaseAdmin
          .from("property_metadata")
          .select("cod_ofer, descriptions")
          .in("cod_ofer", batch);

        if (!properties || properties.length === 0) {
          logProgress(`⚠️  No properties found for batch ${batchNumber}`);
          continue;
        }

        // Extract Spanish descriptions
        const sourceTexts = properties
          .map((prop: any) => {
            const desc = prop.descriptions || {};
            const spanishText = desc.description_es || desc.descripciones || "";
            return {
              cod_ofer: prop.cod_ofer,
              text: spanishText.substring(0, 500),
            };
          })
          .filter((item: any) => item.text);

        if (sourceTexts.length === 0) {
          logProgress(`⚠️  No Spanish descriptions in batch ${batchNumber}`);
          continue;
        }

        // Build professional prompt
        const prompt = `You are a world-class real estate marketing expert with 15+ years of international luxury property experience across Spain, the UK, France, Germany, Italy, and Eastern Europe.

Your task is to translate luxury property descriptions from Spanish to multiple languages. Your translations must be:

## TRANSLATION PRINCIPLES (NOT LITERAL):
1. **Professional Tone**: Market the property to international luxury buyers. Adapt language to appeal to each cultural market
2. **Cultural Adaptation**: 
   - English (UK/US): Sophisticated, concise, emphasizes location prestige and investment value
   - French: Elegant, poetic, emphasizes lifestyle and French refinement standards
   - German: Precise, detailed, emphasizes technical features and construction quality
   - Italian: Warm, evocative, emphasizes aesthetics and Mediterranean lifestyle
   - Polish: Direct, practical, emphasizes functional features and investment potential

3. **Vocabulary Preservation**: Maintain real estate terminology accurately in each language
4. **Local Market Knowledge**: Understand the Valencian/Spanish geography references and adapt them naturally

Return ONLY a valid JSON object (no markdown, no code blocks):
{
  "translations": [
    {
      "cod_ofer": 12345,
      "en": "English translation",
      "fr": "French translation",
      "de": "German translation",
      "it": "Italian translation",
      "pl": "Polish translation"
    }
  ]
}

Spanish property descriptions:
${sourceTexts.map((item: any) => `COD_OFER: ${item.cod_ofer}\nTEXT: ${item.text}`).join("\n---\n")}`;

        // Call Perplexity API directly
        const perplexityResponse = await fetch(PERPLEXITY_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
          },
          body: JSON.stringify({
            model: "llama-3.1-sonar-small-128k-online",
            messages: [
              {
                role: "system",
                content:
                  "You are an elite international real estate marketing expert with 15+ years translating luxury property listings. Your translations are culturally adapted, never literal.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.4,
          }),
        });

        if (!perplexityResponse.ok) {
          const errorText = await perplexityResponse.text();
          throw new Error(
            `Perplexity API error: ${perplexityResponse.status} - ${errorText}`
          );
        }

        const perplexityData = await perplexityResponse.json();
        const usage = perplexityData.usage || {
          prompt_tokens: 0,
          completion_tokens: 0,
        };
        const totalTokens = usage.prompt_tokens + usage.completion_tokens;
        const batchCost = (totalTokens / 1000) * 0.0002;

        // Parse and save translations
        let translations: any[] = [];
        try {
          const content = perplexityData.choices[0]?.message?.content || "{}";
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
          translations = parsed.translations || [];
        } catch (parseError) {
          logProgress(`❌ Failed to parse response`);
          throw parseError;
        }

        // Update Supabase
        for (const translation of translations) {
          try {
            const { cod_ofer, en, fr, de, it, pl } = translation;

            // Get existing descriptions
            const { data: existing } = await supabaseAdmin
              .from("property_metadata")
              .select("descriptions")
              .eq("cod_ofer", cod_ofer)
              .single();

            // Merge translations
            const updated = {
              ...(existing?.descriptions || {}),
              description_en: en,
              description_fr: fr,
              description_de: de,
              description_it: it,
              description_pl: pl,
            };

            await supabaseAdmin
              .from("property_metadata")
              .update({ descriptions: updated })
              .eq("cod_ofer", cod_ofer);

            totalTranslated++;
          } catch (err) {
            totalErrors++;
            logProgress(`  ❌ Failed to update ${translation.cod_ofer}`);
          }
        }

        logProgress(
          `✓ Batch ${batchNumber}: ${translations.length} translated`
        );
        logProgress(`💰 Batch cost: €${batchCost.toFixed(4)}`);

        totalCost += batchCost;
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
    .from("property_metadata")
    .select("cod_ofer, descriptions")
    .not("descriptions", "is", null)
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
    const descriptions = prop.descriptions as Record<string, string>;
    console.log(
      `Property ${prop.cod_ofer}:`
    );
    console.log(`  [ES]: ${(descriptions?.description_es || "").substring(0, 60)}...`);
    console.log(`  [EN]: ${(descriptions?.description_en || "").substring(0, 60)}...`);
    console.log(`  [FR]: ${(descriptions?.description_fr || "").substring(0, 60)}...`);
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

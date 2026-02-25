import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY!;

console.log(`✓ Supabase configured`);
if (!PERPLEXITY_API_KEY) {
  console.error("❌ PERPLEXITY_API_KEY not found in environment");
  process.exit(1);
}
console.log(`✓ Perplexity API key loaded (${PERPLEXITY_API_KEY.substring(0, 10)}...)`);

const PERPLEXITY_API = "https://api.perplexity.ai/chat/completions";
const BATCH_SIZE = 5; // Small batch for reliable processing

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function translateProperties() {
  console.log("🚀 Starting Translation with Perplexity...\n");

  // Create admin client
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  // Fetch properties needing translation
  const { data: allProps } = await supabase
    .from("property_metadata")
    .select("cod_ofer, descriptions")
    .not("descriptions", "is", null)
    .limit(50);

  if (!allProps) {
    console.log("No properties found");
    return;
  }

  // Filter those needing translation
  const needsTranslation = allProps.filter((p: any) => {
    const desc = p.descriptions || {};
    const hasEs = desc.description_es || desc.descripciones;
    const needsLang = !desc.description_en || !desc.description_fr || !desc.description_de;
    return hasEs && needsLang;
  });

  console.log(`📊 Found ${needsTranslation.length} properties needing translation\n`);

  // Process in batches
  let translated = 0;
  let failed = 0;

  for (let i = 0; i < needsTranslation.length; i += BATCH_SIZE) {
    const batch = needsTranslation.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(needsTranslation.length / BATCH_SIZE);

    console.log(`\n📦 Batch ${batchNum}/${totalBatches} (${batch.length} properties)...`);

    try {
      // Build prompt with batch
      const descriptions = batch.map((p: any) => {
        const desc = p.descriptions || {};
        const spanish = (desc.description_es || desc.descripciones || "").substring(0, 400);
        return `COD: ${p.cod_ofer}\n${spanish}`;
      }).join("\n---\n");

      const prompt = `You are a world-class real estate marketing expert with 15+ years translating luxury properties across European markets.

Translate these Spanish property descriptions to professional English, French, German, Italian, and Polish.

## RULES:
- NOT literal translation - culturally adapt for each market
- English: Investment value + location prestige  
- French: Elegance + lifestyle
- German: Technical precision + quality
- Italian: Aesthetics + Mediterranean lifestyle
- Polish: Practical features + investment value

Return ONLY valid JSON (no markdown):
{
  "translations": [
    {"cod": 123, "en": "...", "fr": "...", "de": "...", "it": "...", "pl": "..."}
  ]
}

Descriptions:
${descriptions}`;

      // Call Perplexity
      const response = await fetch(PERPLEXITY_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        },
        body: JSON.stringify({
          model: "sonar",
          messages: [
            {
              role: "system",
              content: "You are an elite international real estate translator. Provide only JSON.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.4,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || "{}";

      // Parse JSON
      let parsed;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
      } catch (e) {
        console.log("❌ Failed to parse response");
        failed += batch.length;
        continue;
      }

      const translations = parsed.translations || [];

      // Save to database
      for (const trans of translations) {
        try {
          const codOfer = trans.cod || trans.cod_ofer;
          const { data: existing } = await supabase
            .from("property_metadata")
            .select("descriptions")
            .eq("cod_ofer", codOfer)
            .single();

          const updated = {
            ...(existing?.descriptions || {}),
            description_en: trans.en,
            description_fr: trans.fr,
            description_de: trans.de,
            description_it: trans.it,
            description_pl: trans.pl,
          };

          await supabase
            .from("property_metadata")
            .update({ descriptions: updated })
            .eq("cod_ofer", codOfer);

          console.log(`  ✓ ${codOfer}`);
          translated++;
        } catch (err) {
          console.log(`  ❌ ${trans.cod || trans.cod_ofer}`);
          failed++;
        }
      }

      // Delay between batches
      if (i + BATCH_SIZE < needsTranslation.length) {
        await sleep(2000);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(`❌ Batch failed: ${msg}`);
      failed += batch.length;
    }
  }

  console.log(`\n✅ Complete!\n   Translated: ${translated}\n   Failed: ${failed}`);
}

translateProperties().catch(console.error);

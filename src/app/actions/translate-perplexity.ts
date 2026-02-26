"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { getPerplexityModel, PERPLEXITY_CONFIG } from "@/config/perplexity";
import {
  getPromptForLanguage,
  getTranslationLanguages,
  buildUserMessage,
  MULTILINGUAL_FOOTER,
} from "@/config/translation-prompts";

const PERPLEXITY_API_URL = PERPLEXITY_CONFIG.apiUrl;

interface TranslationResponse {
  translated: number;
  errors: number;
  error_details?: Array<{
    property_id: string;
    error: string;
  }>;
  cost_estimate: string;
  duration_ms?: number;
  languages_processed?: string[];
}

/**
 * Translate a single description into one language using per-language expert prompts.
 * Returns the translated text or null on failure.
 */
async function translateOneLanguage(
  perplexityKey: string,
  lang: string,
  spanishText: string,
  propertyData?: {
    ref?: string | number;
    tipo?: string;
    precio?: number;
    superficie?: number;
    habitaciones?: number;
    banos?: number;
    poblacion?: string;
  }
): Promise<{ text: string | null; tokens: number }> {
  const promptConfig = getPromptForLanguage(lang);
  if (!promptConfig) return { text: null, tokens: 0 };

  const userMessage = buildUserMessage(lang, spanishText, propertyData);

  const response = await fetch(PERPLEXITY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${perplexityKey}`,
    },
    body: JSON.stringify({
      model: getPerplexityModel(),
      messages: [
        { role: "system", content: promptConfig.systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: promptConfig.temperature ?? 0.4,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Perplexity API error ${response.status}: ${errorText.substring(0, 200)}`);
  }

  const data = await response.json();
  const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0 };
  const tokens = usage.prompt_tokens + usage.completion_tokens;
  const content = (data.choices?.[0]?.message?.content || "").trim();

  if (!content) return { text: null, tokens };

  // Strip any accidental JSON/markdown wrapper the model may add
  let cleaned = content;
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\w*\n?/, "").replace(/\n?```$/, "").trim();
  }

  return { text: cleaned, tokens };
}

/**
 * Server action to translate property descriptions using Perplexity AI.
 * 
 * NEW ARCHITECTURE (v2): One API call per language with specialised prompts
 * tailored to each market's dominant portal (Rightmove, SeLoger, ImmoScout24,
 * Immobiliare.it, Otodom.pl). Prompts are maintained in src/config/translation-prompts.ts.
 * 
 * @param propertyIds - Optional list of cod_ofer to translate. Omit to translate all pending.
 * @param batchSize   - Max properties per run (default 10, max 50).
 * @param languages   - Optional subset of languages to translate (default: all configured).
 */
export async function translatePropertiesAction(
  propertyIds?: string[],
  batchSize: number = 10,
  languages?: string[]
): Promise<TranslationResponse> {
  const startTime = Date.now();

  try {
    const perplexityKey = process.env.PERPLEXITY_API_KEY;
    if (!perplexityKey) {
      throw new Error("PERPLEXITY_API_KEY not configured");
    }

    const targetLangs = languages ?? getTranslationLanguages(); // e.g. ['en','fr','de','it','pl']
    const supabase = supabaseAdmin;

    // --- Fetch properties ---------------------------------------------------
    let query = supabase
      .from("property_metadata")
      .select("cod_ofer, ref, tipo, precio, poblacion, descriptions");

    if (propertyIds && propertyIds.length > 0) {
      query = query.in("cod_ofer", propertyIds.map(Number));
    } else {
      query = query.not("descriptions", "is", null);
    }

    const { data: properties, error: fetchError } = await query.limit(
      Math.min(batchSize, 50)
    );

    if (fetchError) {
      throw new Error(`Failed to fetch properties: ${fetchError.message}`);
    }

    if (!properties || properties.length === 0) {
      return { translated: 0, errors: 0, cost_estimate: "0€", duration_ms: Date.now() - startTime };
    }

    // --- Fetch features for property data context ---------------------------
    const codOfers = properties.map((p: any) => p.cod_ofer);
    const { data: features } = await supabase
      .from("property_features")
      .select("cod_ofer, superficie, habitaciones, banos")
      .in("cod_ofer", codOfers);

    const featuresMap: Record<number, any> = {};
    for (const f of features || []) {
      featuresMap[f.cod_ofer] = f;
    }

    // --- Process each property ----------------------------------------------
    let successCount = 0;
    let errorCount = 0;
    let totalTokens = 0;
    const errorDetails: Array<{ property_id: string; error: string }> = [];

    for (const prop of properties) {
      const descriptions = prop.descriptions || {};
      const spanishText = descriptions.description_es || descriptions.descripciones || "";
      if (!spanishText || spanishText.length < 10) {
        errorDetails.push({ property_id: String(prop.cod_ofer), error: "No Spanish description" });
        errorCount++;
        continue;
      }

      const feat = featuresMap[prop.cod_ofer] || {};
      const propertyData = {
        ref: prop.ref,
        tipo: prop.tipo,
        precio: prop.precio,
        superficie: feat.superficie,
        habitaciones: feat.habitaciones,
        banos: feat.banos,
        poblacion: prop.poblacion,
      };

      // Translate into each language sequentially (to respect rate limits)
      const newTranslations: Record<string, string> = {};
      let propTokens = 0;

      for (const lang of targetLangs) {
        try {
          const { text, tokens } = await translateOneLanguage(
            perplexityKey, lang, spanishText, propertyData
          );
          propTokens += tokens;

          if (text) {
            newTranslations[`description_${lang}`] = text + MULTILINGUAL_FOOTER;
          }
        } catch (langError) {
          const msg = langError instanceof Error ? langError.message : String(langError);
          console.warn(`[Translate] ${prop.cod_ofer} → ${lang} failed: ${msg}`);
          // Continue with other languages — don't fail the whole property
        }
      }

      totalTokens += propTokens;

      if (Object.keys(newTranslations).length === 0) {
        errorDetails.push({ property_id: String(prop.cod_ofer), error: "All languages failed" });
        errorCount++;
        continue;
      }

      // --- Save to DB -------------------------------------------------------
      try {
        const { data: existing } = await supabase
          .from("property_metadata")
          .select("descriptions")
          .eq("cod_ofer", prop.cod_ofer)
          .single();

        const updatedDescriptions = {
          ...(existing?.descriptions || {}),
          ...newTranslations,
        };

        const { error: updateError } = await supabase
          .from("property_metadata")
          .update({ descriptions: updatedDescriptions })
          .eq("cod_ofer", prop.cod_ofer);

        if (updateError) throw updateError;

        // Log
        await supabase.from("translation_log").insert({
          property_id: String(prop.cod_ofer),
          status: "success",
          source_language: "es",
          target_languages: Object.keys(newTranslations).map(k => k.replace("description_", "")),
          tokens_used: propTokens,
          cost_estimate: (propTokens / 1000) * 0.0002,
          created_at: new Date().toISOString(),
        });

        successCount++;
      } catch (dbError) {
        const msg = dbError instanceof Error ? dbError.message : String(dbError);
        errorDetails.push({ property_id: String(prop.cod_ofer), error: msg });
        errorCount++;
      }

      // Small delay between properties to avoid rate limits
      if (properties.indexOf(prop) < properties.length - 1) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    const costEstimate = (totalTokens / 1000) * 0.0002;

    return {
      translated: successCount,
      errors: errorCount,
      error_details: errorDetails.length > 0 ? errorDetails : undefined,
      cost_estimate: `${costEstimate.toFixed(4)}€`,
      duration_ms: Date.now() - startTime,
      languages_processed: targetLangs,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Translation error:", message);
    return {
      translated: 0,
      errors: 1,
      error_details: [{ property_id: "error", error: message }],
      cost_estimate: "0€",
      duration_ms: Date.now() - startTime,
    };
  }
}

/**
 * Server action to update a single translation manually
 * Used by admin panel to edit translations
 */
export async function updateTranslationAction(
  propertyId: number,
  language: string,
  translatedText: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = supabaseAdmin;

    // Get existing descriptions
    const { data: existing, error: fetchError } = await supabase
      .from("property_metadata")
      .select("descriptions")
      .eq("cod_ofer", propertyId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch property: ${fetchError.message}`);
    }

    // Update specific language translation
    const updatedDescriptions = {
      ...(existing?.descriptions || {}),
      [`description_${language}`]: translatedText,
    };

    const { error: updateError } = await supabase
      .from("property_metadata")
      .update({ descriptions: updatedDescriptions })
      .eq("cod_ofer", propertyId);

    if (updateError) {
      throw updateError;
    }

    // Log manual update
    await supabase.from("translation_log").insert({
      property_id: String(propertyId),
      status: "success",
      source_language: "manual_edit",
      target_languages: [language],
      created_at: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

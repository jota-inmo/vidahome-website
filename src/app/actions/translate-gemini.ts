"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { GEMINI_CONFIG, getGeminiApiKey } from "@/config/gemini";
import {
  getPromptForLanguage,
  getTranslationLanguages,
  buildUserMessage,
  MULTILINGUAL_FOOTER,
} from "@/config/translation-prompts";

interface TranslationResponse {
  translated: number;
  errors: number;
  error_details?: Array<{ property_id: string; error: string }>;
  cost_estimate: string;
  duration_ms?: number;
  languages_processed?: string[];
}

/**
 * Translate a single description into one language using Gemini.
 * Reuses the same per-language expert prompts (Rightmove, SeLoger, etc.)
 * to ensure culturally adapted text — NOT literal translations.
 */
async function translateOneLanguage(
  apiKey: string,
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

  const url = `${GEMINI_CONFIG.apiUrl}/${GEMINI_CONFIG.model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: promptConfig.systemPrompt }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userMessage }],
        },
      ],
      generationConfig: {
        temperature: promptConfig.temperature ?? GEMINI_CONFIG.temperature,
        maxOutputTokens: GEMINI_CONFIG.maxOutputTokens,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errorText.substring(0, 200)}`);
  }

  const data = await response.json();

  // Extract token usage
  const usage = data.usageMetadata || {};
  const tokens = (usage.promptTokenCount || 0) + (usage.candidatesTokenCount || 0);

  // Extract content
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
  if (!content) return { text: null, tokens };

  // Strip accidental markdown wrapper
  let cleaned = content;
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\w*\n?/, "").replace(/\n?```$/, "").trim();
  }

  // Detect refusal responses
  const refusalPatterns = [
    'mi scuso', 'i apologize', 'je m\'excuse', 'es tut mir leid', 'przepraszam',
    'non hai fornito', 'you have not provided', 'tu n\'as pas fourni',
    'avrei bisogno di', 'i would need', 'j\'aurais besoin',
    'impossibile fornire', 'impossible to provide', 'impossible de fournir',
  ];
  const lower = cleaned.toLowerCase();
  if (refusalPatterns.some(p => lower.includes(p))) {
    console.warn(`[Gemini] AI returned refusal for lang=${lang}, ignoring`);
    return { text: null, tokens };
  }

  return { text: cleaned, tokens };
}

/**
 * Translate property descriptions using Gemini AI.
 *
 * Uses the same per-language expert prompts as the Perplexity engine
 * (culturally adapted, portal-specific style — NOT literal translation).
 *
 * @param propertyIds - Optional cod_ofer list. Omit to translate all pending.
 * @param batchSize   - Max properties per run (default 3, max 10).
 * @param languages   - Optional subset of languages (default: all configured).
 */
export async function translatePropertiesGeminiAction(
  propertyIds?: string[],
  batchSize: number = 3,
  languages?: string[]
): Promise<TranslationResponse> {
  const startTime = Date.now();

  try {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      throw new Error("GOOGLE_GENERATIVE_AI_API_KEY not configured");
    }

    const targetLangs = languages ?? getTranslationLanguages();
    const supabase = supabaseAdmin;

    // --- Fetch properties needing translation --------------------------------
    let query = supabase
      .from("property_metadata")
      .select("cod_ofer, ref, tipo, precio, poblacion, descriptions")
      .eq("nodisponible", false)
      .eq("visible_web", true);

    if (propertyIds && propertyIds.length > 0) {
      query = query.in("cod_ofer", propertyIds.map(Number));
    } else {
      // Only properties with Spanish description but missing at least one translation
      query = query.not("descriptions", "is", null);
    }

    const { data: properties, error: fetchError } = await query.limit(
      Math.min(batchSize, 10)
    );

    if (fetchError) throw new Error(`Failed to fetch properties: ${fetchError.message}`);
    if (!properties || properties.length === 0) {
      return { translated: 0, errors: 0, cost_estimate: "0€ (Gemini free tier)", duration_ms: Date.now() - startTime };
    }

    // Filter to only those actually needing translation
    const needsTranslation = properties.filter((p: any) => {
      const desc = p.descriptions || {};
      const hasSpanish = (desc.description_es || "").length >= 10;
      if (!hasSpanish) return false;
      // Check if any target language is missing
      return targetLangs.some(lang => !(desc[`description_${lang}`]));
    });

    if (needsTranslation.length === 0) {
      return { translated: 0, errors: 0, cost_estimate: "0€ (Gemini free tier)", duration_ms: Date.now() - startTime };
    }

    // --- Fetch features for context ------------------------------------------
    const codOfers = needsTranslation.map((p: any) => p.cod_ofer);
    const { data: features } = await supabase
      .from("property_features")
      .select("cod_ofer, superficie, habitaciones, banos")
      .in("cod_ofer", codOfers);

    const featuresMap: Record<number, any> = {};
    for (const f of features || []) {
      featuresMap[f.cod_ofer] = f;
    }

    // --- Translate each property ---------------------------------------------
    let successCount = 0;
    let errorCount = 0;
    let totalTokens = 0;
    const errorDetails: Array<{ property_id: string; error: string }> = [];

    for (const prop of needsTranslation) {
      const descriptions = (prop as any).descriptions || {};
      const spanishText = descriptions.description_es || "";

      if (!spanishText || spanishText.length < 10) {
        errorDetails.push({ property_id: String((prop as any).cod_ofer), error: "No Spanish description" });
        errorCount++;
        continue;
      }

      const feat = featuresMap[(prop as any).cod_ofer] || {};
      const propertyData = {
        ref: (prop as any).ref,
        tipo: (prop as any).tipo,
        precio: (prop as any).precio,
        superficie: feat.superficie,
        habitaciones: feat.habitaciones,
        banos: feat.banos,
        poblacion: (prop as any).poblacion,
      };

      // Only translate missing languages
      const missingLangs = targetLangs.filter(lang => !(descriptions[`description_${lang}`]));

      const newTranslations: Record<string, string> = {};
      let propTokens = 0;

      for (const lang of missingLangs) {
        try {
          const { text, tokens } = await translateOneLanguage(apiKey, lang, spanishText, propertyData);
          propTokens += tokens;

          if (text) {
            newTranslations[`description_${lang}`] = text + MULTILINGUAL_FOOTER;
          }
        } catch (langError) {
          const msg = langError instanceof Error ? langError.message : String(langError);
          console.warn(`[Gemini] ${(prop as any).cod_ofer} → ${lang} failed: ${msg}`);
        }

        // Delay between languages (Gemini free: 10 RPM)
        await new Promise(r => setTimeout(r, 7000));
      }

      totalTokens += propTokens;

      if (Object.keys(newTranslations).length === 0) {
        errorDetails.push({ property_id: String((prop as any).cod_ofer), error: "All languages failed" });
        errorCount++;
        continue;
      }

      // --- Save to DB --------------------------------------------------------
      try {
        const updatedDescriptions = { ...descriptions, ...newTranslations };

        const { error: updateError } = await supabase
          .from("property_metadata")
          .update({ descriptions: updatedDescriptions })
          .eq("cod_ofer", (prop as any).cod_ofer);

        if (updateError) throw updateError;

        // Log
        await supabase.from("translation_log").insert({
          property_id: String((prop as any).cod_ofer),
          status: "success",
          source_language: "es",
          target_languages: Object.keys(newTranslations).map(k => k.replace("description_", "")),
          tokens_used: propTokens,
          cost_estimate: 0, // Gemini free tier
          created_at: new Date().toISOString(),
        });

        successCount++;
        console.log(`[Gemini] Translated ${(prop as any).ref || (prop as any).cod_ofer}: ${Object.keys(newTranslations).join(", ")}`);
      } catch (dbError) {
        const msg = dbError instanceof Error ? dbError.message : String(dbError);
        errorDetails.push({ property_id: String((prop as any).cod_ofer), error: msg });
        errorCount++;
      }
    }

    return {
      translated: successCount,
      errors: errorCount,
      error_details: errorDetails.length > 0 ? errorDetails : undefined,
      cost_estimate: "0€ (Gemini free tier)",
      duration_ms: Date.now() - startTime,
      languages_processed: targetLangs,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Gemini] Translation error:", message);
    return {
      translated: 0,
      errors: 1,
      error_details: [{ property_id: "error", error: message }],
      cost_estimate: "0€",
      duration_ms: Date.now() - startTime,
    };
  }
}

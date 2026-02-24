"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { getPerplexityModel, PERPLEXITY_CONFIG } from "@/config/perplexity";

const PERPLEXITY_API_URL = PERPLEXITY_CONFIG.apiUrl;

interface TranslationResult {
  cod_ofer: number;
  en: string;
  fr: string;
  de: string;
  it: string;
  pl: string;
}

interface TranslationResponse {
  translated: number;
  errors: number;
  error_details?: Array<{
    property_id: string;
    error: string;
  }>;
  cost_estimate: string;
  duration_ms?: number;
}

/**
 * Server action to translate property descriptions using Perplexity AI
 * Called from Next.js server, not from browser
 * No JWT issues - uses server-side API key
 */
export async function translatePropertiesAction(
  propertyIds?: string[],
  batchSize: number = 10
): Promise<TranslationResponse> {
  const startTime = Date.now();

  try {
    // Get Perplexity API key from environment
    const perplexityKey = process.env.PERPLEXITY_API_KEY;
    if (!perplexityKey) {
      throw new Error("PERPLEXITY_API_KEY not configured");
    }

    // Initialize Supabase admin client
    const supabase = supabaseAdmin;

    // Fetch properties from property_metadata table
    let query = supabase
      .from("property_metadata")
      .select("cod_ofer, descriptions");

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
      return {
        translated: 0,
        errors: 0,
        error_details: [],
        cost_estimate: "0€",
        duration_ms: Date.now() - startTime,
      };
    }

    // Extract source texts from properties
    const sourceTexts = properties
      .map((prop: any) => {
        const descriptions = prop.descriptions || {};
        const sourceText =
          descriptions.description_es || descriptions.descripciones || "";
        return {
          cod_ofer: prop.cod_ofer,
          text: sourceText.substring(0, 500),
        };
      })
      .filter((item: any) => item.text);

    if (sourceTexts.length === 0) {
      return {
        translated: 0,
        errors: properties.length,
        error_details: properties.map((p: any) => ({
          property_id: String(p.cod_ofer),
          error: "No Spanish description found",
        })),
        cost_estimate: "0€",
        duration_ms: Date.now() - startTime,
      };
    }

    // Build translation prompt
    const prompt = `You are a professional real estate translator specializing in luxury properties in Spain.

Translate the following Spanish property descriptions to English, French, German, Italian, and Polish.

Return ONLY a valid JSON object with this structure (no markdown, no code blocks):
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

Spanish texts to translate:
${sourceTexts.map((item: any) => `COD_OFER: ${item.cod_ofer}\nTEXT: ${item.text}`).join("\n---\n")}`;

    // Call Perplexity API
    const perplexityResponse = await fetch(PERPLEXITY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${perplexityKey}`,
      },
      body: JSON.stringify({
        model: getPerplexityModel(),
        messages: [
          {
            role: "system",
            content:
              "You are a professional translator expert in luxury real estate in Spain. You provide high-quality translations only in JSON format.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2,
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
    const costEstimate = (totalTokens / 1000) * 0.0002;

    // Parse translations from response
    let translations: TranslationResult[] = [];
    try {
      const content = perplexityData.choices[0]?.message?.content || "{}";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
      translations = parsed.translations || [];
    } catch (parseError) {
      console.error("Failed to parse Perplexity response:", parseError);
      throw new Error("Invalid translation response format from Perplexity");
    }

    // Update properties in database
    let successCount = 0;
    let errorCount = 0;
    const errorDetails: Array<{ property_id: string; error: string }> = [];

    for (const translation of translations) {
      try {
        const { cod_ofer, en, fr, de, it, pl } = translation;

        // Get existing descriptions
        const { data: existing } = await supabase
          .from("property_metadata")
          .select("descriptions")
          .eq("cod_ofer", cod_ofer)
          .single();

        // Update descriptions JSON
        const updatedDescriptions = {
          ...(existing?.descriptions || {}),
          description_en: en,
          description_fr: fr,
          description_de: de,
          description_it: it,
          description_pl: pl,
        };

        const { error: updateError } = await supabase
          .from("property_metadata")
          .update({ descriptions: updatedDescriptions })
          .eq("cod_ofer", cod_ofer);

        if (updateError) {
          throw updateError;
        }

        // Log successful translation
        await supabase.from("translation_log").insert({
          property_id: String(cod_ofer),
          status: "success",
          source_language: "es",
          target_languages: ["en", "fr", "de", "it", "pl"],
          tokens_used: Math.ceil(totalTokens / translations.length),
          cost_estimate: costEstimate / translations.length,
          created_at: new Date().toISOString(),
        });

        successCount++;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errorDetails.push({
          property_id: String(translation.cod_ofer || "unknown"),
          error: message,
        });
        errorCount++;

        // Log error
        await supabase.from("translation_log").insert({
          property_id: String(translation.cod_ofer || "unknown"),
          status: "error",
          error_message: message,
          created_at: new Date().toISOString(),
        });
      }
    }

    return {
      translated: successCount,
      errors: errorCount,
      error_details: errorDetails.length > 0 ? errorDetails : undefined,
      cost_estimate: `${costEstimate.toFixed(4)}€`,
      duration_ms: Date.now() - startTime,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Translation error:", message);

    return {
      translated: 0,
      errors: 1,
      error_details: [
        {
          property_id: "error",
          error: message,
        },
      ],
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

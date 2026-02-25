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
 * Uses centralized model configuration from src/config/perplexity.ts
 * Model format: provider/model (e.g., perplexity/llama-3.1-sonar-small-128k-online)
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
5. **Emotional Appeal**: Preserve the property's unique selling points while making them resonate in each language

## TECHNICAL GUIDELINES:
- Keep similar length to original (±15%)
- Preserve numbers, measurements, and amenities exactly as stated
- Adapt adjectives and descriptions to market norms (e.g., "vistas" → "panoramic views" or "scenic vistas" depending on context)
- Never use generic/robotic translations
- Maintain luxury brand positioning

## YOUR EXPERTISE:
- You understand the Valencian market (Costa Blanca, beachfront, inland properties)
- You know what international buyers seek in each market segment
- You've successfully marketed properties to: UK investment funds, French wealthy individuals, German retirees, Italian lifestyle seekers, Polish entrepreneurs

Return ONLY a valid JSON object with this structure (no markdown, no code blocks, no explanation):
{
  "translations": [
    {
      "cod_ofer": 12345,
      "en": "Professional English translation for international buyer",
      "fr": "Traduction élégante en français pour acheteur haut de gamme",
      "de": "Präzise Deutsche Übersetzung für qualitätsbewusste Käufer",
      "it": "Traduzione calda e avvolgente per l'acquirente italiano",
      "pl": "Praktyczne i bezpośrednie tłumaczenie dla inwestora polskiego"
    }
  ]
}

Spanish luxury property descriptions to translate (these are real estate listings in Spain):
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
              "You are an elite international real estate marketing expert with 15+ years translating luxury property listings across European markets (Spain, UK, France, Germany, Italy, Poland). Your translations are never literal—they are professionally adapted to appeal to each market's cultural preferences and buyer expectations. You understand that effective real estate translation requires more than language conversion; it requires market-specific positioning and emotional resonance. Your goal is to make Spanish properties equally compelling to international luxury buyers across all five languages.",
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";

const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";
const PERPLEXITY_MODEL = Deno.env.get("PERPLEXITY_MODEL") || "llama-3.1-sonar-small-128k-online";
const BATCH_SIZE = 10; // Max properties per batch

interface TranslateRequest {
  property_ids?: string[];
  batch_size?: number;
}

interface TranslateResponse {
  translated: number;
  errors: number;
  error_details?: Array<{
    property_id: string;
    error: string;
  }>;
  cost_estimate: string;
  duration_ms?: number;
}

serve(async (req: Request) => {
  // CORS handling
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  const startTime = Date.now();

  try {
    // Parse request
    const { property_ids, batch_size } = (await req.json()) as TranslateRequest;
    const actualBatchSize = Math.min(batch_size || BATCH_SIZE, BATCH_SIZE);

    // Initialize Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey || !perplexityKey) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Use property_metadata table (corrected for your schema)
    let query = supabase
      .from("property_metadata")
      .select("cod_ofer, descriptions");

    // Filter by specific properties if provided
    if (property_ids && property_ids.length > 0) {
      query = query.in("cod_ofer", property_ids.map(Number));
    } else {
      // Find properties needing translation
      query = query.not("descriptions", "is", null);
    }

    const { data: properties, error: fetchError } = await query.limit(
      actualBatchSize
    );

    if (fetchError) {
      throw new Error(`Failed to fetch properties: ${fetchError.message}`);
    }

    if (!properties || properties.length === 0) {
      return new Response(
        JSON.stringify({
          translated: 0,
          errors: 0,
          error_details: [],
          cost_estimate: "0€",
          duration_ms: Date.now() - startTime,
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Prepare translations request to Perplexity
    const sourceTexts = properties
      .map((prop) => {
        // Extract Spanish description from JSON
        const descriptions = prop.descriptions || {};
        const sourceText = descriptions.description_es || descriptions.descripciones || "";
        return {
          cod_ofer: prop.cod_ofer,
          text: sourceText.substring(0, 500), // Limit to 500 chars
        };
      })
      .filter((item) => item.text);

    if (sourceTexts.length === 0) {
      return new Response(
        JSON.stringify({
          translated: 0,
          errors: properties.length,
          error_details: properties.map((p) => ({
            property_id: String(p.cod_ofer),
            error: "No Spanish description found",
          })),
          cost_estimate: "0€",
          duration_ms: Date.now() - startTime,
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Call Perplexity API with batch translations
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
${sourceTexts.map((item) => `COD_OFER: ${item.cod_ofer}\nTEXT: ${item.text}`).join("\n---\n")}`;

    const perplexityResponse = await fetch(PERPLEXITY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${perplexityKey}`,
      },
      body: JSON.stringify({
        model: PERPLEXITY_MODEL,
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
    const usage = perplexityData.usage || { prompt_tokens: 0, completion_tokens: 0 };
    const totalTokens = usage.prompt_tokens + usage.completion_tokens;
    const costEstimate = (totalTokens / 1000) * 0.0002;

    // Parse translations
    let translations: any[] = [];
    try {
      const content = perplexityData.choices[0]?.message?.content || "{}";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
      translations = parsed.translations || [];
    } catch (parseError) {
      console.error("Failed to parse Perplexity response:", parseError);
      throw new Error("Invalid translation response format");
    }

    // Update properties in database
    let successCount = 0;
    let errorCount = 0;
    const errorDetails: Array<{ property_id: string; error: string }> = [];

    for (const translation of translations) {
      try {
        const { cod_ofer, en, fr, de, it, pl } = translation;

        // Update descriptions JSON in property_metadata
        const { data: existing } = await supabase
          .from("property_metadata")
          .select("descriptions")
          .eq("cod_ofer", cod_ofer)
          .single();

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

    const response: TranslateResponse = {
      translated: successCount,
      errors: errorCount,
      error_details: errorDetails.length > 0 ? errorDetails : undefined,
      cost_estimate: `${costEstimate.toFixed(4)}€`,
      duration_ms: Date.now() - startTime,
    };

    return new Response(JSON.stringify(response), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Edge Function error:", message);

    return new Response(
      JSON.stringify({
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
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});

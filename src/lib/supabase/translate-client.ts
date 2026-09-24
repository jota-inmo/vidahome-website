/**
 * Supabase Edge Function Translation Client
 *
 * Calls the translate-properties Edge Function to translate property descriptions
 * using Perplexity AI.
 *
 * Security: API calls are made directly from the browser/server to Supabase.
 * Authentication is handled via Supabase session or service role key.
 *
 * Usage:
 *   // Translate all pending properties
 *   const result = await translateProperties();
 *
 *   // Translate specific properties
 *   const result = await translateProperties(['prop-123', 'prop-456']);
 */

export interface TranslationResponse {
  translated: number;
  errors: number;
  error_details?: Array<{
    property_id: string;
    error: string;
  }>;
  cost_estimate: string;
  duration_ms?: number;
  timestamp?: string;
}

interface TranslationRequest {
  property_ids?: string[];
  batch_size?: number;
}

/**
 * Call Supabase Edge Function to translate property descriptions
 * @param propertyIds - Optional array of property IDs to translate. If omitted, translates all pending.
 * @param batchSize - Optional batch size (default: 10, max: 50)
 * @returns TranslationResponse with results
 */
export async function translateProperties(
  propertyIds?: string[],
  batchSize?: number
): Promise<TranslationResponse> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // C1 remediation (Camino A): key pública nueva primero, legacy de fallback
  // — la legacy deja de servir en el paso 8 del runbook (desactivar legacy).
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL environment variable"
    );
  }

  if (!supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable"
    );
  }

  // C1 remediation: verify_jwt pasa a false en esta función porque la key
  // publishable nueva no es un JWT — sin este secreto compartido (solo lo
  // conocen este servidor y la función), quedaría invocable por cualquiera
  // con la URL. Solo se usa server-side (este módulo se importa desde
  // app/actions/translate.ts, marcado "use server" — nunca llega al bundle
  // del navegador), así que NO lleva prefijo NEXT_PUBLIC_.
  const translateFnSecret = process.env.TRANSLATE_FN_SHARED_SECRET;
  if (!translateFnSecret) {
    throw new Error("Missing TRANSLATE_FN_SHARED_SECRET environment variable");
  }

  const edgeFunctionUrl = `${supabaseUrl}/functions/v1/translate-properties`;

  const payload: TranslationRequest = {};

  if (propertyIds && propertyIds.length > 0) {
    payload.property_ids = propertyIds;
  }

  if (batchSize) {
    payload.batch_size = Math.min(batchSize, 50); // Cap at 50
  }

  try {
    const response = await fetch(edgeFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // C1 remediation: apikey (no Authorization — la key nueva no es un
        // JWT) + secreto compartido que la función valida en su propio código
        // ahora que verify_jwt está desactivado para este endpoint.
        "apikey": supabaseAnonKey,
        "x-translate-secret": translateFnSecret,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();

      throw new Error(
        `Edge Function error: ${response.status} ${response.statusText} - ${errorBody}`
      );
    }

    const result: TranslationResponse = await response.json();
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Translation request failed: ${message}`);
  }
}

/**
 * Translate a single property by ID
 * @param propertyId - Property ID to translate
 * @returns TranslationResponse
 */
export async function translateProperty(
  propertyId: string
): Promise<TranslationResponse> {
  return translateProperties([propertyId]);
}

/**
 * Translate multiple properties with progress callback
 * @param propertyIds - Array of property IDs
 * @param batchSize - Batch size (default: 10)
 * @param onProgress - Callback function called after each batch
 * @returns Total translation results
 */
export async function translatePropertiesWithProgress(
  propertyIds: string[],
  batchSize: number = 10,
  onProgress?: (progress: {
    currentBatch: number;
    totalBatches: number;
    translated: number;
    totalTranslated: number;
  }) => void
): Promise<TranslationResponse> {
  const totalBatches = Math.ceil(propertyIds.length / batchSize);

  let totalTranslated = 0;
  let totalErrors = 0;
  let totalCost = 0;
  const errorDetails: Array<{ property_id: string; error: string }> = [];

  for (let i = 0; i < propertyIds.length; i += batchSize) {
    const batch = propertyIds.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;

    try {
      const result = await translateProperties(batch, batchSize);

      totalTranslated += result.translated;
      totalErrors += result.errors;

      if (result.error_details) {
        errorDetails.push(...result.error_details);
      }

      // Extract numeric cost
      const costMatch = result.cost_estimate.match(/[\d.]+/);
      if (costMatch) {
        totalCost += parseFloat(costMatch[0]);
      }

      // Call progress callback
      if (onProgress) {
        onProgress({
          currentBatch: batchNumber,
          totalBatches,
          translated: result.translated,
          totalTranslated,
        });
      }

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < propertyIds.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      totalErrors += batch.length;
      errorDetails.push(
        ...batch.map((id) => ({
          property_id: id,
          error: message,
        }))
      );
    }
  }

  return {
    translated: totalTranslated,
    errors: totalErrors,
    error_details: errorDetails.length > 0 ? errorDetails : undefined,
    cost_estimate: `${totalCost.toFixed(4)}€`,
  };
}

/**
 * Get translation status and recent logs
 * @returns Recent translation activity from translation_log table
 */
export async function getTranslationStatus(): Promise<{
  recent_translations: Array<{
    property_id: string;
    status: string;
    created_at: string;
  }>;
  error_rate: number;
  last_translation_time: string | null;
}> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL environment variable"
    );
  }

  // This would need to be a separate Edge Function or server action
  // For now, just return a placeholder
  return {
    recent_translations: [],
    error_rate: 0,
    last_translation_time: null,
  };
}

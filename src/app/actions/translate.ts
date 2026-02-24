"use server";

import { translateProperties } from "@/lib/supabase/translate-client";

/**
 * Server action to translate properties
 * Safe to call from client components via form submission
 *
 * Usage:
 *   const result = await translatePropertiesAction();
 *   const result = await translatePropertiesAction(['prop-123', 'prop-456']);
 */

interface TranslationResponse {
  success: boolean;
  translated: number;
  errors: number;
  cost_estimate: string;
  message: string;
  error_details?: Array<{
    property_id: string;
    error: string;
  }>;
}

export async function translatePropertiesAction(
  propertyIds?: string[]
): Promise<TranslationResponse> {
  try {
    const result = await translateProperties(propertyIds);

    return {
      success: result.errors === 0,
      translated: result.translated,
      errors: result.errors,
      cost_estimate: result.cost_estimate,
      message: `Translated ${result.translated} properties. Errors: ${result.errors}. Cost: ${result.cost_estimate}`,
      error_details: result.error_details,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return {
      success: false,
      translated: 0,
      errors: 0,
      cost_estimate: "0€",
      message: `Translation failed: ${message}`,
    };
  }
}

/**
 * Server action to translate a single property
 */
export async function translatePropertyAction(
  propertyId: string
): Promise<TranslationResponse> {
  return translatePropertiesAction([propertyId]);
}

/**
 * Server action to translate all pending properties
 * (those with Spanish but missing other languages)
 */
export async function translateAllPropertiesAction(): Promise<TranslationResponse> {
  return translatePropertiesAction();
}

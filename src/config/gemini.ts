/**
 * Google Gemini AI Configuration for translations
 *
 * Uses Gemini 2.0 Flash — free tier: 15 RPM, 1M TPM, 1500 RPD.
 * More than enough for 2-3 properties per cron run (10-15 API calls).
 */

export const GEMINI_CONFIG = {
  model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
  temperature: 0.4,
  maxOutputTokens: 2048,
};

export function getGeminiApiKey(): string | undefined {
  return process.env.GOOGLE_GENERATIVE_AI_API_KEY;
}

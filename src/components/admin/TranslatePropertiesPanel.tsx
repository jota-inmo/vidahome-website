"use client";

import React, { useState } from "react";
import { translatePropertiesAction } from "@/app/actions/translate";

interface TranslationResult {
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

/**
 * Admin Component - Translate Properties
 *
 * Usage in admin page:
 *   import { TranslatePropertiesPanel } from "@/components/admin/TranslatePropertiesPanel";
 *
 *   export default function AdminPage() {
 *     return <TranslatePropertiesPanel />;
 *   }
 */

export function TranslatePropertiesPanel() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [expandErrors, setExpandErrors] = useState(false);

  const handleTranslateAll = async () => {
    setLoading(true);
    setResult(null);

    try {
      const result = await translatePropertiesAction();
      setResult(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setResult({
        success: false,
        translated: 0,
        errors: 0,
        cost_estimate: "0€",
        message: `Translation failed: ${message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const successRate =
    result && result.translated + result.errors > 0
      ? Math.round(
          (result.translated / (result.translated + result.errors)) * 100
        )
      : 0;

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          🔄 Translate Properties
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Translate all property descriptions to 5 languages using Perplexity
          AI (via Supabase Edge Function)
        </p>
      </div>

      {/* Info Box */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-lg">
        <p className="text-sm text-blue-900 dark:text-blue-200">
          <strong>Languages:</strong> Spanish (source) → English, French,
          German, Italian, Polish
        </p>
        <p className="text-sm text-blue-900 dark:text-blue-200 mt-2">
          <strong>Cost:</strong> ~€0.0002 per 1000 tokens (average €0.03 per 150
          properties)
        </p>
      </div>

      {/* Action Button */}
      <button
        onClick={handleTranslateAll}
        disabled={loading}
        className={`w-full px-6 py-3 rounded-lg font-semibold text-white transition-all mb-6 ${
          loading
            ? "bg-slate-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Translating... Please wait
          </span>
        ) : (
          "🚀 Translate All Properties"
        )}
      </button>

      {/* Results Section */}
      {result && (
        <div className="space-y-4">
          {/* Status Badge */}
          <div
            className={`p-4 rounded-lg border ${
              result.success
                ? "bg-green-50 dark:bg-slate-800 border-green-200 dark:border-green-900"
                : "bg-red-50 dark:bg-slate-800 border-red-200 dark:border-red-900"
            }`}
          >
            <p
              className={`font-semibold text-lg ${
                result.success
                  ? "text-green-900 dark:text-green-200"
                  : "text-red-900 dark:text-red-200"
              }`}
            >
              {result.success ? "✅ Translation Successful" : "❌ Translation Failed"}
            </p>
            <p
              className={`text-sm mt-1 ${
                result.success
                  ? "text-green-800 dark:text-green-300"
                  : "text-red-800 dark:text-red-300"
              }`}
            >
              {result.message}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {/* Translated */}
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                Translated
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {result.translated}
              </p>
            </div>

            {/* Errors */}
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                Errors
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {result.errors}
              </p>
            </div>

            {/* Success Rate */}
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                Success Rate
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {successRate}%
              </p>
            </div>

            {/* Cost */}
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                Cost
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {result.cost_estimate}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          {result.translated + result.errors > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Progress
                </span>
                <span className="text-slate-600 dark:text-slate-400">
                  {result.translated} / {result.translated + result.errors}
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(successRate, 100)}%`,
                  }}
                ></div>
              </div>
            </div>
          )}

          {/* Error Details */}
          {result.error_details && result.error_details.length > 0 && (
            <div className="p-4 bg-yellow-50 dark:bg-slate-800 border border-yellow-200 dark:border-yellow-900 rounded-lg">
              <button
                onClick={() => setExpandErrors(!expandErrors)}
                className="flex items-center gap-2 text-sm font-semibold text-yellow-900 dark:text-yellow-200 hover:underline"
              >
                <svg
                  className={`w-4 h-4 transition-transform ${
                    expandErrors ? "rotate-90" : ""
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                {result.error_details.length} Errors
              </button>

              {expandErrors && (
                <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                  {result.error_details.map((error) => (
                    <div
                      key={error.property_id}
                      className="text-xs text-yellow-800 dark:text-yellow-300 bg-white dark:bg-slate-900 p-2 rounded border border-yellow-100 dark:border-slate-700"
                    >
                      <p className="font-mono font-semibold">
                        {error.property_id}
                      </p>
                      <p className="mt-1">{error.error}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Recommendations */}
          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <p className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
              💡 Next Steps
            </p>
            <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
              {result.errors > 0 && (
                <li>• Review error details above and retry failed properties</li>
              )}
              {result.translated > 0 && (
                <li>• Check translation_log table in Supabase for details</li>
              )}
              {result.translated > 0 && (
                <li>• Verify translations in database and fix if needed</li>
              )}
              <li>• Monitor costs and translation quality regularly</li>
            </ul>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
        <p>
          📚 Learn more:{" "}
          <a
            href="/docs/EDGE_FUNCTION_TRANSLATION_GUIDE.md"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Edge Function Guide
          </a>
        </p>
        <p className="mt-1">
          ⚙️ Edit function: Supabase Console → Functions → translate-properties
        </p>
      </div>
    </div>
  );
}

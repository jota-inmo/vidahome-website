'use client';

import React, { useState } from 'react';
import { Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface TranslationResult {
  success: boolean;
  translated: number;
  errors: number;
  error_details?: Array<{ id: string; error: string }>;
  cost_estimate: string;
}

interface TranslationPanelProps {
  title: string;
  description: string;
  onTranslate: () => Promise<TranslationResult>;
  endpoint?: string; // For REST API call fallback
}

export function TranslationPanel({
  title,
  description,
  onTranslate,
  endpoint,
}: TranslationPanelProps) {
  const [translating, setTranslating] = useState(false);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTranslate = async () => {
    setTranslating(true);
    setError(null);
    setResult(null);

    try {
      const res = await onTranslate();
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Error during translation');
    } finally {
      setTranslating(false);
    }
  };

  return (
    <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-6 mb-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>

      <button
        onClick={handleTranslate}
        disabled={translating}
        className="flex items-center gap-2 bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {translating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Traduciendo...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Auto-traducir
          </>
        )}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded flex gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800 dark:text-red-300">Error</p>
            <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className={`mt-4 p-4 rounded border ${
          result.success
            ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700'
            : 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700'
        }`}>
          <div className="flex gap-2 mb-2">
            <CheckCircle2 className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
              result.success
                ? 'text-green-600 dark:text-green-400'
                : 'text-yellow-600 dark:text-yellow-400'
            }`} />
            <div className="flex-1">
              <p className={`font-semibold ${
                result.success
                  ? 'text-green-800 dark:text-green-300'
                  : 'text-yellow-800 dark:text-yellow-300'
              }`}>
                {result.success ? 'Traducción completada' : 'Con advertencias'}
              </p>
            </div>
          </div>

          <div className={`space-y-1 text-sm ${
            result.success
              ? 'text-green-700 dark:text-green-200'
              : 'text-yellow-700 dark:text-yellow-200'
          }`}>
            <p>✅ Traducidos: <span className="font-semibold">{result.translated}</span></p>
            <p>❌ Errores: <span className="font-semibold">{result.errors}</span></p>
            <p>💰 Costo: <span className="font-semibold">{result.cost_estimate}</span></p>
          </div>

          {result.error_details && result.error_details.length > 0 && (
            <div className="mt-3 pt-3 border-t border-current/20">
              <p className="font-semibold text-xs opacity-75 mb-2">Detalles de errores:</p>
              <ul className="space-y-1 text-xs opacity-75">
                {result.error_details.slice(0, 5).map((err) => (
                  <li key={err.id}>• {err.id}: {err.error}</li>
                ))}
                {result.error_details.length > 5 && (
                  <li>... y {result.error_details.length - 5} más</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

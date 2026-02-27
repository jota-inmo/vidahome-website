'use client';

import React, { useState } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, FileText } from 'lucide-react';

export function SyncPropertiesClient() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [deltaLoading, setDeltaLoading] = useState(false);
  const [deltaResult, setDeltaResult] = useState<any>(null);
  const [backfillProgress, setBackfillProgress] = useState<string[]>([]);
  const [backfillLoading, setBackfillLoading] = useState(false);

  const handleDeltaSync = async () => {
    setDeltaLoading(true);
    setDeltaResult(null);
    try {
      const res = await fetch('/api/admin/sync-delta', { method: 'POST' });
      const data = await res.json();
      setDeltaResult(data);
    } catch (e: any) {
      setDeltaResult({ error: e.message });
    } finally {
      setDeltaLoading(false);
    }
  };

  const handleSyncAll = async () => {
    if (!confirm('¿Sincronizar TODAS las propiedades? Esto puede tardar unos minutos.')) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/sync', {
        method: 'GET',
      });
      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleBackfillDescriptions = async () => {
    if (!confirm('¿Rellenar descripciones para todas las propiedades sin texto? Esto llamará al API de Inmovilla (ficha) y puede tardar varios minutos.')) return;
    setBackfillLoading(true);
    setBackfillProgress([]);
    setResult(null);
    let batch = 0;
    try {
      while (true) {
        batch++;
        setBackfillProgress(prev => [...prev, `Lote ${batch}: obteniendo descripciones...`]);
        const res = await fetch('/api/admin/backfill-descriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ batchSize: 10 }),
        });
        const data = await res.json();
        if (data.error) {
          setBackfillProgress(prev => [...prev, `❌ Error: ${data.error}`]);
          break;
        }
        setBackfillProgress(prev => [
          ...prev.slice(0, -1),
          `Lote ${batch}: ✓ ${data.ok ?? 0} ok, ${data.failed ?? 0} fallidos — quedan ${data.remaining ?? '?'}`
        ]);
        if (!data.remaining || data.remaining === 0 || data.processed === 0) {
          setBackfillProgress(prev => [...prev, '✅ Todas las propiedades tienen descripción']);
          break;
        }
        await new Promise(r => setTimeout(r, 800));
      }
    } catch (e: any) {
      setBackfillProgress(prev => [...prev, `❌ ${e.message}`]);
    } finally {
      setBackfillLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Delta Sync */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2 dark:text-white">Sincronización incremental (recomendado)</h3>
        <p className="text-sm text-slate-500 mb-4">
          Compara el catálogo de Inmovilla con la base de datos y solo procesa las diferencias:
          propiedades nuevas (se añaden), inactivas (se marcan como no disponibles) y
          reactivadas. Las propiedades sin cambios se ignoran.
        </p>
        <button
          onClick={handleDeltaSync}
          disabled={deltaLoading || loading}
          className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw size={18} className={deltaLoading ? 'animate-spin' : ''} />
          {deltaLoading ? 'Calculando diferencias...' : 'Sincronizar diferencias'}
        </button>
        {deltaResult && (
          <div className={`mt-4 rounded p-4 text-sm ${
            deltaResult.error
              ? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300'
              : 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300'
          }`}>
            {deltaResult.error ? `❌ ${deltaResult.error}` : (
              <>
                <p className="font-semibold">{deltaResult.message}</p>
                {(deltaResult.added > 0 || deltaResult.removed > 0 || deltaResult.reactivated > 0) && (
                  <ul className="mt-1 space-y-0.5 list-disc list-inside">
                    {deltaResult.added > 0 && <li>🆕 {deltaResult.added} propiedades nuevas añadidas</li>}
                    {deltaResult.removed > 0 && <li>🚫 {deltaResult.removed} marcadas como no disponibles</li>}
                    {deltaResult.reactivated > 0 && <li>♻️ {deltaResult.reactivated} reactivadas</li>}
                  </ul>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Sync All */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2 dark:text-white">Sincronización completa</h3>
        <p className="text-sm text-slate-500 mb-4">Rescribe todos los registros desde cero. Usar solo si hay inconsistencias graves en la BD.</p>
        
        <button
          onClick={handleSyncAll}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Sincronizando...' : 'Sincronizar Todo'}
        </button>

        <p className="text-sm text-slate-500 mt-4">
          ⏱️ Esto sincroniza todas las propiedades del CRM. Puede tardar 1-5 minutos.
        </p>
      </div>

      {/* Backfill Descriptions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2 dark:text-white flex items-center gap-2">
          <FileText size={18} /> Rellenar Descripciones
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          Obtiene la descripción en español de cada propiedad desde el CRM Inmovilla (ficha) para las que aún no tienen texto. Requiere estar en Vercel con el proxy Arsys activo.
        </p>
        <button
          onClick={handleBackfillDescriptions}
          disabled={backfillLoading || loading}
          className="px-6 py-2 bg-emerald-600 text-white rounded font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw size={18} className={backfillLoading ? 'animate-spin' : ''} />
          {backfillLoading ? 'Procesando...' : 'Rellenar Descripciones'}
        </button>
        {backfillProgress.length > 0 && (
          <div className="mt-4 bg-slate-50 dark:bg-slate-950 rounded p-4 text-sm font-mono space-y-1 max-h-48 overflow-y-auto">
            {backfillProgress.map((line, i) => (
              <div key={i} className="text-slate-600 dark:text-slate-400">{line}</div>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className={`rounded-lg p-6 flex gap-4 ${
          result.error 
            ? 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800' 
            : 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800'
        }`}>
          {result.error ? (
            <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
          ) : (
            <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
          )}
          
          <div>
            {result.error ? (
              <>
                <h4 className="font-semibold text-red-900 dark:text-red-200">Error</h4>
                <p className="text-red-700 dark:text-red-300">{result.error}</p>
              </>
            ) : (
              <>
                <h4 className="font-semibold text-green-900 dark:text-green-200">✅ Éxito</h4>
                <p className="text-green-700 dark:text-green-300">{result.message}</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, FileText } from 'lucide-react';

export function SyncPropertiesClient() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [singlePropertyId, setSinglePropertyId] = useState('');
  const [backfillProgress, setBackfillProgress] = useState<string[]>([]);
  const [backfillLoading, setBackfillLoading] = useState(false);

  const handleSyncSingle = async () => {
    if (!singlePropertyId) {
      alert('Por favor ingresa el ID de la propiedad');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`/api/admin/sync?property_id=${singlePropertyId}`, {
        method: 'POST',
      });
      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
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
        setBackfillProgress(prev => [...prev, `Lote ${batch}: sincronizando...`]);
        const res = await fetch('/api/admin/sync-incremental?batchSize=10');
        const data = await res.json();
        if (data.error) {
          setBackfillProgress(prev => [...prev, `❌ Error: ${data.error}`]);
          break;
        }
        setBackfillProgress(prev => [
          ...prev.slice(0, -1),
          `Lote ${batch}: ${data.synced ?? 0} propiedades sincronizadas (${data.message ?? ''})`
        ]);
        if (data.isComplete || !data.total || data.synced === 0) {
          setBackfillProgress(prev => [...prev, '✅ Todas las propiedades tienen descripción']);
          break;
        }
        await new Promise(r => setTimeout(r, 500));
      }
    } catch (e: any) {
      setBackfillProgress(prev => [...prev, `❌ ${e.message}`]);
    } finally {
      setBackfillLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Single Property Sync */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 dark:text-white">Sincronizar una propiedad nueva</h3>
        
        <div className="flex gap-2 mb-4">
          <input
            type="number"
            placeholder="ID de la propiedad (cod_ofer)"
            value={singlePropertyId}
            onChange={(e) => setSinglePropertyId(e.target.value)}
            className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-950 dark:text-white"
            disabled={loading}
          />
          <button
            onClick={handleSyncSingle}
            disabled={loading}
            className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Sincronizar
          </button>
        </div>

        <p className="text-sm text-slate-500">
          Ejemplo: si creaste una propiedad con ID 12345 en Inmovilla, ingresa 12345 aquí.
        </p>
      </div>

      {/* Sync All */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 dark:text-white">Sincronizar TODAS las propiedades</h3>
        
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

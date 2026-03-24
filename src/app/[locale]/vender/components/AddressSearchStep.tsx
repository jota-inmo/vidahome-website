'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SellFormState } from '@/types/sell-form';
import { getCatastroProvinciasAction, getCatastroMunicipiosAction } from '@/app/actions';
import { toast } from 'sonner';
import { MapPin, Hash, Search, Home, Ruler, CheckCircle, Building2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

type SearchMode = 'direccion' | 'refcatastral';

const PISO_TYPES = ['piso', 'apartamento', 'planta baja', 'atico', 'dúplex', 'estudio'];

interface AddressSearchStepProps {
  formState: SellFormState;
  setFormState: (state: SellFormState | ((prev: SellFormState) => SellFormState)) => void;
  onNext: () => void;
  onBack: () => void;
  onPropertyFound: (property: any) => void;
  loading?: boolean;
}

export const AddressSearchStep: React.FC<AddressSearchStepProps> = ({
  formState,
  setFormState,
  onNext,
  onBack,
  onPropertyFound,
  loading = false
}) => {
  const t = useTranslations('Vender');
  const [searchMode, setSearchMode] = useState<SearchMode>('direccion');
  const [provincias, setProvincias] = useState<string[]>([]);
  const [municipios, setMunicipios] = useState<string[]>([]);
  const [viaSuggestions, setViaSuggestions] = useState<any[]>([]);
  const [showViaSuggestions, setShowViaSuggestions] = useState(false);
  const [numeroSuggestions, setNumeroSuggestions] = useState<any[]>([]);
  const [showNumeroSuggestions, setShowNumeroSuggestions] = useState(false);
  const [selectedVia, setSelectedVia] = useState<{ tipo: string; nombre: string } | null>(null);
  const [refCatastralInput, setRefCatastralInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [multipleResults, setMultipleResults] = useState<any[]>([]);

  const viaRef = useRef<HTMLDivElement>(null);
  const numRef = useRef<HTMLDivElement>(null);

  const isPisoType = PISO_TYPES.includes((formState.propertyType || '').toLowerCase());

  useEffect(() => {
    getCatastroProvinciasAction().then(setProvincias).catch(() => toast.error(t('toastCatastroError')));
  }, []);

  useEffect(() => {
    if (!formState.provincia) return;
    getCatastroMunicipiosAction(formState.provincia).then(setMunicipios).catch(() => toast.error(t('toastCatastroError')));
  }, [formState.provincia]);

  useEffect(() => {
    if (formState.via.length < 3) { setViaSuggestions([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/catastro/vias?provincia=${formState.provincia}&municipio=${formState.municipio}&query=${formState.via}`);
        if (res.ok) setViaSuggestions(await res.json());
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [formState.via, formState.municipio, formState.provincia]);

  useEffect(() => {
    if (!selectedVia) return;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/catastro/numeros?provincia=${formState.provincia}&municipio=${formState.municipio}&tipoVia=${selectedVia.tipo}&nomVia=${selectedVia.nombre}&numero=${formState.numero}`);
        if (res.ok) setNumeroSuggestions(await res.json());
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [formState.numero, selectedVia, formState.municipio, formState.provincia]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (viaRef.current && !viaRef.current.contains(event.target as Node)) setShowViaSuggestions(false);
      if (numRef.current && !numRef.current.contains(event.target as Node)) setShowNumeroSuggestions(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchDetails = async (rc: string) => {
    const detailsRes = await fetch(`/api/catastro/details?ref=${encodeURIComponent(rc)}`);
    if (!detailsRes.ok) throw new Error('Error');
    return await detailsRes.json();
  };

  const doSearch = async (overrideNumero?: string, overrideTipoVia?: string) => {
    const numero = overrideNumero ?? formState.numero;
    const tipoVia = overrideTipoVia ?? selectedVia?.tipo ?? formState.tipoVia;

    if (searchMode === 'direccion' && (!formState.provincia || !formState.municipio || !formState.via || !numero)) {
      toast.error(t('toastCompleteFields'));
      return;
    }
    if (searchMode === 'refcatastral' && refCatastralInput.replace(/\s/g, '').length < 14) {
      toast.error(t('toastRefMinChars'));
      return;
    }
    if (searchMode === 'refcatastral' && refCatastralInput.replace(/\s/g, '').length > 20) {
      toast.error(t('toastRefMaxChars'));
      return;
    }

    setSearching(true);
    setMultipleResults([]);
    try {
      const body = searchMode === 'refcatastral'
        ? { rc: refCatastralInput.replace(/\s/g, '').toUpperCase() }
        : { provincia: formState.provincia, municipio: formState.municipio, via: formState.via, numero, tipoVia };

      const res = await fetch('/api/catastro/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || t('toastCatastroError'));
        return;
      }

      const result = await res.json();

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (!result.found || !result.properties?.length) {
        if (searchMode === 'refcatastral') {
          toast.error(t('toastNotFoundRef'));
        } else {
          toast.error(t('toastNotFoundAddress'));
        }
        return;
      }

      if (result.properties.length === 1) {
        const details = await fetchDetails(result.properties[0].referenciaCatastral);
        onPropertyFound(details);
        toast.success(t('toastPropertyFound'));
      } else {
        setMultipleResults(result.properties);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error(t('toastCatastroError'));
    } finally {
      setSearching(false);
    }
  };

  const handleSelectNumero = (num: any) => {
    setFormState(prev => ({ ...prev, numero: num.numero, refCatastralManual: num.rc }));
    setShowNumeroSuggestions(false);
    doSearch(num.numero);
  };

  const handleSelectProperty = async (property: any) => {
    setSearching(true);
    try {
      const details = await fetchDetails(property.referenciaCatastral);
      onPropertyFound(details);
      toast.success(t('toastPropertySelected'));
    } catch {
      toast.error(t('toastPropertyDetailsError'));
    } finally {
      setSearching(false);
    }
  };

  // ── PANEL DE SELECCIÓN MÚLTIPLE ──
  if (multipleResults.length > 0) {
    return (
      <section className="max-w-2xl mx-auto px-8 py-16">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Building2 size={28} className="text-lime-500" />
            <h2 className="text-4xl font-serif text-slate-900 dark:text-white">
              {t('addressSelectTitle')}
            </h2>
          </div>
          <p className="text-slate-600 dark:text-slate-400" dangerouslySetInnerHTML={{ __html: t('addressSelectFound', { count: multipleResults.length }) }} />
        </div>

        <div className="space-y-3 mb-8">
          {multipleResults.map((prop, idx) => (
            <button
              key={prop.referenciaCatastral || idx}
              onClick={() => handleSelectProperty(prop)}
              disabled={searching}
              className="w-full text-left p-5 border border-slate-200 dark:border-slate-700 rounded-xl
                hover:border-lime-400 hover:bg-lime-50/50 dark:hover:border-lime-500 dark:hover:bg-lime-950/10
                transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Home size={16} className="text-lime-500 flex-shrink-0" />
                    <span className="font-medium text-slate-900 dark:text-white text-sm leading-tight">
                      {prop.direccion}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {prop.superficie > 0 && (
                      <span className="flex items-center gap-1">
                        <Ruler size={12} />
                        {prop.superficie} m²
                      </span>
                    )}
                    {prop.uso && <span className="capitalize">{prop.uso}</span>}
                    <span className="font-mono opacity-60 text-[10px]">{prop.referenciaCatastral}</span>
                  </div>
                </div>
                <CheckCircle
                  size={20}
                  className="text-slate-200 dark:text-slate-700 group-hover:text-lime-400 transition-colors flex-shrink-0 mt-0.5"
                />
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => setMultipleResults([])}
          className="w-full py-3 text-center text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          {t('addressBackToSearch')}
        </button>
      </section>
    );
  }

  return (
    <section className="max-w-2xl mx-auto px-8 py-16">
      <div className="mb-10">
        <h2 className="text-4xl font-serif text-slate-900 dark:text-white mb-3">
          {t('addressTitle')}
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-lg">
          {t('addressDesc')}
        </p>
      </div>

      {/* Toggle modo */}
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-8">
        <button
          onClick={() => setSearchMode('direccion')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
            searchMode === 'direccion'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <MapPin size={16} />
          {t('addressByAddress')}
        </button>
        <button
          onClick={() => setSearchMode('refcatastral')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
            searchMode === 'refcatastral'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Hash size={16} />
          {t('addressByRef')}
        </button>
      </div>

      {searchMode === 'refcatastral' ? (
        /* ── REF CATASTRAL ── */
        <div className="space-y-4 mb-8">
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl text-sm text-blue-700 dark:text-blue-300">
            <p className="mb-2">
              {t('addressRefInfo')}
            </p>
            <ul className="list-disc ml-5 space-y-1">
              <li>{t('addressRefIbi')}</li>
              <li>{t('addressRefEscritura')}</li>
              <li>{t('addressRefSede')} (<a href="https://www1.sedecatastro.gob.es/Accesos/SECAccDescargaDatos.aspx" target="_blank" rel="noopener" className="underline">enlace</a>)</li>
            </ul>
            <p className="mt-2 text-xs">
              <strong>{t('addressRefFormat')}</strong>
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              {t('addressRefLabel')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={refCatastralInput}
              onChange={e => setRefCatastralInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              placeholder={t('addressRefPlaceholder')}
              maxLength={20}
              className={`
                w-full px-4 py-3 border rounded-lg
                bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono tracking-widest
                focus:ring-2 focus:ring-lime-400 outline-none transition-colors
                ${refCatastralInput.length >= 14 && refCatastralInput.length <= 20
                  ? 'border-lime-300 dark:border-lime-700'
                  : 'border-slate-300 dark:border-slate-700'
                }
              `}
            />
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-slate-400">
                {t('addressChars', { count: refCatastralInput.length })}
                {refCatastralInput.length >= 14 && refCatastralInput.length <= 20 && (
                  <span className="ml-2 text-lime-600 dark:text-lime-400">{t('addressValidLength')}</span>
                )}
                {refCatastralInput.length > 0 && refCatastralInput.length < 14 && (
                  <span className="ml-2 text-orange-600 dark:text-orange-400">{t('addressMinChars')}</span>
                )}
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* ── DIRECCIÓN ── */
        <div className="space-y-5 mb-8">

          {/* Aviso para pisos */}
          {isPisoType && (
            <div className="p-3 bg-lime-50 dark:bg-lime-950/20 border border-lime-200 dark:border-lime-900 rounded-lg flex items-start gap-2 text-sm text-lime-800 dark:text-lime-300">
              <Building2 size={16} className="flex-shrink-0 mt-0.5" />
              <span>{t('addressPisoInfo')}</span>
            </div>
          )}

          {/* Provincia */}
          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              {t('addressProvince')} <span className="text-red-500">*</span>
            </label>
            <select
              value={formState.provincia}
              onChange={e => setFormState(prev => ({ ...prev, provincia: e.target.value, municipio: '' }))}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg
                bg-white dark:bg-slate-900 text-slate-900 dark:text-white
                focus:ring-2 focus:ring-lime-400 outline-none appearance-none"
            >
              <option value="">{t('addressSelectProvince')}</option>
              {provincias.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Municipio */}
          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              {t('addressMunicipality')} <span className="text-red-500">*</span>
            </label>
            <select
              value={formState.municipio}
              onChange={e => setFormState(prev => ({ ...prev, municipio: e.target.value }))}
              disabled={!formState.provincia}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg
                bg-white dark:bg-slate-900 text-slate-900 dark:text-white
                disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed
                focus:ring-2 focus:ring-lime-400 outline-none appearance-none"
            >
              <option value="">{t('addressSelectMunicipality')}</option>
              {municipios.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Tipo de vía */}
          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              {t('addressRoadType')}
            </label>
            <select
              value={formState.tipoVia}
              onChange={e => setFormState(prev => ({ ...prev, tipoVia: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg
                bg-white dark:bg-slate-900 text-slate-900 dark:text-white
                focus:ring-2 focus:ring-lime-400 outline-none appearance-none"
            >
              <option value="">{t('addressSelectType')}</option>
              <option value="CL">{t('addressStreet')}</option>
              <option value="AV">{t('addressAvenue')}</option>
              <option value="PZ">{t('addressSquare')}</option>
              <option value="CA">{t('addressPath')}</option>
              <option value="CR">{t('addressRoad')}</option>
              <option value="CT">{t('addressHighway')}</option>
            </select>
          </div>

          {/* Calle / Vía */}
          <div ref={viaRef} className="relative">
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              {t('addressStreetVia')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formState.via}
              onChange={e => { setFormState(prev => ({ ...prev, via: e.target.value })); setShowViaSuggestions(true); }}
              onFocus={() => setShowViaSuggestions(true)}
              placeholder={t('addressStreetPlaceholder')}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg
                bg-white dark:bg-slate-900 text-slate-900 dark:text-white
                focus:ring-2 focus:ring-lime-400 outline-none"
            />
            {showViaSuggestions && viaSuggestions.length > 0 && (
              <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                {viaSuggestions.map((via, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setFormState(prev => ({ ...prev, via: via.nombre }));
                      setSelectedVia({ tipo: via.tipo, nombre: via.nombre });
                      setShowViaSuggestions(false);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-lime-50 dark:hover:bg-lime-950/20 text-slate-900 dark:text-white text-sm border-b border-slate-100 dark:border-slate-800 last:border-b-0"
                  >
                    <span className="text-slate-400 text-xs mr-1">{via.tipo}</span> {via.nombre}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Número */}
          <div ref={numRef} className="relative">
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              {t('addressNumber')} <span className="text-red-500">*</span>
              {isPisoType && (
                <span className="ml-2 text-xs font-normal text-lime-600 dark:text-lime-400">
                  {t('addressFloorHint')}
                </span>
              )}
            </label>
            <input
              type="text"
              value={formState.numero}
              onChange={e => { setFormState(prev => ({ ...prev, numero: e.target.value })); setShowNumeroSuggestions(true); }}
              onFocus={() => setShowNumeroSuggestions(true)}
              placeholder={t('addressNumberPlaceholder')}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg
                bg-white dark:bg-slate-900 text-slate-900 dark:text-white
                focus:ring-2 focus:ring-lime-400 outline-none"
            />
            {showNumeroSuggestions && numeroSuggestions.length > 0 && (
              <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                {numeroSuggestions.map((num, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectNumero(num)}
                    className="w-full text-left px-4 py-2.5 hover:bg-lime-50 dark:hover:bg-lime-950/20 text-slate-900 dark:text-white text-sm border-b border-slate-100 dark:border-slate-800 last:border-b-0"
                  >
                    {t('addressNumberPrefix', { n: num.numero })}
                    {isPisoType && (
                      <span className="text-xs text-slate-400 ml-2">{t('addressSeeFloors')}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Botón buscar manual */}
      <button
        onClick={() => doSearch()}
        disabled={searching || loading}
        className={`w-full py-4 rounded-lg font-bold uppercase tracking-[0.1em] text-sm transition-all mb-6 flex items-center justify-center gap-2 ${
          searching || loading
            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            : 'bg-lime-400 text-slate-900 hover:bg-lime-500 shadow-lg hover:shadow-lime-200/50 dark:hover:shadow-lime-900/50'
        }`}
      >
        {searching || loading ? (
          <>
            <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            {t('addressSearching')}
          </>
        ) : (
          <>
            <Search size={16} />
            {t('addressSearchButton')}
          </>
        )}
      </button>

      <div className="flex justify-center">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-slate-300 dark:border-slate-700 rounded-lg
            font-medium uppercase tracking-[0.1em] text-sm
            text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-900
            transition-colors"
        >
          {t('back')}
        </button>
      </div>
    </section>
  );
};

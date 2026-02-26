'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SellFormState } from '@/types/sell-form';
import { getCatastroProvinciasAction, getCatastroMunicipiosAction } from '@/app/actions';
import { toast } from 'sonner';
import { ChevronDown, AlertCircle } from 'lucide-react';

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
  const [provincias, setProvincias] = useState<string[]>([]);
  const [municipios, setMunicipios] = useState<string[]>([]);
  const [viaSuggestions, setViaSuggestions] = useState<any[]>([]);
  const [showViaSuggestions, setShowViaSuggestions] = useState(false);
  const [numeroSuggestions, setNumeroSuggestions] = useState<any[]>([]);
  const [showNumeroSuggestions, setShowNumeroSuggestions] = useState(false);
  const [selectedVia, setSelectedVia] = useState<{ tipo: string; nombre: string } | null>(null);
  const [showRefCatastralInput, setShowRefCatastralInput] = useState(false);
  const [refCatastralInput, setRefCatastralInput] = useState('');
  const [searching, setSearching] = useState(false);

  const viaRef = useRef<HTMLDivElement>(null);
  const numRef = useRef<HTMLDivElement>(null);

  // Cargar provincias al montar
  useEffect(() => {
    const loadProvincias = async () => {
      try {
        const data = await getCatastroProvinciasAction();
        setProvincias(data);
      } catch (error) {
        toast.error('Error al cargar provincias');
      }
    };
    loadProvincias();
  }, []);

  // Cargar municipios cuando cambia provincia
  useEffect(() => {
    const loadMunicipios = async () => {
      if (!formState.provincia) return;
      try {
        const data = await getCatastroMunicipiosAction(formState.provincia);
        setMunicipios(data);
      } catch (error) {
        toast.error('Error al cargar municipios');
      }
    };
    loadMunicipios();
  }, [formState.provincia]);

  // Autocompletado de vías
  useEffect(() => {
    const fetchVias = async () => {
      if (formState.via.length < 3) {
        setViaSuggestions([]);
        return;
      }
      try {
        const res = await fetch(
          `/api/catastro/vias?provincia=${formState.provincia}&municipio=${formState.municipio}&query=${formState.via}`
        );
        if (res.ok) {
          const data = await res.json();
          setViaSuggestions(data);
        }
      } catch (e) {
        console.error('Error fetching vias:', e);
      }
    };

    const timer = setTimeout(fetchVias, 300);
    return () => clearTimeout(timer);
  }, [formState.via, formState.municipio, formState.provincia]);

  // Autocompletado de números
  useEffect(() => {
    const fetchNumeros = async () => {
      if (!selectedVia) return;
      try {
        const res = await fetch(
          `/api/catastro/numeros?provincia=${formState.provincia}&municipio=${formState.municipio}&tipoVia=${selectedVia.tipo}&nomVia=${selectedVia.nombre}&numero=${formState.numero}`
        );
        if (res.ok) {
          const data = await res.json();
          setNumeroSuggestions(data);
        }
      } catch (e) {
        console.error('Error fetching numeros:', e);
      }
    };

    const timer = setTimeout(fetchNumeros, 300);
    return () => clearTimeout(timer);
  }, [formState.numero, selectedVia, formState.municipio, formState.provincia]);

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (viaRef.current && !viaRef.current.contains(event.target as Node)) {
        setShowViaSuggestions(false);
      }
      if (numRef.current && !numRef.current.contains(event.target as Node)) {
        setShowNumeroSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectVia = (via: any) => {
    setFormState(prev => ({ ...prev, via: via.nombre }));
    setSelectedVia({ tipo: via.tipo, nombre: via.nombre });
    setShowViaSuggestions(false);
  };

  const handleSelectNumero = (num: any) => {
    setFormState(prev => ({ ...prev, numero: num.numero, refCatastralManual: num.rc }));
    setShowNumeroSuggestions(false);
  };

  const handleSearchCatastro = async () => {
    if (!formState.provincia || !formState.municipio) {
      toast.error('Selecciona provincia y municipio');
      return;
    }

    setSearching(true);
    try {
      // Buscar por dirección o referencia catastral
      const body = refCatastralInput
        ? { rc: refCatastralInput.replace(/\s/g, '').toUpperCase() }
        : { ...formState, tipoVia: selectedVia?.tipo };

      const response = await fetch('/api/catastro/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const err = await response.json();
        toast.error(err.message || 'Error al buscar en el Catastro');
        return;
      }

      const result = await response.json();
      if (result.found && result.properties?.length > 0) {
        if (result.properties.length === 1) {
          // Obtener detalles completos
          const detailsRes = await fetch(
            `/api/catastro/details?ref=${encodeURIComponent(result.properties[0].referenciaCatastral)}`
          );
          if (detailsRes.ok) {
            const details = await detailsRes.json();
            onPropertyFound(details);
            toast.success('¡Propiedad encontrada!');
          }
        } else {
          // Múltiples resultados - mostrar lista (implementar después)
          toast.info(`Se encontraron ${result.properties.length} propiedades`);
        }
      } else {
        toast.error('No se encontró la propiedad');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Error al consultar el Catastro');
    } finally {
      setSearching(false);
    }
  };

  return (
    <section className="max-w-2xl mx-auto px-8 py-16">
      <div className="mb-12">
        <h2 className="text-4xl font-serif text-slate-900 dark:text-white mb-4">
          ¿Dónde está tu propiedad?
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-lg">
          Detallamos la información igual que en el Catastro para encontrarla correctamente
        </p>
      </div>

      <div className="space-y-6 mb-8">
        {/* Provincia */}
        <div>
          <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
            Provincia <span className="text-red-500">*</span>
          </label>
          <select
            value={formState.provincia}
            onChange={e => setFormState(prev => ({ ...prev, provincia: e.target.value, municipio: '' }))}
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg
              bg-white dark:bg-slate-900 text-slate-900 dark:text-white
              focus:ring-2 focus:ring-lime-400 outline-none appearance-none"
          >
            <option value="">Selecciona provincia...</option>
            {provincias.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Municipio */}
        <div>
          <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
            Municipio <span className="text-red-500">*</span>
          </label>
          <select
            value={formState.municipio}
            onChange={e => setFormState(prev => ({ ...prev, municipio: e.target.value }))}
            disabled={!formState.provincia}
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg
              bg-white dark:bg-slate-900 text-slate-900 dark:text-white disabled:bg-slate-100 dark:disabled:bg-slate-800
              focus:ring-2 focus:ring-lime-400 outline-none appearance-none"
          >
            <option value="">Selecciona municipio...</option>
            {municipios.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Tipo de vía */}
        <div>
          <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
            Tipo de vía
          </label>
          <select
            value={formState.tipoVia}
            onChange={e => setFormState(prev => ({ ...prev, tipoVia: e.target.value }))}
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg
              bg-white dark:bg-slate-900 text-slate-900 dark:text-white
              focus:ring-2 focus:ring-lime-400 outline-none appearance-none"
          >
            <option value="">Selecciona tipo...</option>
            <option value="CL">Calle</option>
            <option value="AV">Avenida</option>
            <option value="PZ">Plaza</option>
            <option value="CA">Camino</option>
            <option value="CR">Carrera</option>
            <option value="CT">Carretera</option>
          </select>
        </div>

        {/* Vía (calle) */}
        <div ref={viaRef} className="relative">
          <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
            Vía/Calle <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formState.via}
            onChange={e => {
              setFormState(prev => ({ ...prev, via: e.target.value }));
              setShowViaSuggestions(true);
            }}
            onFocus={() => setShowViaSuggestions(true)}
            placeholder="Ej. San Francisco de Borja"
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg
              bg-white dark:bg-slate-900 text-slate-900 dark:text-white
              focus:ring-2 focus:ring-lime-400 outline-none"
          />
          {showViaSuggestions && viaSuggestions.length > 0 && (
            <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {viaSuggestions.map((via, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectVia(via)}
                  className="w-full text-left px-4 py-2 hover:bg-lime-50 dark:hover:bg-lime-950/20 text-slate-900 dark:text-white text-sm border-b border-slate-100 dark:border-slate-800 last:border-b-0"
                >
                  {via.tipo} {via.nombre}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Número */}
        <div ref={numRef} className="relative">
          <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
            Número <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formState.numero}
            onChange={e => {
              setFormState(prev => ({ ...prev, numero: e.target.value }));
              setShowNumeroSuggestions(true);
            }}
            onFocus={() => setShowNumeroSuggestions(true)}
            placeholder="Ej. 1, 45A"
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg
              bg-white dark:bg-slate-900 text-slate-900 dark:text-white
              focus:ring-2 focus:ring-lime-400 outline-none"
          />
          {showNumeroSuggestions && numeroSuggestions.length > 0 && (
            <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {numeroSuggestions.map((num, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectNumero(num)}
                  className="w-full text-left px-4 py-2 hover:bg-lime-50 dark:hover:bg-lime-950/20 text-slate-900 dark:text-white text-sm border-b border-slate-100 dark:border-slate-800 last:border-b-0"
                >
                  Número {num.numero}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Botón de búsqueda */}
      <button
        onClick={handleSearchCatastro}
        disabled={!formState.provincia || !formState.municipio || searching || loading}
        className={`
          w-full py-3 rounded-lg font-medium uppercase tracking-[0.1em] transition-all mb-8
          ${!formState.provincia || !formState.municipio || searching || loading
            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            : 'bg-lime-400 text-slate-900 hover:bg-lime-500 shadow-lg'
          }
        `}
      >
        {searching || loading ? 'Buscando...' : 'Buscar en el Catastro'}
      </button>

      {/* Fallback: Referencia catastral */}
      {!showRefCatastralInput && (
        <button
          onClick={() => setShowRefCatastralInput(true)}
          className="w-full py-3 text-center text-lime-600 dark:text-lime-400 hover:text-lime-700 dark:hover:text-lime-300
            text-sm font-medium transition-colors border-b border-lime-300 dark:border-lime-700"
        >
          No encuentro mi propiedad
        </button>
      )}

      {showRefCatastralInput && (
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg mb-8">
          <div className="flex gap-2 mb-3">
            <AlertCircle size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Si tienes tu referencia catastral (22 dígitos), puedes usarla para una búsqueda precisa
            </p>
          </div>
          <input
            type="text"
            value={refCatastralInput}
            onChange={e => setRefCatastralInput(e.target.value.toUpperCase())}
            placeholder="Ej. 7198701YJ4179N0001XF"
            className="w-full px-4 py-2 border border-blue-300 dark:border-blue-700 rounded-lg
              bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm
              focus:ring-2 focus:ring-blue-400 outline-none"
          />
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
            No la tienes? No importa, la búsqueda por dirección también funciona bien.
          </p>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex gap-4 justify-center">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-slate-300 dark:border-slate-700 rounded-sm
            font-medium uppercase tracking-[0.1em] text-sm
            text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-900
            transition-colors"
        >
          Atrás
        </button>
      </div>
    </section>
  );
};

'use client';

import React from 'react';
import { Search, ChevronDown, CheckCircle, ArrowRight } from 'lucide-react';
import { CatastroProperty } from '@/lib/api/catastro';

interface PropertySearchProps {
    searchMode: 'address' | 'reference';
    setSearchMode: (mode: 'address' | 'reference') => void;
    address: { provincia: string; municipio: string; via: string; numero: string };
    setAddress: React.Dispatch<React.SetStateAction<{ provincia: string; municipio: string; via: string; numero: string }>>;
    referenciaCatastral: string;
    setReferenciaCatastral: (rc: string) => void;
    provincias: string[];
    municipios: string[];
    viaSuggestions: any[];
    showViaSuggestions: boolean;
    setShowViaSuggestions: (show: boolean) => void;
    numeroSuggestions: any[];
    showNumeroSuggestions: boolean;
    setShowNumeroSuggestions: (show: boolean) => void;
    handleSelectVia: (v: any) => void;
    handleSelectNumero: (n: any) => void;
    viaRef: React.RefObject<HTMLDivElement | null>;
    numRef: React.RefObject<HTMLDivElement | null>;
    multipleProperties: CatastroProperty[];
    handleSelectProperty: (prop: CatastroProperty) => void;
    handleSearchCatastro: (rc?: string) => void;
    handleDemoSearch: () => void;
    handleManualEntry: () => void;
    loading: boolean;
}

export function PropertySearch({
    searchMode,
    setSearchMode,
    address,
    setAddress,
    referenciaCatastral,
    setReferenciaCatastral,
    provincias,
    municipios,
    viaSuggestions,
    showViaSuggestions,
    setShowViaSuggestions,
    numeroSuggestions,
    showNumeroSuggestions,
    setShowNumeroSuggestions,
    handleSelectVia,
    handleSelectNumero,
    viaRef,
    numRef,
    multipleProperties,
    handleSelectProperty,
    handleSearchCatastro,
    handleDemoSearch,
    handleManualEntry,
    loading
}: PropertySearchProps) {
    return (
        <div className="max-w-2xl mx-auto px-8 pb-32">
            <div className="bg-white dark:bg-slate-900 p-12 rounded-lg border border-slate-100 dark:border-slate-800 shadow-xl">
                <h2 className="text-3xl font-serif mb-8 text-center">Busca tu propiedad</h2>

                {/* Search Mode Toggle */}
                <div className="flex gap-4 mb-8">
                    <button
                        onClick={() => {
                            setSearchMode('address');
                            setReferenciaCatastral('');
                        }}
                        className={`flex-1 py-3 px-6 rounded-sm text-sm font-medium transition-all ${searchMode === 'address'
                            ? 'bg-gradient-to-r from-lime-400 to-teal-500 text-[#0a192f]'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                    >
                        Por Dirección
                    </button>
                    <button
                        onClick={() => {
                            setSearchMode('reference');
                            setReferenciaCatastral('');
                        }}
                        className={`flex-1 py-3 px-6 rounded-sm text-sm font-medium transition-all ${searchMode === 'reference'
                            ? 'bg-gradient-to-r from-lime-400 to-teal-500 text-[#0a192f]'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                    >
                        Por Referencia Catastral
                    </button>
                </div>

                <div className="space-y-6">
                    {searchMode === 'address' ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Provincia
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={address.provincia}
                                            onChange={(e) => setAddress({ ...address, provincia: e.target.value.toUpperCase(), municipio: '', via: '', numero: '' })}
                                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none cursor-pointer"
                                        >
                                            <option value="">Selecciona provincia</option>
                                            {provincias.map((p, i) => (
                                                <option key={i} value={p}>{p}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                            <ChevronDown size={16} />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Municipio
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={address.municipio}
                                            onChange={(e) => {
                                                const m = e.target.value.toUpperCase();
                                                setAddress({ ...address, municipio: m, via: '', numero: '' });
                                            }}
                                            disabled={!address.provincia || municipios.length === 0}
                                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <option value="">Selecciona municipio</option>
                                            {municipios.map((m, i) => (
                                                <option key={i} value={m}>{m}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                            <ChevronDown size={16} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="relative" ref={viaRef}>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Calle
                                </label>
                                <input
                                    type="text"
                                    value={address.via}
                                    onChange={(e) => {
                                        setAddress({ ...address, via: e.target.value });
                                        setShowViaSuggestions(true);
                                    }}
                                    onFocus={() => setShowViaSuggestions(true)}
                                    placeholder="Ej: Gran Vía"
                                    autoComplete="off"
                                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                />
                                {showViaSuggestions && viaSuggestions.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-sm shadow-2xl max-h-60 overflow-y-auto backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 animate-in fade-in slide-in-from-top-2 duration-200">
                                        {viaSuggestions.map((v, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => handleSelectVia(v)}
                                                className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-50 last:border-0 dark:border-slate-800 flex items-center gap-2 group"
                                            >
                                                <Search size={14} className="text-slate-400 group-hover:text-teal-500 transition-colors" />
                                                <span className="truncate">{v.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="relative" ref={numRef}>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Número
                                </label>
                                <input
                                    type="text"
                                    value={address.numero}
                                    onChange={(e) => {
                                        setAddress({ ...address, numero: e.target.value });
                                        setShowNumeroSuggestions(true);
                                    }}
                                    onFocus={() => setShowNumeroSuggestions(true)}
                                    placeholder="Ej: 42"
                                    autoComplete="off"
                                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all font-mono"
                                />
                                {showNumeroSuggestions && numeroSuggestions.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-sm shadow-2xl max-h-60 overflow-y-auto backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 animate-in fade-in slide-in-from-top-2 duration-200">
                                        {numeroSuggestions.map((n, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => handleSelectNumero(n)}
                                                className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-50 last:border-0 dark:border-slate-800 flex flex-col group"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle size={14} className="text-teal-500" />
                                                    <span className="font-bold">Número {n.numero} {n.duplicado}</span>
                                                </div>
                                                <div className="text-[10px] text-slate-400 ml-5 font-mono">RC: {n.rc}</div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Referencia Catastral
                            </label>
                            <input
                                type="text"
                                value={referenciaCatastral}
                                onChange={(e) => setReferenciaCatastral(e.target.value.toUpperCase())}
                                placeholder="Ej: 1234567VK1234N0001AB"
                                maxLength={20}
                                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-teal-500 focus:border-transparent font-mono"
                            />
                            <p className="mt-2 text-xs text-slate-500">
                                La referencia catastral tiene 20 caracteres. Puedes encontrarla en tu recibo del IBI o en la Sede Electrónica del Catastro.
                            </p>
                        </div>
                    )}

                    {multipleProperties.length > 0 && (
                        <div className="mt-8 animate-in fade-in slide-in-from-top-4 duration-500">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                                <ChevronDown size={14} />
                                Selecciona tu piso / puerta
                            </h3>
                            <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                                {multipleProperties.map((prop, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSelectProperty(prop)}
                                        className="w-full text-left p-4 rounded-sm border border-slate-100 dark:border-slate-800 hover:border-teal-500 hover:bg-teal-50/30 dark:hover:bg-teal-900/10 transition-all flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 group-hover:bg-teal-500 group-hover:text-white transition-all">
                                                {i + 1}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold group-hover:text-teal-500 transition-all">
                                                    {prop.direccion.split(',')[0]}
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-mono">{prop.referenciaCatastral}</div>
                                            </div>
                                        </div>
                                        <ArrowRight size={14} className="text-slate-300 group-hover:text-teal-500 transition-all" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="pt-4 space-y-4">
                        <button
                            disabled={loading || (searchMode === 'address' && (!address.via || !address.numero)) || (searchMode === 'reference' && referenciaCatastral.length < 14)}
                            onClick={() => handleSearchCatastro()}
                            className="w-full py-4 bg-gradient-to-r from-lime-400 to-teal-500 text-[#0a192f] font-bold text-sm uppercase tracking-widest rounded-sm hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-[#0a192f]/30 border-t-[#0a192f] rounded-full animate-spin" />
                                    Buscando info oficial...
                                </>
                            ) : (
                                <>
                                    Consultar Catastro
                                    <Search size={18} />
                                </>
                            )}
                        </button>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={handleDemoSearch}
                                className="py-3 px-4 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-[10px] uppercase tracking-widest transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                                Probar con ejemplo
                            </button>
                            <button
                                onClick={handleManualEntry}
                                className="py-3 px-4 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-[10px] uppercase tracking-widest transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                                Introducir manual
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

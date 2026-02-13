'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CatastroProperty } from '@/lib/api/catastro';
import { Home, MapPin, Calendar, Ruler, Euro, ArrowRight, Search, CheckCircle, ChevronDown } from 'lucide-react';
import localidadesData from '@/lib/api/localidades_map.json';

export default function VenderPage() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [property, setProperty] = useState<CatastroProperty | null>(null);
    const [estimation, setEstimation] = useState<{ min: number; max: number } | null>(null);
    const [searchMode, setSearchMode] = useState<'address' | 'reference'>('address');

    // Autocomplete state
    const [municipioQuery, setMunicipioQuery] = useState('Gandia');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [viaSuggestions, setViaSuggestions] = useState<any[]>([]);
    const [showViaSuggestions, setShowViaSuggestions] = useState(false);
    const [numeroSuggestions, setNumeroSuggestions] = useState<any[]>([]);
    const [showNumeroSuggestions, setShowNumeroSuggestions] = useState(false);
    const [selectedVia, setSelectedVia] = useState<{ tipo: string, nombre: string } | null>(null);

    const suggestionsRef = useRef<HTMLDivElement>(null);
    const viaRef = useRef<HTMLDivElement>(null);
    const numRef = useRef<HTMLDivElement>(null);

    const [address, setAddress] = useState({
        provincia: 'Valencia',
        municipio: 'Gandia',
        via: '',
        numero: ''
    });

    const [referenciaCatastral, setReferenciaCatastral] = useState('');

    const [contactData, setContactData] = useState({
        nombre: '',
        email: '',
        telefono: '',
        mensaje: ''
    });

    const handleSelectVia = (v: any) => {
        setAddress(prev => ({ ...prev, via: v.label }));
        setSelectedVia({ tipo: v.tipo, nombre: v.nombre });
        setShowViaSuggestions(false);
    };

    const handleSelectNumero = (n: any) => {
        setAddress(prev => ({ ...prev, numero: n.numero }));
        setReferenciaCatastral(n.rc);
        setShowNumeroSuggestions(false);
    };

    // Fetch via suggestions
    useEffect(() => {
        const fetchVias = async () => {
            if (address.via.length < 3) {
                setViaSuggestions([]);
                return;
            }
            try {
                const res = await fetch(`/api/catastro/vias?provincia=${address.provincia}&municipio=${address.municipio}&query=${address.via}`);
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
    }, [address.via, address.municipio, address.provincia]);

    // Fetch numero suggestions
    useEffect(() => {
        const fetchNumeros = async () => {
            if (!selectedVia) return;
            try {
                const res = await fetch(`/api/catastro/numeros?provincia=${address.provincia}&municipio=${address.municipio}&tipoVia=${selectedVia.tipo}&nomVia=${selectedVia.nombre}&numero=${address.numero}`);
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
    }, [address.numero, selectedVia, address.municipio, address.provincia]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
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

    const handleSelectMunicipio = (m: string) => {
        setMunicipioQuery(m);
        setAddress(prev => ({ ...prev, municipio: m, via: '', numero: '' }));
        setSelectedVia(null);
        setReferenciaCatastral('');
        setShowSuggestions(false);
    };

    // Load and memoize all municipalities
    const allMunicipios = useMemo(() => {
        const names = Object.values(localidadesData as Record<string, string>);
        return Array.from(new Set(names)).sort();
    }, []);

    // Filter suggestions when query changes
    useEffect(() => {
        if (municipioQuery.length < 2) {
            setSuggestions([]);
            return;
        }

        const filtered = allMunicipios
            .filter(m => m.toLowerCase().includes(municipioQuery.toLowerCase()))
            .slice(0, 10); // Limit to 10 for performance

        setSuggestions(filtered);
    }, [municipioQuery, allMunicipios]);

    const handleDemoSearch = () => {
        // Datos de ejemplo basados en una propiedad real en Gandia
        const demoProperty: CatastroProperty = {
            referenciaCatastral: '7198701YJ4179N0001XF',
            direccion: 'CL SAN FRANCISCO DE BORJA 1 4 46701 GANDIA (VALENCIA)',
            superficie: 124,
            anoConstruccion: 1985,
            uso: 'Residencial',
            clase: 'Urbano',
            valorCatastral: 85400
        };

        const demoEstimation = {
            min: 128000,
            max: 184500
        };

        setProperty(demoProperty);
        setEstimation(demoEstimation);
        setStep(2);
    };

    const handleManualEntry = () => {
        setProperty({
            referenciaCatastral: 'MANUAL',
            direccion: address.via ? `${address.via} ${address.numero}, ${address.municipio}` : '',
            superficie: 0,
            uso: 'Residencial',
            clase: 'Urbano'
        });
        setStep(2);
    };

    const handleUpdateProperty = (updates: Partial<CatastroProperty>) => {
        if (!property) return;
        setProperty({ ...property, ...updates });
    };

    const handleSearchCatastro = async () => {
        setLoading(true);
        try {
            let details: CatastroProperty | null = null;
            let est: { min: number; max: number } | null = null;

            if (searchMode === 'reference' || referenciaCatastral) {
                // Búsqueda directa por referencia catastral usando API Route
                const response = await fetch(`/api/catastro/details?ref=${encodeURIComponent(referenciaCatastral)}`);

                if (!response.ok) {
                    const errorData = await response.json();
                    alert(errorData.error || 'No se encontró la propiedad.');
                    setLoading(false);
                    return;
                }

                const data = await response.json();
                details = data.property;
                est = data.estimation;

            } else {
                // Búsqueda por dirección usando API Route
                const searchResponse = await fetch('/api/catastro/search', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        ...address,
                        tipoVia: selectedVia?.tipo
                    })
                });

                if (!searchResponse.ok) {
                    alert('Error al buscar en el Catastro. Por favor, verifica la dirección.');
                    setLoading(false);
                    return;
                }

                const searchResult = await searchResponse.json();

                if (searchResult.found && searchResult.properties.length > 0) {
                    const firstProperty = searchResult.properties[0];

                    // Obtener detalles completos
                    const detailsResponse = await fetch(`/api/catastro/details?ref=${encodeURIComponent(firstProperty.referenciaCatastral)}`);

                    if (!detailsResponse.ok) {
                        alert('No se pudieron obtener los detalles de la propiedad.');
                        setLoading(false);
                        return;
                    }

                    const detailsData = await detailsResponse.json();
                    details = detailsData.property;
                    est = detailsData.estimation;

                } else {
                    alert('No se encontró la propiedad en el Catastro. Por favor, verifica la dirección.');
                    setLoading(false);
                    return;
                }
            }

            // Si llegamos aquí, tenemos los detalles
            setProperty(details);
            setEstimation(est);
            setStep(2);

        } catch (error) {
            console.error('Error:', error);
            alert('Error al consultar el Catastro. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitContact = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/leads/valuation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    property,
                    contactData,
                    estimation,
                    address
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || errorData.error || 'Error desconocido');
            }

            alert('¡Solicitud enviada! Un agente se pondrá en contacto contigo pronto para una valoración física profesional.');

            // Reset form y volver al inicio
            setStep(1);
            setProperty(null);
            setEstimation(null);
            setContactData({ nombre: '', email: '', telefono: '', mensaje: '' });
            setAddress({ provincia: 'Valencia', municipio: 'Gandia', via: '', numero: '' });
            setReferenciaCatastral('');
            setMunicipioQuery('Gandia');

        } catch (error: any) {
            console.error('Error enviando lead:', error);
            alert(`Hubo un problema al enviar tu solicitud: ${error.message}\n\nPor favor, inténtalo de nuevo o llámanos directamente.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
            {/* Hero Section */}
            <section className="relative py-32 px-8 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-lime-50 to-teal-50 dark:from-lime-950/20 dark:to-teal-950/20 opacity-50" />

                <div className="relative max-w-4xl mx-auto text-center">
                    <span className="text-[10px] tracking-[0.5em] uppercase text-slate-400 mb-6 block">
                        Tasación Instantánea
                    </span>
                    <h1 className="text-5xl md:text-7xl font-serif mb-8 text-[#0a192f] dark:text-white leading-tight">
                        ¿Cuánto vale tu <br />
                        <span className="italic pr-4 bg-clip-text text-transparent bg-gradient-to-r from-lime-500 to-teal-500">
                            propiedad
                        </span>?
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 font-light max-w-2xl mx-auto">
                        Descubre el valor de mercado de tu inmueble en segundos con datos oficiales del Catastro.
                    </p>
                </div>
            </section>

            {/* Steps Indicator */}
            <div className="max-w-4xl mx-auto px-8 mb-16">
                <div className="flex items-center justify-center gap-4">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= s
                                ? 'bg-gradient-to-r from-lime-400 to-teal-500 text-white'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                                }`}>
                                {step > s ? <CheckCircle size={20} /> : s}
                            </div>
                            {s < 3 && (
                                <div className={`w-16 h-1 mx-2 ${step > s ? 'bg-gradient-to-r from-lime-400 to-teal-500' : 'bg-slate-200 dark:bg-slate-800'
                                    }`} />
                            )}
                        </div>
                    ))}
                </div>
                <div className="flex justify-between mt-4 text-xs uppercase tracking-wider text-slate-500">
                    <span>Búsqueda</span>
                    <span>Datos</span>
                    <span>Contacto</span>
                </div>
            </div>

            {/* Step 1: Search */}
            {step === 1 && (
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
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Provincia
                                            </label>
                                            <input
                                                type="text"
                                                value={address.provincia}
                                                onChange={(e) => setAddress({ ...address, provincia: e.target.value })}
                                                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div className="relative" ref={suggestionsRef}>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Municipio
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={municipioQuery}
                                                    onChange={(e) => {
                                                        setMunicipioQuery(e.target.value);
                                                        setAddress({ ...address, municipio: e.target.value });
                                                        setShowSuggestions(true);
                                                    }}
                                                    onFocus={() => setShowSuggestions(true)}
                                                    autoComplete="off"
                                                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                                    placeholder="Ej: Gandia"
                                                />
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                                    <ChevronDown size={16} />
                                                </div>
                                            </div>

                                            {showSuggestions && suggestions.length > 0 && (
                                                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-sm shadow-2xl max-h-60 overflow-y-auto overflow-x-hidden backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 animate-in fade-in slide-in-from-top-2 duration-200">
                                                    {suggestions.map((m, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => handleSelectMunicipio(m)}
                                                            className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-50 last:border-0 dark:border-slate-800 flex items-center gap-2 group"
                                                        >
                                                            <MapPin size={14} className="text-slate-400 group-hover:text-teal-500 transition-colors" />
                                                            <span className="truncate">{m}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
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
                                                setSelectedVia(null); // Reset selection
                                                setReferenciaCatastral(''); // Clear RC when via changes
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

                            <button
                                onClick={handleSearchCatastro}
                                disabled={loading || (searchMode === 'address' ? (!address.via || !address.numero) : !referenciaCatastral)}
                                className="w-full py-4 bg-gradient-to-r from-lime-400 to-teal-500 text-[#0a192f] font-bold text-sm uppercase tracking-widest rounded-sm hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    'Buscando...'
                                ) : (
                                    <>
                                        <Search size={18} />
                                        Buscar en Catastro
                                    </>
                                )}
                            </button>

                            <div className="pt-4 flex flex-col items-center gap-4">
                                <button
                                    onClick={handleDemoSearch}
                                    className="text-xs text-teal-600 hover:text-teal-700 font-medium underline underline-offset-4"
                                >
                                    ¿No encuentras tu propiedad? Probar con datos de ejemplo
                                </button>

                                <button
                                    onClick={handleManualEntry}
                                    className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    O saltar búsqueda e introducir datos manualmente
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 2: Property Details & Estimation */}
            {step === 2 && property && (
                <div className="max-w-4xl mx-auto px-8 pb-32">
                    <div className="bg-white dark:bg-slate-900 p-12 rounded-lg border border-slate-100 dark:border-slate-800 shadow-xl">
                        <h2 className="text-3xl font-serif mb-8 text-center">Datos de tu propiedad</h2>

                        {/* Property Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                            <div className="p-6 border border-slate-100 dark:border-slate-800 rounded-sm bg-slate-50/50 dark:bg-slate-800/50">
                                <MapPin className="text-teal-500 mb-3" size={24} />
                                <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">Dirección</div>
                                <input
                                    type="text"
                                    value={property.direccion}
                                    onChange={(e) => handleUpdateProperty({ direccion: e.target.value })}
                                    className="w-full bg-transparent font-medium border-b border-transparent focus:border-teal-500 outline-none transition-all"
                                />
                            </div>

                            <div className="p-6 border border-slate-100 dark:border-slate-800 rounded-sm bg-slate-50/50 dark:bg-slate-800/50">
                                <Ruler className="text-teal-500 mb-3" size={24} />
                                <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">Superficie (m²)</div>
                                <input
                                    type="number"
                                    value={property.superficie}
                                    onChange={(e) => handleUpdateProperty({ superficie: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-transparent font-medium border-b border-transparent focus:border-teal-500 outline-none transition-all"
                                />
                            </div>

                            <div className="p-6 border border-slate-100 dark:border-slate-800 rounded-sm bg-slate-50/50 dark:bg-slate-800/50">
                                <Calendar className="text-teal-500 mb-3" size={24} />
                                <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">Año Construcción</div>
                                <input
                                    type="number"
                                    value={property.anoConstruccion || ''}
                                    onChange={(e) => handleUpdateProperty({ anoConstruccion: parseInt(e.target.value) || undefined })}
                                    placeholder="Ej: 2005"
                                    className="w-full bg-transparent font-medium border-b border-transparent focus:border-teal-500 outline-none transition-all"
                                />
                            </div>

                            <div className="p-6 border border-slate-100 dark:border-slate-800 rounded-sm bg-slate-50/50 dark:bg-slate-800/50">
                                <Home className="text-teal-500 mb-3" size={24} />
                                <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">Uso Principal</div>
                                <select
                                    value={property.uso}
                                    onChange={(e) => handleUpdateProperty({ uso: e.target.value })}
                                    className="w-full bg-transparent font-medium border-b border-transparent focus:border-teal-500 outline-none transition-all cursor-pointer"
                                >
                                    <option value="Residencial">Residencial</option>
                                    <option value="Comercial">Comercial</option>
                                    <option value="Oficinas">Oficinas</option>
                                    <option value="Industrial">Industrial</option>
                                    <option value="Otros">Otros</option>
                                </select>
                            </div>

                            {property.valorCatastral !== undefined && (
                                <div className="p-6 border border-slate-100 dark:border-slate-800 rounded-sm bg-slate-50/50 dark:bg-slate-800/50">
                                    <Euro className="text-teal-500 mb-3" size={24} />
                                    <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">Valor Catastral</div>
                                    <div className="font-medium text-slate-400">{property.valorCatastral.toLocaleString('es-ES')}€</div>
                                    <div className="text-[10px] text-slate-400 mt-1 italic">(Informativo Catastro)</div>
                                </div>
                            )}
                        </div>

                        {/* Market Estimation */}
                        {estimation && (
                            <div className="bg-gradient-to-br from-lime-50 to-teal-50 dark:from-lime-950/20 dark:to-teal-950/20 p-8 rounded-lg mb-8">
                                <h3 className="text-2xl font-serif mb-4 text-center">Estimación de Mercado</h3>
                                <div className="text-center">
                                    <div className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-lime-500 to-teal-500 mb-2">
                                        {estimation.min.toLocaleString('es-ES')}€ - {estimation.max.toLocaleString('es-ES')}€
                                    </div>
                                    <p className="text-sm text-slate-500">
                                        *Estimación basada en valor catastral. Para una tasación precisa, contacta con nuestro equipo.
                                    </p>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => setStep(3)}
                            className="w-full py-4 bg-gradient-to-r from-lime-400 to-teal-500 text-[#0a192f] font-bold text-sm uppercase tracking-widest rounded-sm hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            Solicitar Tasación Profesional
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Contact Form */}
            {step === 3 && (
                <div className="max-w-2xl mx-auto px-8 pb-32">
                    <div className="bg-white dark:bg-slate-900 p-12 rounded-lg border border-slate-100 dark:border-slate-800 shadow-xl">
                        <h2 className="text-3xl font-serif mb-8 text-center">Solicita tu tasación profesional</h2>

                        <form onSubmit={handleSubmitContact} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Nombre completo
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={contactData.nombre}
                                    onChange={(e) => setContactData({ ...contactData, nombre: e.target.value })}
                                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={contactData.email}
                                    onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Teléfono
                                </label>
                                <input
                                    type="tel"
                                    required
                                    value={contactData.telefono}
                                    onChange={(e) => setContactData({ ...contactData, telefono: e.target.value })}
                                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Mensaje (opcional)
                                </label>
                                <textarea
                                    rows={4}
                                    value={contactData.mensaje}
                                    onChange={(e) => setContactData({ ...contactData, mensaje: e.target.value })}
                                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    placeholder="Cuéntanos más sobre tu propiedad..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-gradient-to-r from-lime-400 to-teal-500 text-[#0a192f] font-bold text-sm uppercase tracking-widest rounded-sm hover:shadow-lg transition-all disabled:opacity-50"
                            >
                                {loading ? 'Enviando...' : 'Enviar Solicitud'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

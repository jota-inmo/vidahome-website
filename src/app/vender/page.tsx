'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CatastroProperty } from '@/lib/api/catastro';
import { Home, MapPin, Calendar, Ruler, Euro, ArrowRight, Search, CheckCircle, ChevronDown, Bed, Bath, Droplets, ArrowUpSquare, Waves, Palmtree, Sun, Hammer } from 'lucide-react';
import { getCatastroProvinciasAction, getCatastroMunicipiosAction } from '@/app/actions';
import { toast } from 'sonner';

export default function VenderPage() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [property, setProperty] = useState<CatastroProperty | null>(null);
    const [estimation, setEstimation] = useState<{ min: number; max: number } | null>(null);
    const [searchMode, setSearchMode] = useState<'address' | 'reference'>('address');

    // Dropdown lists
    const [provincias, setProvincias] = useState<string[]>([]);
    const [municipios, setMunicipios] = useState<string[]>([]);

    // Autocomplete state
    const [viaSuggestions, setViaSuggestions] = useState<any[]>([]);
    const [showViaSuggestions, setShowViaSuggestions] = useState(false);
    const [numeroSuggestions, setNumeroSuggestions] = useState<any[]>([]);
    const [showNumeroSuggestions, setShowNumeroSuggestions] = useState(false);
    const [selectedVia, setSelectedVia] = useState<{ tipo: string, nombre: string } | null>(null);

    const viaRef = useRef<HTMLDivElement>(null);
    const numRef = useRef<HTMLDivElement>(null);

    const [address, setAddress] = useState({
        provincia: 'VALENCIA',
        municipio: 'GANDIA',
        via: '',
        numero: ''
    });

    // Fetch initial data
    useEffect(() => {
        const loadProvincias = async () => {
            const data = await getCatastroProvinciasAction();
            setProvincias(data);
        };
        loadProvincias();
    }, []);

    // Fetch municipios when provincia changes
    useEffect(() => {
        const loadMunicipios = async () => {
            if (!address.provincia) return;
            const data = await getCatastroMunicipiosAction(address.provincia);
            setMunicipios(data);

            // Si la provincia cambia, reseteamos el municipio al primero de la lista o vacío
            if (data.length > 0 && !data.includes(address.municipio)) {
                // No forzamos cambio automático para no molestar al usuario si Gandia existe
                if (address.provincia === 'VALENCIA' && data.includes('GANDIA')) {
                    // Mantener Gandia
                } else {
                    // Dejar que el usuario elija o poner el primero
                    // setAddress(prev => ({ ...prev, municipio: data[0] }));
                }
            }
        };
        loadMunicipios();
    }, [address.provincia]);

    const [referenciaCatastral, setReferenciaCatastral] = useState('');

    const [contactData, setContactData] = useState({
        nombre: '',
        email: '',
        telefono: '',
        mensaje: ''
    });

    const handleSelectVia = (v: any) => {
        setAddress(prev => ({ ...prev, via: v.nombre }));
        setSelectedVia({ tipo: v.tipo, nombre: v.nombre });
        setShowViaSuggestions(false);
    };

    const handleSelectNumero = (n: any) => {
        setAddress(prev => ({ ...prev, numero: n.numero }));
        setReferenciaCatastral(n.rc);
        setShowNumeroSuggestions(false);
        // Disparar la búsqueda automáticamente al elegir número
        setTimeout(() => handleSearchCatastro(n.rc), 0);
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
        setAddress(prev => ({ ...prev, municipio: m, via: '', numero: '' }));
        setSelectedVia(null);
        setReferenciaCatastral('');
    };

    const handleDemoSearch = () => {
        // Datos de ejemplo basados en una propiedad real en Gandia
        const demoProperty: CatastroProperty = {
            referenciaCatastral: '7198701YJ4179N0001XF',
            direccion: 'CL SAN FRANCISCO DE BORJA 1 4 46701 GANDIA (VALENCIA)',
            superficie: 124,
            anoConstruccion: 1985,
            uso: 'Residencial',
            clase: 'Urbano',
            valorCatastral: 85400,
            habitaciones: 3,
            banos: 2,
            aseos: 0,
            terraza: true,
            terrazaM2: 12,
            ascensor: true
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
            clase: 'Urbano',
            habitaciones: 1,
            banos: 1,
            aseos: 0,
            terraza: false,
            reformado: false,
            ascensor: false,
            piscina: false,
            jardin: false
        });
        setStep(2);
    };

    const handleUpdateProperty = (updates: Partial<CatastroProperty>) => {
        if (!property) return;
        setProperty({ ...property, ...updates });
    };

    const [multipleProperties, setMultipleProperties] = useState<CatastroProperty[]>([]);

    const handleSearchCatastro = async (overrideRc?: string) => {
        setLoading(true);
        setMultipleProperties([]);
        try {
            let details: CatastroProperty | null = null;
            let est: { min: number; max: number } | null = null;

            const rcToUse = overrideRc || referenciaCatastral;
            const cleanRc = rcToUse.replace(/\s/g, '').toUpperCase();

            // Si tenemos una RC COMPLETA (18-20 caracteres), pedir detalles directamente
            if (cleanRc && cleanRc.length >= 18) {
                const response = await fetch(`/api/catastro/details?ref=${encodeURIComponent(cleanRc)}`);

                if (!response.ok) {
                    const errorData = await response.json();
                    toast.error(errorData.error || 'No se encontró la propiedad.');
                    setLoading(false);
                    return;
                }

                const data = await response.json();
                details = data.property;
                est = data.estimation;
            }
            // Si es búsqueda por dirección O RC de parcela (14 caracteres)
            else {
                const isRcParcela = cleanRc.length === 14;
                const searchBody = isRcParcela
                    ? { rc: cleanRc }
                    : {
                        ...address,
                        tipoVia: selectedVia?.tipo
                    };

                console.log('[Frontend] Buscando:', isRcParcela ? `Parcela ${cleanRc}` : `Dirección ${address.via}`);

                const searchResponse = await fetch('/api/catastro/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(searchBody)
                });

                if (!searchResponse.ok) {
                    const err = await searchResponse.json();
                    toast.error(err.message || err.error || 'Error al buscar en el Catastro.');
                    setLoading(false);
                    return;
                }

                const searchResult = await searchResponse.json();

                if (searchResult.found && searchResult.properties.length > 0) {
                    // Si hay varios inmuebles (pisos/puertas)
                    if (searchResult.properties.length > 1) {
                        setMultipleProperties(searchResult.properties);
                        setLoading(false);
                        return; // Se queda esperando selección
                    }

                    // Si solo hay uno, obtener sus detalles completos
                    const singleProp = searchResult.properties[0];
                    const detailsResponse = await fetch(`/api/catastro/details?ref=${encodeURIComponent(singleProp.referenciaCatastral)}`);

                    if (detailsResponse.ok) {
                        const detailsData = await detailsResponse.json();
                        details = detailsData.property;
                        est = detailsData.estimation;
                    }
                } else {
                    toast.error(searchResult.error || 'No se encontraron resultados para esa búsqueda.');
                    setLoading(false);
                    return;
                }
            }

            // Si llegamos aquí con detalles, pasar al siguiente paso
            if (details) {
                setProperty(details);
                setEstimation(est);
                setStep(2);
                toast.success('¡Propiedad encontrada!');
            }

        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al consultar el Catastro. Revisa la conexión e inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectProperty = async (prop: CatastroProperty) => {
        setLoading(true);
        try {
            const detailsResponse = await fetch(`/api/catastro/details?ref=${encodeURIComponent(prop.referenciaCatastral)}`);
            if (!detailsResponse.ok) {
                toast.error('No se pudieron obtener los detalles de la propiedad seleccionada.');
                return;
            }
            const detailsData = await detailsResponse.json();
            setProperty(detailsData.property);
            setEstimation(detailsData.estimation);
            setMultipleProperties([]);
            setStep(2);
        } catch (error) {
            console.error('Error selecting property:', error);
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

            toast.success('¡Solicitud enviada!', {
                description: 'Un agente se pondrá en contacto contigo pronto para una valoración física profesional.'
            });

            // Reset form y volver al inicio
            setStep(1);
            setProperty(null);
            setEstimation(null);
            setContactData({ nombre: '', email: '', telefono: '', mensaje: '' });
            setAddress({ provincia: 'VALENCIA', municipio: 'GANDIA', via: '', numero: '' });
            setReferenciaCatastral('');

        } catch (error: any) {
            console.error('Error enviando lead:', error);
            toast.error('Hubo un problema al enviar tu solicitud', {
                description: `${error.message}. Por favor, inténtalo de nuevo o llámanos directamente.`
            });
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
                                                        <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                                            {(() => {
                                                                const parts = prop.direccion.split(',');
                                                                const calle = parts[0];
                                                                const detalles = parts.slice(1).join(',').trim();
                                                                return (
                                                                    <>
                                                                        {calle}
                                                                        {detalles && (
                                                                            <span className="text-teal-600 dark:text-teal-400 font-bold ml-1">
                                                                                — {detalles}
                                                                            </span>
                                                                        )}
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                        <div className="text-[10px] font-mono text-slate-400 uppercase">{prop.referenciaCatastral}</div>
                                                    </div>
                                                </div>
                                                <ArrowRight size={14} className="text-slate-300 group-hover:text-teal-500 transition-all" />
                                            </button>
                                        ))}
                                    </div>
                                    <p className="mt-4 text-[10px] text-slate-400 italic text-center">
                                        Se han encontrado {multipleProperties.length} inmuebles en esta dirección.
                                    </p>
                                </div>
                            )}

                            <button
                                onClick={() => handleSearchCatastro()}
                                disabled={loading || (searchMode === 'address' ? (!address.via || !address.numero) : !referenciaCatastral)}
                                className="w-full py-4 bg-gradient-to-r from-lime-400 to-teal-500 text-[#0a192f] font-bold text-sm uppercase tracking-widest rounded-sm hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    'Buscando...'
                                ) : (
                                    <>
                                        {multipleProperties.length > 0 ? (
                                            <>
                                                <Search size={18} />
                                                Nueva búsqueda
                                            </>
                                        ) : (
                                            <>
                                                <Search size={18} />
                                                Buscar en Catastro
                                            </>
                                        )}
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

                        {/* Extra Details Grid */}
                        <div className="mb-12">
                            <h3 className="text-xl font-serif mb-6 flex items-center gap-2">
                                <span className="w-8 h-1 bg-teal-500 rounded-full"></span>
                                Detalles de la vivienda
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="p-4 border border-slate-100 dark:border-slate-800 rounded-sm flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-teal-500">
                                        <Bed size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-[10px] uppercase tracking-wider text-slate-400">Habitaciones</div>
                                        <input
                                            type="number"
                                            value={property.habitaciones || 0}
                                            onChange={(e) => handleUpdateProperty({ habitaciones: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-transparent font-bold text-lg outline-none focus:text-teal-500 transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="p-4 border border-slate-100 dark:border-slate-800 rounded-sm flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-teal-500">
                                        <Bath size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-[10px] uppercase tracking-wider text-slate-400">Baños</div>
                                        <input
                                            type="number"
                                            value={property.banos || 0}
                                            onChange={(e) => handleUpdateProperty({ banos: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-transparent font-bold text-lg outline-none focus:text-teal-500 transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="p-4 border border-slate-100 dark:border-slate-800 rounded-sm flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-teal-500">
                                        <Droplets size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-[10px] uppercase tracking-wider text-slate-400">Aseos</div>
                                        <input
                                            type="number"
                                            value={property.aseos || 0}
                                            onChange={(e) => handleUpdateProperty({ aseos: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-transparent font-bold text-lg outline-none focus:text-teal-500 transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-800 rounded-sm">
                                        <div className="flex items-center gap-3">
                                            <Sun size={20} className="text-teal-500" />
                                            <span className="text-sm font-medium">¿Tiene Terraza?</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={property.terraza || false}
                                            onChange={(e) => handleUpdateProperty({ terraza: e.target.checked })}
                                            className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                        />
                                    </div>
                                    {property.terraza && (
                                        <div className="pl-12 flex items-center gap-4 animate-in fade-in slide-in-from-left-2 duration-200">
                                            <div className="text-xs text-slate-400">Superficie Ter. (m²)</div>
                                            <input
                                                type="number"
                                                value={property.terrazaM2 || 0}
                                                onChange={(e) => handleUpdateProperty({ terrazaM2: parseInt(e.target.value) || 0 })}
                                                className="w-20 px-2 py-1 border-b border-slate-200 focus:border-teal-500 outline-none transition-all font-bold"
                                            />
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-800 rounded-sm">
                                        <div className="flex items-center gap-3">
                                            <Hammer size={20} className="text-teal-500" />
                                            <span className="text-sm font-medium">¿Está Reformado?</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={property.reformado || false}
                                            onChange={(e) => handleUpdateProperty({ reformado: e.target.checked })}
                                            className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                        />
                                    </div>
                                    {property.reformado && (
                                        <div className="pl-12 flex items-center gap-4 animate-in fade-in slide-in-from-left-2 duration-200">
                                            <div className="text-xs text-slate-400">Año de Reforma</div>
                                            <input
                                                type="number"
                                                value={property.anoReforma || ''}
                                                onChange={(e) => handleUpdateProperty({ anoReforma: parseInt(e.target.value) || undefined })}
                                                className="w-20 px-2 py-1 border-b border-slate-200 focus:border-teal-500 outline-none transition-all font-bold"
                                                placeholder="2020"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-800 rounded-sm">
                                        <div className="flex items-center gap-3">
                                            <ArrowUpSquare size={20} className="text-teal-500" />
                                            <span className="text-sm font-medium">Tiene Ascensor</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={property.ascensor || false}
                                            onChange={(e) => handleUpdateProperty({ ascensor: e.target.checked })}
                                            className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-800 rounded-sm">
                                        <div className="flex items-center gap-3">
                                            <Waves size={20} className="text-teal-500" />
                                            <span className="text-sm font-medium">Tiene Piscina</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={property.piscina || false}
                                            onChange={(e) => handleUpdateProperty({ piscina: e.target.checked })}
                                            className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-800 rounded-sm">
                                        <div className="flex items-center gap-3">
                                            <Palmtree size={20} className="text-teal-500" />
                                            <span className="text-sm font-medium">Tiene Jardín</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={property.jardin || false}
                                            onChange={(e) => handleUpdateProperty({ jardin: e.target.checked })}
                                            className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                        />
                                    </div>
                                </div>
                            </div>
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

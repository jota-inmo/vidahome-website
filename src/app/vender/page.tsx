'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CatastroProperty } from '@/lib/api/catastro';
import { getCatastroProvinciasAction, getCatastroMunicipiosAction } from '@/app/actions';
import { toast } from 'sonner';

// Componentes refactorizados
import { StepsIndicator } from './components/StepsIndicator';
import { PropertySearch } from './components/PropertySearch';
import { PropertyDetailsDisplay } from './components/PropertyDetailsDisplay';
import { ValuationContactForm } from './components/ValuationContactForm';

export default function VenderPage() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [property, setProperty] = useState<CatastroProperty | null>(null);
    const [estimation, setEstimation] = useState<{ min: number; max: number } | null>(null);
    const [searchMode, setSearchMode] = useState<'address' | 'reference'>('address');

    // Listas para desplegables
    const [provincias, setProvincias] = useState<string[]>([]);
    const [municipios, setMunicipios] = useState<string[]>([]);

    // Estados de autocompletado y selección
    const [viaSuggestions, setViaSuggestions] = useState<any[]>([]);
    const [showViaSuggestions, setShowViaSuggestions] = useState(false);
    const [numeroSuggestions, setNumeroSuggestions] = useState<any[]>([]);
    const [showNumeroSuggestions, setShowNumeroSuggestions] = useState(false);
    const [selectedVia, setSelectedVia] = useState<{ tipo: string, nombre: string } | null>(null);
    const [multipleProperties, setMultipleProperties] = useState<CatastroProperty[]>([]);
    const [referenciaCatastral, setReferenciaCatastral] = useState('');

    const viaRef = useRef<HTMLDivElement>(null);
    const numRef = useRef<HTMLDivElement>(null);

    const [address, setAddress] = useState({
        provincia: 'VALENCIA',
        municipio: 'GANDIA',
        via: '',
        numero: ''
    });

    const [contactData, setContactData] = useState({
        nombre: '',
        email: '',
        telefono: '',
        mensaje: ''
    });

    // Carga inicial de provincias
    useEffect(() => {
        const loadProvincias = async () => {
            const data = await getCatastroProvinciasAction();
            setProvincias(data);
        };
        loadProvincias();
    }, []);

    // Carga de municipios por provincia
    useEffect(() => {
        const loadMunicipios = async () => {
            if (!address.provincia) return;
            const data = await getCatastroMunicipiosAction(address.provincia);
            setMunicipios(data);
        };
        loadMunicipios();
    }, [address.provincia]);

    // Lógica de autocompletado de calles
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

    // Lógica de autocompletado de números
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

    const handleSelectVia = (v: any) => {
        setAddress(prev => ({ ...prev, via: v.nombre }));
        setSelectedVia({ tipo: v.tipo, nombre: v.nombre });
        setShowViaSuggestions(false);
    };

    const handleSelectNumero = (n: any) => {
        setAddress(prev => ({ ...prev, numero: n.numero }));
        setReferenciaCatastral(n.rc);
        setShowNumeroSuggestions(false);
        setTimeout(() => handleSearchCatastro(n.rc), 0);
    };

    const handleSearchCatastro = async (overrideRc?: string) => {
        setLoading(true);
        setMultipleProperties([]);
        try {
            let details: CatastroProperty | null = null;
            let est: { min: number; max: number } | null = null;

            const rcToUse = overrideRc || referenciaCatastral;
            const cleanRc = rcToUse.replace(/\s/g, '').toUpperCase();

            // Búsqueda directa por RC Completa
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
            // Búsqueda por dirección o parcela (RC 14)
            else {
                const isRcParcela = cleanRc.length === 14;
                const searchBody = isRcParcela ? { rc: cleanRc } : { ...address, tipoVia: selectedVia?.tipo };

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
                    if (searchResult.properties.length > 1) {
                        setMultipleProperties(searchResult.properties);
                        setLoading(false);
                        return;
                    }

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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ property, contactData, estimation, address })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || errorData.error || 'Error desconocido');
            }

            toast.success('¡Solicitud enviada!', {
                description: 'Un agente se pondrá en contacto contigo pronto para una valoración física profesional.'
            });

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

    const handleDemoSearch = () => {
        setProperty({
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
        });
        setEstimation({ min: 128000, max: 184500 });
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

            <StepsIndicator currentStep={step} />

            {step === 1 && (
                <PropertySearch
                    searchMode={searchMode}
                    setSearchMode={setSearchMode}
                    address={address}
                    setAddress={setAddress}
                    referenciaCatastral={referenciaCatastral}
                    setReferenciaCatastral={setReferenciaCatastral}
                    provincias={provincias}
                    municipios={municipios}
                    viaSuggestions={viaSuggestions}
                    showViaSuggestions={showViaSuggestions}
                    setShowViaSuggestions={setShowViaSuggestions}
                    numeroSuggestions={numeroSuggestions}
                    showNumeroSuggestions={showNumeroSuggestions}
                    setShowNumeroSuggestions={setShowNumeroSuggestions}
                    handleSelectVia={handleSelectVia}
                    handleSelectNumero={handleSelectNumero}
                    viaRef={viaRef}
                    numRef={numRef}
                    multipleProperties={multipleProperties}
                    handleSelectProperty={handleSelectProperty}
                    handleSearchCatastro={handleSearchCatastro}
                    handleDemoSearch={handleDemoSearch}
                    handleManualEntry={handleManualEntry}
                    loading={loading}
                />
            )}

            {step === 2 && property && (
                <PropertyDetailsDisplay
                    property={property}
                    estimation={estimation}
                    handleUpdateProperty={handleUpdateProperty}
                    setStep={setStep}
                />
            )}

            {step === 3 && (
                <ValuationContactForm
                    contactData={contactData}
                    setContactData={setContactData}
                    handleSubmitContact={handleSubmitContact}
                    loading={loading}
                />
            )}
        </div>
    );
}

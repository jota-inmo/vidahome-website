'use client';

import React, { useEffect, useState } from 'react';
import { getPropertiesForTranslationAction, savePropertyTranslationAction, runAutoTranslationAction } from '@/app/actions/translations';
import { checkAuthAction, logoutAction } from '@/app/actions';
import { useRouter } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { Languages, Save, ArrowLeft, Search, CheckCircle2, AlertCircle, Sparkles, Loader2 } from 'lucide-react';

export default function TranslationsAdmin() {
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProp, setSelectedProp] = useState<any | null>(null);
    const [editData, setEditData] = useState<{ es: string, en: string, fr: string, de: string, it: string, pl: string }>({ es: '', en: '', fr: '', de: '', it: '', pl: '' });
    const [saving, setSaving] = useState(false);
    const [translating, setTranslating] = useState(false);
    const [translationResult, setTranslationResult] = useState<any | null>(null);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | null }>({ text: '', type: null });
    const [searchTerm, setSearchTerm] = useState('');
    const router = useRouter();

    useEffect(() => {
        async function check() {
            const isAuthed = await checkAuthAction();
            if (!isAuthed) {
                router.push('/admin/login');
                return;
            }
            loadProperties();
        }
        check();
    }, [router]);

    async function loadProperties() {
        setLoading(true);
        const res = await getPropertiesForTranslationAction();
        if (res.success && res.data) {
            setProperties(res.data);
        }
        setLoading(false);
    }

    const handleSelectProp = (prop: any) => {
        setSelectedProp(prop);
        setEditData({
            es: prop.description_es || '',
            en: prop.description_en || '',
            fr: prop.description_fr || '',
            de: prop.description_de || '',
            it: prop.description_it || '',
            pl: prop.description_pl || ''
        });
        setMessage({ text: '', type: null });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSave = async () => {
        if (!selectedProp) return;
        setSaving(true);
        const res = await savePropertyTranslationAction(selectedProp.property_id, editData);
        if (res.success) {
            setMessage({ text: 'Traducciones guardadas correctamente', type: 'success' });
            loadProperties();
            setTimeout(() => {
                if (window.confirm('¿Deseas volver a la lista?')) {
                    setSelectedProp(null);
                }
            }, 500);
        } else {
            setMessage({ text: res.error || 'Error al guardar', type: 'error' });
        }
        setSaving(false);
    };

    const handleAutoTranslate = async () => {
        setTranslating(true);
        setTranslationResult(null);
        const res = await runAutoTranslationAction();
        if (res.success && 'translated' in res) {
            setTranslationResult(res);
            setMessage({ text: `¡Traducción completada! ${res.translated} anuncios procesados.`, type: 'success' });
            loadProperties();
        } else {
            setMessage({ text: res.error || 'Error en la traducción automática', type: 'error' });
        }
        setTranslating(false);
    };

    const filteredProperties = properties.filter(p =>
        p.ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(p.cod_ofer).includes(searchTerm)
    );

    if (loading && properties.length === 0) return (
        <div className="min-h-screen bg-[#0a192f] flex items-center justify-center font-serif italic text-white/40">
            Descifrando base de metadatos...
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-32 pb-20 px-8">
            <div className="max-w-6xl mx-auto">
                <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                    <div className="flex-1">
                        <span className="text-[10px] tracking-[0.4em] uppercase text-slate-400 mb-4 block">Gestión de Contenido</span>
                        <h1 className="text-4xl md:text-5xl font-serif text-[#0a192f] dark:text-white">Fábrica de <span className="italic text-slate-400">Traducciones</span></h1>
                        <p className="mt-4 text-slate-500 font-light">Edita y perfecciona las descripciones en múltiples idiomas.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <button
                            onClick={handleAutoTranslate}
                            disabled={translating}
                            className={`flex items-center gap-3 px-6 py-4 rounded-sm text-[10px] uppercase tracking-widest font-bold transition-all shadow-xl group ${translating ? 'bg-slate-100 text-slate-400' : 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:scale-105 active:scale-95 shadow-blue-500/20'}`}
                        >
                            {translating ? (
                                <><Loader2 size={16} className="animate-spin" /> Procesando con Perplexity...</>
                            ) : (
                                <><Sparkles size={16} className="text-blue-200 group-hover:animate-pulse" /> Traducir anuncios pendientes</>
                            )}
                        </button>
                        <Link href="/admin" className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-slate-500 hover:text-[#0a192f] dark:hover:text-white transition-all underline decoration-slate-200 underline-offset-8">
                            <ArrowLeft size={14} /> Volver al Panel
                        </Link>
                    </div>
                </header>

                {translationResult && (
                    <div className="mb-12 p-8 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-sm animate-in slide-in-from-top-4 duration-500">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                            <div className="flex-1">
                                <h4 className="text-sm font-bold uppercase tracking-widest text-blue-900 dark:text-blue-100 flex items-center gap-2">
                                    <CheckCircle2 size={16} /> Resultado del Proceso
                                </h4>
                                <div className="grid grid-cols-3 gap-8 mt-6">
                                    <div>
                                        <p className="text-[10px] text-blue-600/60 uppercase tracking-tighter mb-1">Traducidos</p>
                                        <p className="text-2xl font-serif text-blue-900 dark:text-white">{translationResult.translated}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-blue-600/60 uppercase tracking-tighter mb-1">Errores</p>
                                        <p className="text-2xl font-serif text-blue-900 dark:text-white">{translationResult.errors}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-blue-600/60 uppercase tracking-tighter mb-1">Coste Estimado</p>
                                        <p className="text-2xl font-serif text-blue-900 dark:text-white">{translationResult.cost_estimate}</p>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setTranslationResult(null)} className="text-[10px] uppercase font-bold tracking-widest text-blue-400 hover:text-blue-900">Cerrar</button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Lista de Propiedades */}
                    <div className={`lg:col-span-5 ${selectedProp ? 'hidden lg:block' : 'block'}`}>
                        <div className="sticky top-32">
                            <div className="relative mb-6">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Buscar por Ref o ID..."
                                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-sm text-sm focus:outline-none focus:border-blue-500 transition-all font-light"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-sm max-h-[60vh] overflow-y-auto custom-scrollbar">
                                {filteredProperties.length === 0 ? (
                                    <div className="p-10 text-center text-slate-400 font-serif italic text-sm">No se encontraron propiedades.</div>
                                ) : (
                                    filteredProperties.map((prop) => (
                                        <div
                                            key={prop.cod_ofer}
                                            onClick={() => handleSelectProp(prop)}
                                            className={`p-6 border-b border-slate-50 dark:border-slate-800/50 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/30 ${selectedProp?.cod_ofer === prop.cod_ofer ? 'bg-blue-50 dark:bg-blue-900/10 border-l-4 border-l-blue-600' : ''}`}
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-serif text-lg text-slate-900 dark:text-slate-100">Ref: {prop.ref}</span>
                                                <span className="text-[10px] text-slate-400 uppercase tracking-tighter">ID: {prop.cod_ofer}</span>
                                            </div>
                                            <div className="flex gap-2 items-center">
                                                <div className="flex -space-x-1">
                                                    {prop.description_es && <span title="Español" className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900 text-[8px] flex items-center justify-center font-bold text-blue-600 dark:text-blue-300 border border-white dark:border-slate-900 uppercase">ES</span>}
                                                    {prop.description_en && <span title="Inglés" className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900 text-[8px] flex items-center justify-center font-bold text-emerald-600 dark:text-emerald-300 border border-white dark:border-slate-900 uppercase">EN</span>}
                                                    {prop.description_fr && <span title="Francés" className="w-4 h-4 rounded-full bg-amber-100 dark:bg-amber-900 text-[8px] flex items-center justify-center font-bold text-amber-600 dark:text-amber-300 border border-white dark:border-slate-900 uppercase">FR</span>}
                                                    {prop.description_de && <span title="Alemán" className="w-4 h-4 rounded-full bg-purple-100 dark:bg-purple-900 text-[8px] flex items-center justify-center font-bold text-purple-600 dark:text-purple-300 border border-white dark:border-slate-900 uppercase">DE</span>}
                                                    {prop.description_it && <span title="Italiano" className="w-4 h-4 rounded-full bg-rose-100 dark:bg-rose-900 text-[8px] flex items-center justify-center font-bold text-rose-600 dark:text-rose-300 border border-white dark:border-slate-900 uppercase">IT</span>}
                                                    {prop.description_pl && <span title="Polaco" className="w-4 h-4 rounded-full bg-cyan-100 dark:bg-cyan-900 text-[8px] flex items-center justify-center font-bold text-cyan-600 dark:text-cyan-300 border border-white dark:border-slate-900 uppercase">PL</span>}
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-light truncate">
                                                    {(prop.description_es || '').substring(0, 40)}...
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Editor de Traducciones */}
                    <div className="lg:col-span-7">
                        {!selectedProp ? (
                            <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white/50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg p-20 text-center">
                                <Languages className="w-16 h-16 text-slate-200 dark:text-slate-800 mb-6" />
                                <h3 className="text-xl font-serif text-slate-400">Selecciona una propiedad</h3>
                                <p className="text-slate-400 font-light mt-2 max-w-xs">Haz clic en una vivienda de la izquierda para empezar a editar sus traducciones en tiempo real.</p>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm shadow-2xl shadow-slate-200/50 dark:shadow-none p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex justify-between items-start mb-10">
                                    <button
                                        onClick={() => setSelectedProp(null)}
                                        className="lg:hidden p-2 text-slate-400 hover:text-[#0a192f]"
                                    >
                                        <ArrowLeft size={18} />
                                    </button>
                                    <div className="flex-1 lg:flex-none">
                                        <h3 className="text-2xl font-serif text-slate-900 dark:text-white">Editando <span className="italic text-slate-400">{selectedProp.ref}</span></h3>
                                        <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">Perplexity AI Engine Ready</p>
                                    </div>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className={`flex items-center gap-3 px-8 py-3 rounded-sm text-[10px] uppercase tracking-widest font-bold transition-all shadow-lg ${saving ? 'bg-slate-100 text-slate-400' : 'bg-[#0a192f] text-white hover:bg-black shadow-blue-900/20'}`}
                                    >
                                        {saving ? 'Guardando...' : <><Save size={14} /> Guardar Cambios</>}
                                    </button>
                                </div>

                                {message.text && (
                                    <div className={`mb-8 p-4 rounded-sm flex items-center gap-3 text-xs font-medium animate-in zoom-in-95 duration-300 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                        {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                        {message.text}
                                    </div>
                                )}

                                <div className="space-y-10">
                                    {/* Español */}
                                    <div>
                                        <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-3">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Español (Original)
                                        </label>
                                        <textarea
                                            value={editData.es}
                                            onChange={(e) => setEditData({ ...editData, es: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-6 rounded-sm text-sm font-light leading-relaxed focus:outline-none focus:border-blue-500 transition-colors min-h-[150px] custom-scrollbar"
                                            placeholder="Escribe la descripción en español..."
                                        />
                                    </div>

                                    {/* Inglés */}
                                    <div>
                                        <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-3">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Inglés / English
                                        </label>
                                        <textarea
                                            value={editData.en}
                                            onChange={(e) => setEditData({ ...editData, en: e.target.value })}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-sm text-sm font-light leading-relaxed focus:outline-none focus:border-blue-500 transition-colors min-h-[150px] border-l-4 border-l-emerald-500/20 custom-scrollbar"
                                            placeholder="Translate or edit the English version..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Francés */}
                                        <div>
                                            <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-3">
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Francés / Français
                                            </label>
                                            <textarea
                                                value={editData.fr}
                                                onChange={(e) => setEditData({ ...editData, fr: e.target.value })}
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-sm text-sm font-light leading-relaxed focus:outline-none focus:border-blue-500 transition-colors min-h-[100px] custom-scrollbar"
                                                placeholder="Version française..."
                                            />
                                        </div>

                                        {/* Alemán */}
                                        <div>
                                            <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-3">
                                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Alemán / Deutsch
                                            </label>
                                            <textarea
                                                value={editData.de}
                                                onChange={(e) => setEditData({ ...editData, de: e.target.value })}
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-sm text-sm font-light leading-relaxed focus:outline-none focus:border-blue-500 transition-colors min-h-[100px] custom-scrollbar"
                                                placeholder="Deutsche Version..."
                                            />
                                        </div>

                                        {/* Italiano */}
                                        <div>
                                            <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-3">
                                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Italiano / Italiano
                                            </label>
                                            <textarea
                                                value={editData.it}
                                                onChange={(e) => setEditData({ ...editData, it: e.target.value })}
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-sm text-sm font-light leading-relaxed focus:outline-none focus:border-blue-500 transition-colors min-h-[100px] custom-scrollbar"
                                                placeholder="Versione italiana..."
                                            />
                                        </div>

                                        {/* Polaco */}
                                        <div>
                                            <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-3">
                                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" /> Polaco / Polski
                                            </label>
                                            <textarea
                                                value={editData.pl}
                                                onChange={(e) => setEditData({ ...editData, pl: e.target.value })}
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-sm text-sm font-light leading-relaxed focus:outline-none focus:border-blue-500 transition-colors min-h-[100px] custom-scrollbar"
                                                placeholder="Polska wersja..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #1e293b;
                }
            `}</style>
        </div>
    );
}

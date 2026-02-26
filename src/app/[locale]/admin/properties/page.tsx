'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { checkAuthAction } from '@/app/actions';
import { Link } from '@/i18n/routing';
import {
    getPropertiesSummaryAction,
    updatePropertyDescriptionsAction,
    updatePropertyFeaturesAction,
    type PropertySummaryRow,
} from '@/app/actions/properties-admin';
import {
    getDiscrepanciasAction,
    dismissDiscrepanciaAction,
    type Discrepancia,
} from '@/app/actions/discrepancias';
import {
    ArrowLeft,
    Search,
    Save,
    Pencil,
    X,
    Loader2,
    CheckCircle2,
    AlertCircle,
    AlertTriangle,
    Home,
    BedDouble,
    Bath,
    Maximize2,
} from 'lucide-react';
import { toast } from 'sonner';

const LANGS = [
    { key: 'description_es', label: 'ES', flag: '🇪🇸' },
    { key: 'description_en', label: 'EN', flag: '🇬🇧' },
    { key: 'description_fr', label: 'FR', flag: '🇫🇷' },
    { key: 'description_de', label: 'DE', flag: '🇩🇪' },
    { key: 'description_it', label: 'IT', flag: '🇮🇹' },
    { key: 'description_pl', label: 'PL', flag: '🇵🇱' },
] as const;

type LangKey = typeof LANGS[number]['key'];

export default function PropertiesAdminPage() {
    const router = useRouter();
    const [properties, setProperties] = useState<PropertySummaryRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<PropertySummaryRow | null>(null);
    const [editDesc, setEditDesc] = useState<Record<LangKey, string>>({} as Record<LangKey, string>);
    const [editFeatures, setEditFeatures] = useState({ superficie: 0, habitaciones: 0, habitaciones_simples: 0, habitaciones_dobles: 0, banos: 0 });
    const [savingDesc, setSavingDesc] = useState(false);
    const [savingFeat, setSavingFeat] = useState(false);
    const [activeLang, setActiveLang] = useState<LangKey>('description_es');

    // Discrepancies state
    const [discrepancias, setDiscrepancias] = useState<Record<string, Discrepancia[]>>({});
    const [discPopup, setDiscPopup] = useState<{ ref: string; diffs: Discrepancia[] } | null>(null);
    const [dismissing, setDismissing] = useState<string | null>(null);

    useEffect(() => {
        checkAuthAction().then(ok => {
            if (!ok) router.push('/admin/login');
        });
        load();
        loadDiscrepancias();
    }, [router]);

    async function load() {
        setLoading(true);
        const res = await getPropertiesSummaryAction();
        if (res.success && res.data) setProperties(res.data);
        setLoading(false);
    }

    async function loadDiscrepancias() {
        const res = await getDiscrepanciasAction();
        if (res.success && res.data) setDiscrepancias(res.data);
    }

    function normaliseRefLocal(ref: string) {
        return (ref || '').trim().replace(/\s+/g, '').toUpperCase();
    }

    function getDiscForRef(ref: string): Discrepancia[] {
        return discrepancias[normaliseRefLocal(ref)] || [];
    }

    async function handleDismiss(d: Discrepancia) {
        setDismissing(`${d.ref}|${d.campo}`);
        const res = await dismissDiscrepanciaAction(d);
        if (res.success) {
            // Remove from local state
            const normRef = normaliseRefLocal(d.ref);
            setDiscrepancias(prev => {
                const updated = { ...prev };
                const remaining = (updated[normRef] || []).filter(
                    x => !(x.campo === d.campo && x.valorEncargo === d.valorEncargo && x.valorWeb === d.valorWeb)
                );
                if (remaining.length === 0) delete updated[normRef];
                else updated[normRef] = remaining;
                return updated;
            });
            // Close popup if no more diffs for this ref
            setDiscPopup(prev => {
                if (!prev) return prev;
                const remaining = prev.diffs.filter(
                    x => !(x.campo === d.campo && x.valorEncargo === d.valorEncargo && x.valorWeb === d.valorWeb)
                );
                return remaining.length === 0 ? null : { ...prev, diffs: remaining };
            });
            toast.success(`Discrepancia "${d.campo}" descartada para ${d.ref}`);
        } else {
            toast.error('Error: ' + res.error);
        }
        setDismissing(null);
    }

    const filtered = useMemo(() => {
        if (!search.trim()) return properties;
        const q = search.toLowerCase();
        return properties.filter(p =>
            p.ref?.toLowerCase().includes(q) ||
            p.tipo?.toLowerCase().includes(q) ||
            p.poblacion?.toLowerCase().includes(q)
        );
    }, [properties, search]);

    function handleSelect(p: PropertySummaryRow) {
        setSelected(p);
        setEditDesc({
            description_es: p.description_es,
            description_en: p.description_en,
            description_fr: p.description_fr,
            description_de: p.description_de,
            description_it: p.description_it,
            description_pl: p.description_pl,
        });
        setEditFeatures({
            superficie: p.superficie ?? 0,
            habitaciones: p.habitaciones ?? 0,
            habitaciones_simples: p.habitaciones_simples ?? 0,
            habitaciones_dobles: p.habitaciones_dobles ?? 0,
            banos: p.banos ?? 0,
        });
        setActiveLang('description_es');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function handleSaveDesc() {
        if (!selected) return;
        setSavingDesc(true);
        const res = await updatePropertyDescriptionsAction(selected.cod_ofer, editDesc);
        if (res.success) {
            toast.success('Textos guardados');
            // update local state
            setProperties(prev => prev.map(p => p.cod_ofer === selected.cod_ofer ? { ...p, ...editDesc } : p));
            setSelected(prev => prev ? { ...prev, ...editDesc } : prev);
        } else {
            toast.error('Error: ' + res.error);
        }
        setSavingDesc(false);
    }

    async function handleSaveFeat() {
        if (!selected) return;
        setSavingFeat(true);
        const res = await updatePropertyFeaturesAction(selected.cod_ofer, editFeatures);
        if (res.success) {
            toast.success('Características guardadas');
            setProperties(prev => prev.map(p => p.cod_ofer === selected.cod_ofer ? { ...p, ...editFeatures } : p));
            setSelected(prev => prev ? { ...prev, ...editFeatures } : prev);
        } else {
            toast.error('Error: ' + res.error);
        }
        setSavingFeat(false);
    }

    function descCoverage(p: PropertySummaryRow) {
        return LANGS.filter(l => p[l.key]?.trim()).length;
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0a192f]">
                <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a192f] text-white">
            <div className="max-w-7xl mx-auto px-6 pt-28 pb-20">

                {/* Header */}
                <header className="mb-10 flex items-start justify-between">
                    <div>
                        <Link href="/admin" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-white/40 hover:text-white mb-4 transition-colors">
                            <ArrowLeft size={14} /> Panel de Control
                        </Link>
                        <h1 className="text-4xl font-serif">
                            Propiedades <span className="italic text-slate-400 font-normal">({properties.length})</span>
                        </h1>
                        <p className="text-white/40 text-sm mt-1">Visualiza y edita textos y características de cada anuncio.</p>
                        {Object.keys(discrepancias).length > 0 && (
                            <div className="mt-3 inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-sm">
                                <AlertTriangle size={14} className="text-amber-400" />
                                <span className="text-amber-300 text-xs font-medium">
                                    {Object.keys(discrepancias).length} propiedad{Object.keys(discrepancias).length > 1 ? 'es' : ''} con discrepancias vs encargos
                                </span>
                            </div>
                        )}
                    </div>
                </header>

                {/* Edit panel */}
                {selected && (
                    <div className="mb-10 bg-white/5 border border-white/10 rounded-sm p-6">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <span className="text-xs uppercase tracking-widest text-teal-400">{selected.ref}</span>
                                <h2 className="text-xl font-serif mt-1">{selected.tipo} · {selected.poblacion}</h2>
                                <p className="text-white/40 text-sm mt-0.5">{selected.precio ? selected.precio.toLocaleString('es-ES') + ' €' : '—'}</p>
                            </div>
                            <button onClick={() => setSelected(null)} className="text-white/40 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Features */}
                        <div className="mb-8">
                            <h3 className="text-[10px] uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                                <Home size={12} /> Características físicas
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                {[
                                    { key: 'superficie', label: 'Superficie (m²)', icon: <Maximize2 size={14} /> },
                                    { key: 'habitaciones', label: 'Hab. total', icon: <BedDouble size={14} /> },
                                    { key: 'habitaciones_simples', label: 'Hab. simples', icon: <BedDouble size={14} /> },
                                    { key: 'habitaciones_dobles', label: 'Hab. dobles', icon: <BedDouble size={14} /> },
                                    { key: 'banos', label: 'Baños', icon: <Bath size={14} /> },
                                ].map(({ key, label, icon }) => (
                                    <label key={key} className="block">
                                        <span className="text-[10px] uppercase tracking-widest text-white/40 flex items-center gap-1 mb-1">{icon} {label}</span>
                                        <input
                                            type="number"
                                            min={0}
                                            value={(editFeatures as any)[key]}
                                            onChange={e => setEditFeatures(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                                            className="w-full bg-white/10 border border-white/10 text-white px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-teal-400"
                                        />
                                    </label>
                                ))}
                            </div>
                            <button
                                onClick={handleSaveFeat}
                                disabled={savingFeat}
                                className="mt-4 inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
                            >
                                {savingFeat ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                Guardar características
                            </button>
                        </div>

                        {/* Descriptions */}
                        <div>
                            <h3 className="text-[10px] uppercase tracking-widest text-white/40 mb-4">Textos por idioma</h3>

                            {/* Lang tabs */}
                            <div className="flex gap-1 mb-4 flex-wrap">
                                {LANGS.map(l => {
                                    const filled = editDesc[l.key]?.trim().length > 0;
                                    return (
                                        <button
                                            key={l.key}
                                            onClick={() => setActiveLang(l.key)}
                                            className={`px-3 py-1.5 text-xs uppercase tracking-widest transition-colors flex items-center gap-1.5 ${activeLang === l.key
                                                    ? 'bg-teal-500 text-white'
                                                    : 'bg-white/10 text-white/60 hover:text-white'
                                                }`}
                                        >
                                            {filled
                                                ? <CheckCircle2 size={10} className="text-emerald-400" />
                                                : <AlertCircle size={10} className="text-orange-400" />
                                            }
                                            {l.flag} {l.label}
                                        </button>
                                    );
                                })}
                            </div>

                            <textarea
                                value={editDesc[activeLang]}
                                onChange={e => setEditDesc(prev => ({ ...prev, [activeLang]: e.target.value }))}
                                rows={6}
                                className="w-full bg-white/10 border border-white/10 text-white px-4 py-3 text-sm rounded-sm resize-y focus:outline-none focus:border-teal-400 font-light leading-relaxed"
                                placeholder={`Descripción en ${LANGS.find(l => l.key === activeLang)?.label}...`}
                            />

                            <button
                                onClick={handleSaveDesc}
                                disabled={savingDesc}
                                className="mt-3 inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-5 py-2.5 text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
                            >
                                {savingDesc ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                Guardar todos los textos
                            </button>
                        </div>
                    </div>
                )}

                {/* Discrepancy Popup */}
                {discPopup && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDiscPopup(null)}>
                        <div className="bg-[#0f2744] border border-amber-500/30 rounded-sm p-6 max-w-lg w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                            <div className="flex items-start justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
                                        <AlertTriangle size={20} className="text-amber-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-serif text-white">Discrepancias</h3>
                                        <p className="text-xs text-white/40">Ref. {discPopup.ref} — Encargos vs Web</p>
                                    </div>
                                </div>
                                <button onClick={() => setDiscPopup(null)} className="text-white/40 hover:text-white transition-colors">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="space-y-3">
                                {discPopup.diffs.map((d, i) => (
                                    <div key={i} className="bg-white/5 border border-white/10 rounded-sm p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <span className="text-[10px] uppercase tracking-widest text-amber-400 font-semibold">{d.campo}</span>
                                                <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                                                    <div>
                                                        <span className="text-[10px] uppercase tracking-widest text-white/30 block mb-0.5">Encargo</span>
                                                        <span className="text-white font-mono">{d.campo === 'precio' ? Number(d.valorEncargo).toLocaleString('es-ES') + ' €' : d.valorEncargo}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] uppercase tracking-widest text-white/30 block mb-0.5">Web</span>
                                                        <span className="text-white font-mono">{d.campo === 'precio' ? Number(d.valorWeb).toLocaleString('es-ES') + ' €' : d.valorWeb}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDismiss(d)}
                                                disabled={dismissing === `${d.ref}|${d.campo}`}
                                                className="shrink-0 mt-4 inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white/60 hover:text-white px-3 py-1.5 text-[10px] uppercase tracking-widest transition-colors disabled:opacity-50 rounded-sm"
                                                title="Descartar — no volver a notificar para estos valores"
                                            >
                                                {dismissing === `${d.ref}|${d.campo}`
                                                    ? <Loader2 size={12} className="animate-spin" />
                                                    : <X size={12} />
                                                }
                                                Descartar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <p className="text-[10px] text-white/30 mt-4 leading-relaxed">
                                Al descartar, esta diferencia no volverá a mostrarse salvo que los valores cambien.
                            </p>
                        </div>
                    </div>
                )}

                {/* Search */}
                <div className="relative mb-6">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                        type="text"
                        placeholder="Buscar por referencia, tipo o población..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 text-white pl-11 pr-4 py-3 text-sm rounded-sm focus:outline-none focus:border-teal-400 placeholder-white/20"
                    />
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/10 text-left">
                                {['Ref', 'Tipo', 'Precio', 'Población', 'Sup. m²', 'Hab.S', 'Hab.D', 'Baños', 'Textos', '', ''].map((h, i) => (
                                    <th key={`${h}-${i}`} className="pb-3 pr-4 text-[10px] uppercase tracking-widest text-white/30 font-normal whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(p => (
                                <tr
                                    key={p.cod_ofer}
                                    className={`border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${selected?.cod_ofer === p.cod_ofer ? 'bg-teal-900/20' : ''}`}
                                    onClick={() => handleSelect(p)}
                                >
                                    <td className="py-3 pr-4 font-mono text-teal-400 whitespace-nowrap">{p.ref}</td>
                                    <td className="py-3 pr-4 text-white/70 whitespace-nowrap">{p.tipo || '—'}</td>
                                    <td className="py-3 pr-4 text-white/70 whitespace-nowrap tabular-nums">{p.precio ? p.precio.toLocaleString('es-ES') + ' €' : '—'}</td>
                                    <td className="py-3 pr-4 text-white/70 whitespace-nowrap">{p.poblacion}</td>
                                    <td className="py-3 pr-4 text-white/50">{p.superficie ?? '—'}</td>
                                    <td className="py-3 pr-4 text-white/50">{p.habitaciones_simples ?? '—'}</td>
                                    <td className="py-3 pr-4 text-white/50">{p.habitaciones_dobles ?? '—'}</td>
                                    <td className="py-3 pr-4 text-white/50">{p.banos ?? '—'}</td>
                                    <td className="py-3 pr-4">
                                        <div className="flex gap-0.5">
                                            {LANGS.map(l => (
                                                <span
                                                    key={l.key}
                                                    title={l.label}
                                                    className={`w-2 h-2 rounded-full ${p[l.key]?.trim() ? 'bg-emerald-400' : 'bg-white/15'}`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-[10px] text-white/30 mt-0.5 block">{descCoverage(p)}/6</span>
                                    </td>
                                    <td className="py-3 text-right">
                                        {getDiscForRef(p.ref).length > 0 && (
                                            <button
                                                className="text-amber-400 hover:text-amber-300 transition-colors mr-2"
                                                title={`${getDiscForRef(p.ref).length} discrepancia(s) con encargos`}
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    setDiscPopup({ ref: p.ref, diffs: getDiscForRef(p.ref) });
                                                }}
                                            >
                                                <AlertTriangle size={16} />
                                            </button>
                                        )}
                                    </td>
                                    <td className="py-3 text-right">
                                        <button className="text-white/30 hover:text-teal-400 transition-colors">
                                            <Pencil size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filtered.length === 0 && (
                        <p className="text-center text-white/30 py-12">No se encontraron propiedades.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

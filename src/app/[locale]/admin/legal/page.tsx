'use client';

import React, { useEffect, useState } from 'react';
import { getAllLegalPagesAction, saveLegalPageAction, LegalPage } from '@/app/actions/legal';
import { toast } from 'sonner';
import { Save, Loader2, FileText, Globe, CheckCircle2 } from 'lucide-react';

export default function AdminLegalPage() {
    const [pages, setPages] = useState<LegalPage[]>([]);
    const [selectedSlug, setSelectedSlug] = useState<string>('privacy');
    const [editingPage, setEditingPage] = useState<LegalPage | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeLang, setActiveLang] = useState<'es' | 'en' | 'fr' | 'de' | 'it' | 'pl'>('es');

    const locales: ('es' | 'en' | 'fr' | 'de' | 'it' | 'pl')[] = ['es', 'en', 'fr', 'de', 'it', 'pl'];

    useEffect(() => {
        loadPages();
    }, []);

    const loadPages = async () => {
        setLoading(true);
        const data = await getAllLegalPagesAction();
        setPages(data);
        const initial = data.find(p => p.slug === selectedSlug) || data[0] || null;
        setEditingPage(initial ? { ...initial } : null);
        setLoading(false);
    };

    const handlePageSelect = (slug: string) => {
        setSelectedSlug(slug);
        const page = pages.find(p => p.slug === slug);
        setEditingPage(page ? { ...page } : null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPage) return;

        setSaving(true);
        const res = await saveLegalPageAction(editingPage);
        if (res.success) {
            toast.success('Página legal actualizada correctamente');
            // Update local state
            setPages(prev => prev.map(p => p.slug === editingPage.slug ? { ...editingPage } : p));
        } else {
            toast.error('Error al guardar: ' + res.error);
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl p-8">
            <header className="mb-12">
                <h1 className="font-serif text-4xl text-slate-900 border-b pb-4">Contenidos Legales</h1>
                <p className="mt-2 text-slate-500">Gestiona los textos de privacidad, cookies y aviso legal en todos los idiomas.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar - Page Selection */}
                <div className="lg:col-span-1 space-y-2">
                    {['privacy', 'cookies', 'legal'].map((slug) => (
                        <button
                            key={slug}
                            onClick={() => handlePageSelect(slug)}
                            className={`w-full text-left px-6 py-4 rounded-sm transition-all flex items-center justify-between group ${
                                selectedSlug === slug 
                                ? 'bg-teal-600 text-white shadow-lg' 
                                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
                            }`}
                        >
                            <span className="text-xs uppercase tracking-widest font-bold">
                                {slug === 'privacy' ? 'Privacidad' : slug === 'cookies' ? 'Cookies' : 'Aviso Legal'}
                            </span>
                            <FileText size={16} className={selectedSlug === slug ? 'text-white' : 'text-slate-300 group-hover:text-teal-500'} />
                        </button>
                    ))}
                </div>

                {/* Content Editor */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white p-8 rounded-sm shadow-sm border border-slate-100">
                        {/* Language Selector */}
                        <div className="flex flex-wrap gap-2 mb-8 border-b border-slate-50 pb-6">
                            {locales.map((lang) => (
                                <button
                                    key={lang}
                                    onClick={() => setActiveLang(lang)}
                                    className={`px-4 py-2 text-[10px] uppercase tracking-widest font-bold rounded-sm transition-all flex items-center gap-2 ${
                                        activeLang === lang 
                                        ? 'bg-[#0a192f] text-white' 
                                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-100'
                                    }`}
                                >
                                    <Globe size={12} className={activeLang === lang ? 'text-teal-400' : 'text-slate-300'} />
                                    {lang}
                                </button>
                            ))}
                        </div>

                        {editingPage ? (
                            <form onSubmit={handleSave} className="space-y-6">
                                <div>
                                    <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">
                                        Título ({activeLang.toUpperCase()})
                                    </label>
                                    <input
                                        type="text"
                                        value={(editingPage as any)[`title_${activeLang}`] || ''}
                                        onChange={e => setEditingPage(prev => prev ? ({ ...prev, [`title_${activeLang}`]: e.target.value }) : null)}
                                        className="w-full bg-slate-50 border-none px-4 py-3 rounded-sm focus:ring-1 focus:ring-teal-500 transition-all font-serif text-xl"
                                        placeholder="Ej: Política de Privacidad"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">
                                        Contenido HTML ({activeLang.toUpperCase()})
                                    </label>
                                    <textarea
                                        rows={15}
                                        value={(editingPage as any)[`content_${activeLang}`] || ''}
                                        onChange={e => setEditingPage(prev => prev ? ({ ...prev, [`content_${activeLang}`]: e.target.value }) : null)}
                                        className="w-full bg-slate-50 border-none px-4 py-3 rounded-sm focus:ring-1 focus:ring-teal-500 transition-all font-mono text-xs leading-relaxed"
                                        placeholder="<p>Escribe aquí el contenido legal...</p>"
                                    />
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="bg-[#0a192f] text-white px-10 py-4 flex items-center gap-3 hover:bg-teal-600 transition-all rounded-sm shadow-xl disabled:opacity-50"
                                    >
                                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                        <span className="text-[10px] uppercase tracking-widest font-bold">Guardar Cambios</span>
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="p-20 text-center text-slate-400 font-serif italic">
                                Selecciona una página para editar
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

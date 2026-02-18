'use client';

import React, { useEffect, useState } from 'react';
import {
    getHeroSlidesAction,
    saveHeroSlideAction,
    deleteHeroSlideAction,
    uploadMediaAction,
    logoutAction,
    HeroSlide
} from '../../actions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2, Plus, Upload, MoveUp, MoveDown, Play, Image as ImageIcon } from 'lucide-react';

export default function HeroAdmin() {
    const [slides, setSlides] = useState<HeroSlide[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const [editingSlide, setEditingSlide] = useState<Partial<HeroSlide> | null>(null);
    const router = useRouter();

    useEffect(() => {
        loadSlides();
    }, []);

    const loadSlides = async () => {
        setLoading(true);
        const data = await getHeroSlidesAction();
        setSlides(data);
        setLoading(false);
    };

    const handleLogout = async () => {
        await logoutAction();
        router.push('/admin/login');
    };

    const handleSaveSlide = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSlide) return;

        setSaving(true);
        const result = await saveHeroSlideAction(editingSlide);
        if (result.success) {
            setMessage('Diapositiva guardada');
            setEditingSlide(null);
            loadSlides();
            setTimeout(() => setMessage(''), 3000);
        } else {
            setMessage('Error: ' + result.error);
        }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Seguro que quieres eliminar esta diapositiva?')) return;
        const result = await deleteHeroSlideAction(id);
        if (result.success) {
            loadSlides();
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'url' | 'poster') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        const result = await uploadMediaAction(formData);
        if (result.success && result.url) {
            setEditingSlide(prev => ({ ...prev, [field]: result.url }));
        } else {
            alert('Error al subir: ' + result.error);
        }
        setUploading(false);
    };

    const moveSlide = async (index: number, direction: 'up' | 'down') => {
        const newSlides = [...slides];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newSlides.length) return;

        // Swap
        const temp = newSlides[index];
        newSlides[index] = newSlides[targetIndex];
        newSlides[targetIndex] = temp;

        // Update order_index
        const updates = newSlides.map((s, i) => ({ ...s, order_index: i }));
        setSlides(updates);

        // Save all (simpler for this case)
        for (const s of updates) {
            await saveHeroSlideAction(s);
        }
    };

    if (loading) return <div className="p-20 text-center font-serif italic">Cargando gestión de banner...</div>;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-32 pb-20 px-8">
            <div className="max-w-6xl mx-auto">
                <header className="mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                    <div>
                        <span className="text-[10px] tracking-[0.4em] uppercase text-slate-400 mb-4 block">Administración</span>
                        <h1 className="text-4xl md:text-5xl font-serif text-[#0a192f] dark:text-white">Banner <span className="italic text-slate-400">Principal</span></h1>
                        <p className="mt-4 text-slate-500 font-light">Gestiona los vídeos y textos que aparecen al entrar en la web.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {message && <span className="text-sm text-teal-600 dark:text-teal-400 animate-pulse">{message}</span>}
                        <button
                            onClick={() => setEditingSlide({ type: 'video', order_index: slides.length })}
                            className="flex items-center gap-2 px-8 py-4 bg-[#0a192f] text-white text-[10px] uppercase tracking-widest font-bold hover:bg-[#1e3a8a] transition-all rounded-sm"
                        >
                            <Plus size={14} /> Nueva Diapositiva
                        </button>
                    </div>
                </header>

                {/* Lista de Slides */}
                <div className="grid grid-cols-1 gap-6 mb-12">
                    {slides.length === 0 && !editingSlide && (
                        <div className="p-20 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-sm">
                            <p className="text-slate-400 italic">No hay diapositivas configuradas. La web usará las de defecto.</p>
                        </div>
                    )}

                    {slides.map((slide, index) => (
                        <div key={slide.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-sm flex flex-col md:flex-row items-center gap-8 group">
                            <div className="relative w-48 aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                                {slide.type === 'video' ? (
                                    <video src={slide.url} className="w-full h-full object-cover" muted />
                                ) : (
                                    <img src={slide.url} className="w-full h-full object-cover" />
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button onClick={() => setEditingSlide(slide)} className="p-2 bg-white text-slate-900 rounded-full hover:bg-teal-500 hover:text-white transition-all"><Plus size={16} /></button>
                                </div>
                            </div>

                            <div className="flex-grow">
                                <h3 className="font-serif text-xl mb-1">{slide.title}</h3>
                                <p className="text-sm text-slate-400 font-light">{slide.subtitle}</p>
                                <div className="mt-4 flex gap-4 text-[10px] uppercase tracking-widest font-bold text-slate-300">
                                    <span>{slide.type === 'video' ? 'VÍDEO' : 'IMAGEN'}</span>
                                    <span>•</span>
                                    <span>ORDEN: {slide.order_index + 1}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button onClick={() => moveSlide(index, 'up')} disabled={index === 0} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-20"><MoveUp size={18} /></button>
                                <button onClick={() => moveSlide(index, 'down')} disabled={index === slides.length - 1} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-20"><MoveDown size={18} /></button>
                                <div className="w-px h-8 bg-slate-100 dark:bg-slate-800 mx-2" />
                                <button onClick={() => setEditingSlide(slide)} className="px-4 py-2 text-[10px] uppercase font-bold text-slate-400 hover:text-[#0a192f] dark:hover:text-white">Editar</button>
                                <button onClick={() => handleDelete(slide.id)} className="p-2 text-red-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Modal / Form de Edición */}
                {editingSlide && (
                    <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-8">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-sm shadow-2xl overflow-hidden animate-fade-up">
                            <form onSubmit={handleSaveSlide}>
                                <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
                                    <h2 className="font-serif text-2xl">{editingSlide.id ? 'Editar' : 'Nueva'} Diapositiva</h2>
                                    <button type="button" onClick={() => setEditingSlide(null)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">&times;</button>
                                </div>

                                <div className="p-8 space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase tracking-widest text-slate-400">Título Principal</label>
                                            <input
                                                value={editingSlide.title || ''}
                                                onChange={e => setEditingSlide(prev => ({ ...prev, title: e.target.value }))}
                                                required
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-none px-4 py-3 text-sm focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                                                placeholder="Ej: Hogares excepcionales..."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase tracking-widest text-slate-400">Tipo de Contenido</label>
                                            <select
                                                value={editingSlide.type}
                                                onChange={e => setEditingSlide(prev => ({ ...prev, type: e.target.value as any }))}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-none px-4 py-3 text-sm focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                                            >
                                                <option value="video">Vídeo (.mp4)</option>
                                                <option value="image">Imagen (.jpg, .png)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest text-slate-400">Subtítulo / Mensaje</label>
                                        <textarea
                                            value={editingSlide.subtitle || ''}
                                            onChange={e => setEditingSlide(prev => ({ ...prev, subtitle: e.target.value }))}
                                            rows={2}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none px-4 py-3 text-sm focus:ring-1 focus:ring-teal-500 outline-none transition-all resize-none"
                                            placeholder="Tu confianza, nuestra prioridad..."
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] uppercase tracking-widest text-slate-400">Archivo de Media (Vídeo o Imagen)</label>
                                        <div className="flex gap-4">
                                            <input
                                                value={editingSlide.url || ''}
                                                onChange={e => setEditingSlide(prev => ({ ...prev, url: e.target.value }))}
                                                className="flex-grow bg-slate-50 dark:bg-slate-800 border-none px-4 py-3 text-xs font-mono focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                                                placeholder="https://..."
                                            />
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    onChange={e => handleFileUpload(e, 'url')}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                    accept={editingSlide.type === 'video' ? 'video/mp4' : 'image/*'}
                                                />
                                                <button type="button" className="h-full px-6 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 text-[10px] uppercase font-bold flex items-center gap-2 hover:bg-slate-200 transition-all rounded-sm">
                                                    {uploading ? 'Subiendo...' : editingSlide.type === 'video' ? <><Play size={14} /> Vídeo</> : <><ImageIcon size={14} /> Foto</>}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {editingSlide.type === 'video' && (
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase tracking-widest text-slate-400">Imagen de Pre-carga (Poster)</label>
                                            <div className="flex gap-4">
                                                <input
                                                    value={editingSlide.poster || ''}
                                                    onChange={e => setEditingSlide(prev => ({ ...prev, poster: e.target.value }))}
                                                    className="flex-grow bg-slate-50 dark:bg-slate-800 border-none px-4 py-3 text-xs font-mono focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                                                    placeholder="URL de imagen..."
                                                />
                                                <div className="relative">
                                                    <input
                                                        type="file"
                                                        onChange={e => handleFileUpload(e, 'poster')}
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                        accept="image/*"
                                                    />
                                                    <button type="button" className="h-full px-6 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 text-[10px] uppercase font-bold flex items-center gap-2 hover:bg-slate-200 transition-all rounded-sm">
                                                        <ImageIcon size={14} /> Poster
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-8 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setEditingSlide(null)}
                                        className="px-8 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400 hover:text-slate-900 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving || uploading}
                                        className="px-10 py-4 bg-[#0a192f] text-white text-[10px] uppercase tracking-widest font-bold hover:bg-[#1e3a8a] transition-all rounded-sm disabled:opacity-50"
                                    >
                                        {saving ? 'Guardando...' : 'Confirmar Cambios'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <div className="mt-12 flex justify-center">
                    <Link
                        href="/admin"
                        className="text-[11px] tracking-widest uppercase text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        Volver al Menú Principal
                    </Link>
                    <span className="mx-4 text-slate-200">|</span>
                    <button
                        onClick={handleLogout}
                        className="text-[11px] tracking-widest uppercase text-red-400 hover:text-red-600 transition-colors"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        </div>
    );
}

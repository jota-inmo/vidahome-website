'use client';

import React, { useEffect, useState } from 'react';
import {
    getHeroSlidesAction,
    saveHeroSlideAction,
    deleteHeroSlideAction,
    uploadMediaAction,
    logoutAction,
    HeroSlide
} from '../actions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2, Plus, Upload, MoveUp, MoveDown, Play, Image as ImageIcon, ExternalLink, Eye, CheckCircle2, Circle } from 'lucide-react';

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
        // Ensure defaults
        const payload = {
            ...editingSlide,
            active: editingSlide.active ?? true,
            order: editingSlide.order ?? slides.length,
            type: editingSlide.type ?? 'video'
        };

        const result = await saveHeroSlideAction(payload);
        if (result.success) {
            setMessage('Diapositiva sincronizada correctamente');
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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'video_path' | 'poster') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        const result = await uploadMediaAction(formData);
        if (result.success && result.path) {
            setEditingSlide(prev => ({ ...prev, [field]: result.path }));
        } else {
            alert('Error al subir: ' + result.error);
        }
        setUploading(false);
    };

    const toggleActive = async (slide: HeroSlide) => {
        await saveHeroSlideAction({ ...slide, active: !slide.active });
        loadSlides();
    };

    const moveSlide = async (index: number, direction: 'up' | 'down') => {
        const newSlides = [...slides];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newSlides.length) return;

        const temp = newSlides[index];
        newSlides[index] = newSlides[targetIndex];
        newSlides[targetIndex] = temp;

        const updates = newSlides.map((s, i) => ({ ...s, order: i }));
        setSlides(updates);

        for (const s of updates) {
            await saveHeroSlideAction(s);
        }
        loadSlides();
    };

    const getRealUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http') || path.startsWith('/')) return path;
        return `https://${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1] || ''}/storage/v1/object/public/videos/${path}`;
    };

    // Better fallback for URL if env is not perfect
    const getStorageUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http') || path.startsWith('/')) return path;
        // Using the public project structure
        const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('.')[0].split('//')[1];
        return `https://${projectRef}.supabase.co/storage/v1/object/public/videos/${path}`;
    };

    if (loading) return <div className="p-20 text-center font-serif italic text-slate-400">Cargando gestor de vídeos...</div>;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-32 pb-20 px-8">
            <div className="max-w-6xl mx-auto">
                <header className="mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                    <div>
                        <span className="text-[10px] tracking-[0.4em] uppercase text-teal-500 mb-4 block font-bold">Vidahome Hero Engine</span>
                        <h1 className="text-4xl md:text-5xl font-serif text-[#0a192f] dark:text-white leading-tight">Gestión de <span className="italic text-slate-400">Vídeos Hero</span></h1>
                        <p className="mt-4 text-slate-500 font-light max-w-xl">Configura los vídeos, enlaces y el orden de aparición del banner principal.</p>
                    </div>
                    <div className="flex items-center gap-6">
                        {message && <span className="text-sm text-teal-600 dark:text-teal-400 font-medium">{message}</span>}
                        <button
                            onClick={() => setEditingSlide({ type: 'video', order: slides.length, active: true })}
                            className="flex items-center gap-2 px-8 py-5 bg-[#0a192f] text-white text-[10px] uppercase tracking-widest font-bold hover:bg-teal-600 transition-all rounded-sm shadow-xl"
                        >
                            <Plus size={14} /> Añadir Vídeo
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 gap-6 mb-12">
                    {slides.length === 0 && !editingSlide && (
                        <div className="p-24 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-sm">
                            <Play size={40} className="mx-auto text-slate-200 mb-6" />
                            <p className="text-slate-400 italic">No hay vídeos activos. Pulsa "Añadir Vídeo" para empezar.</p>
                        </div>
                    )}

                    {slides.map((slide, index) => (
                        <div key={slide.id} className={`bg-white dark:bg-slate-900 border ${slide.active ? 'border-slate-100 dark:border-slate-800' : 'border-red-100 dark:border-red-900/30 grayscale opacity-60'} p-6 rounded-sm flex flex-col md:flex-row items-center gap-8 group transition-all hover:border-teal-500/30 shadow-sm`}>
                            <div className="relative w-72 aspect-video bg-black overflow-hidden rounded-sm ring-1 ring-black/5 shadow-inner">
                                {slide.video_path ? (
                                    <video
                                        src={getStorageUrl(slide.video_path)}
                                        className="w-full h-full object-cover"
                                        muted
                                        onMouseOver={e => e.currentTarget.play()}
                                        onMouseOut={e => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <ImageIcon size={32} className="text-slate-200" />
                                    </div>
                                )}
                                <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 text-[8px] text-white/80 font-mono rounded-xs backdrop-blur-sm">
                                    {slide.video_path?.split('/').pop()}
                                </div>
                            </div>

                            <div className="flex-grow">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-serif text-xl">{slide.title || 'Sin Título'}</h3>
                                    <button
                                        onClick={() => toggleActive(slide)}
                                        className={`p-1 rounded-full transition-colors ${slide.active ? 'text-teal-500' : 'text-slate-300'}`}
                                    >
                                        {slide.active ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                                    </button>
                                </div>

                                {slide.link_url && (
                                    <div className="flex items-center gap-2 text-[10px] text-teal-400 font-mono mb-4 bg-teal-400/5 px-2 py-1 rounded-xs inline-block">
                                        <ExternalLink size={10} /> {slide.link_url}
                                    </div>
                                )}

                                <div className="flex gap-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">
                                    <span className="flex items-center gap-1"><Play size={10} /> {slide.type}</span>
                                    <span>•</span>
                                    <span className="text-teal-500/70">Posición: {slide.order + 1}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex flex-col gap-1 mr-4">
                                    <button onClick={() => moveSlide(index, 'up')} disabled={index === 0} className="p-1.5 text-slate-400 hover:text-teal-500 disabled:opacity-10 transition-colors"><MoveUp size={16} /></button>
                                    <button onClick={() => moveSlide(index, 'down')} disabled={index === slides.length - 1} className="p-1.5 text-slate-400 hover:text-teal-500 disabled:opacity-10 transition-colors"><MoveDown size={16} /></button>
                                </div>
                                <button onClick={() => setEditingSlide(slide)} className="px-6 py-3 border border-slate-100 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-all rounded-sm shadow-sm active:scale-95">Editar</button>
                                <button onClick={() => handleDelete(slide.id)} className="p-3 text-red-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                            </div>
                        </div>
                    ))}
                </div>

                {editingSlide && (
                    <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-8">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-sm shadow-2xl overflow-hidden animate-fade-up border border-white/5">
                            <form onSubmit={handleSaveSlide}>
                                <div className="p-10 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
                                    <div>
                                        <h2 className="font-serif text-3xl mb-1">{editingSlide.id ? 'Refinar' : 'Nuevo'} Vídeo Hero</h2>
                                        <p className="text-xs text-slate-400 uppercase tracking-widest">Configuración de diapositiva {editingSlide.order !== undefined ? `nº ${editingSlide.order + 1}` : ''}</p>
                                    </div>
                                    <button type="button" onClick={() => setEditingSlide(null)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all text-2xl">&times;</button>
                                </div>

                                <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Título del Slide</label>
                                            <input
                                                value={editingSlide.title || ''}
                                                onChange={e => setEditingSlide(prev => ({ ...prev, title: e.target.value }))}
                                                required
                                                className="w-full bg-slate-50 dark:bg-slate-800/50 border-none px-5 py-4 text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all rounded-sm text-[#0a192f] dark:text-white"
                                                placeholder="Ej: Calidad de Vida en Gandia"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Enlace de Destino (Link URL)</label>
                                            <input
                                                value={editingSlide.link_url || ''}
                                                onChange={e => setEditingSlide(prev => ({ ...prev, link_url: e.target.value }))}
                                                className="w-full bg-slate-50 dark:bg-slate-800/50 border-none px-5 py-4 text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all rounded-sm text-teal-500 font-mono"
                                                placeholder="Ej: 13031 (ID Propiedad) o /propiedades"
                                            />
                                            <p className="text-[9px] text-slate-400 italic">Vacio = Catálogo | Solo número = Ficha Propiedad</p>
                                        </div>

                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Archivo de Vídeo (Storage Path)</label>
                                            <div className="flex gap-2">
                                                <input
                                                    value={editingSlide.video_path || ''}
                                                    onChange={e => setEditingSlide(prev => ({ ...prev, video_path: e.target.value }))}
                                                    className="flex-grow bg-slate-50 dark:bg-slate-800/50 border-none px-5 py-4 text-[10px] font-mono focus:ring-2 focus:ring-teal-500 outline-none transition-all rounded-sm text-[#0a192f] dark:text-white"
                                                    placeholder="hero/mi-video.mp4"
                                                />
                                                <div className="relative">
                                                    <input
                                                        type="file"
                                                        onChange={e => handleFileUpload(e, 'video_path')}
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                        accept="video/mp4"
                                                    />
                                                    <button type="button" className="h-full px-6 bg-teal-500 text-white text-[10px] uppercase font-bold flex items-center gap-2 hover:bg-teal-600 transition-all rounded-sm">
                                                        {uploading ? '...' : <Upload size={14} />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-end pb-4 gap-12">
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    id="active"
                                                    checked={editingSlide.active ?? true}
                                                    onChange={e => setEditingSlide(prev => ({ ...prev, active: e.target.checked }))}
                                                    className="w-4 h-4 accent-teal-500 cursor-pointer"
                                                />
                                                <label htmlFor="active" className="text-[10px] uppercase tracking-widest text-slate-500 font-bold cursor-pointer">Estado Activo</label>
                                            </div>
                                            <div className="space-y-3 flex-grow max-w-[100px]">
                                                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block">Orden</label>
                                                <input
                                                    type="number"
                                                    value={editingSlide.order ?? 0}
                                                    onChange={e => setEditingSlide(prev => ({ ...prev, order: parseInt(e.target.value) }))}
                                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border-none px-4 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all rounded-sm text-[#0a192f] dark:text-white"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-sm border border-slate-200 dark:border-slate-800">
                                        <div className="flex items-center gap-6">
                                            <div className="w-32 aspect-video bg-black rounded-sm overflow-hidden flex-shrink-0 shadow-lg">
                                                {editingSlide.video_path ? (
                                                    <video src={getStorageUrl(editingSlide.video_path)} className="w-full h-full object-cover" autoPlay muted loop />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-700">
                                                        <Play size={20} />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-serif italic mb-1 text-[#0a192f] dark:text-white">Vista Previa del Media</h4>
                                                <p className="text-[10px] text-slate-400 font-light max-w-xs">Si los cambios no aparecen, verifica que el archivo exista en el bucket 'videos' de Supabase.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-10 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-6">
                                    <button
                                        type="button"
                                        onClick={() => setEditingSlide(null)}
                                        className="px-8 py-5 text-[10px] uppercase tracking-widest font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
                                    >
                                        Descartar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving || uploading}
                                        className="px-12 py-5 bg-[#0a192f] text-white text-[10px] uppercase tracking-widest font-bold hover:bg-teal-600 transition-all rounded-sm shadow-xl disabled:opacity-50 flex items-center gap-3"
                                    >
                                        {saving ? 'Guardando...' : <><CheckCircle2 size={14} /> Guardar Cambios</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}


                <div className="mt-24 flex flex-col items-center gap-8 border-t border-slate-200 dark:border-white/5 pt-12">
                    <div className="flex gap-12 text-[10px] tracking-widest uppercase font-bold text-slate-400">
                        <Link href="/admin" className="hover:text-teal-500 transition-colors">Menú Ecosistema</Link>
                        <Link href="/" className="hover:text-teal-500 transition-colors">Previsualizar Web</Link>
                        <button onClick={handleLogout} className="text-red-400/60 hover:text-red-400 transition-colors uppercase">Salir de Gestión</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

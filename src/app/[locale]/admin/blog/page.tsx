'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { BlogPost, BlogCategory } from '@/types/blog';
import { Upload, X, Loader, AlertCircle, CheckCircle, Globe } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const LOCALES = [
    { id: 'es', label: 'Español' },
    { id: 'en', label: 'English' },
    { id: 'fr', label: 'Français' },
    { id: 'de', label: 'Deutsch' },
    { id: 'it', label: 'Italiano' },
    { id: 'pl', label: 'Polski' }
];

type TranslationStatus = 'idle' | 'translating' | 'success' | 'error';

export default function BlogAdminPage() {
    const locale = useLocale();
    const t = useTranslations();

    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [categories, setCategories] = useState<BlogCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
    const [translationStatus, setTranslationStatus] = useState<TranslationStatus>('idle');
    const [translationError, setTranslationError] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'posts' | 'categories'>('posts');
    const [selectedLocale, setSelectedLocale] = useState(locale);

    useEffect(() => {
        fetchData();
    }, [selectedLocale]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch posts
            const { data: postsData, error: postsError } = await supabase
                .from('blog_posts')
                .select('*, category:blog_categories(*)')
                .eq('locale', selectedLocale)
                .order('created_at', { ascending: false });

            if (postsError) throw postsError;

            // Fetch categories
            const { data: catData, error: catError } = await supabase
                .from('blog_categories')
                .select('*')
                .eq('locale', selectedLocale);

            if (catError) throw catError;

            setPosts(postsData || []);
            setCategories(catData || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateSlug = (text: string): string => {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    };

    const handleCreateNew = () => {
        setEditingPost({
            id: '',
            title: '',
            slug: '',
            content: '',
            excerpt: '',
            locale: selectedLocale,
            author: 'Vidahome',
            featured_image_url: '',
            featured_image_alt: '',
            meta_description: '',
            meta_keywords: '',
            is_published: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            published_at: null,
            category_id: categories[0]?.id,
        } as BlogPost);
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!editingPost) return;

        try {
            const slugValue = editingPost.slug || generateSlug(editingPost.title);

            if (editingPost.id) {
                // Update
                const { error } = await supabase
                    .from('blog_posts')
                    .update({
                        title: editingPost.title,
                        slug: slugValue,
                        content: editingPost.content,
                        excerpt: editingPost.excerpt,
                        meta_description: editingPost.meta_description,
                        meta_keywords: editingPost.meta_keywords,
                        featured_image_url: editingPost.featured_image_url,
                        featured_image_alt: editingPost.featured_image_alt,
                        is_published: editingPost.is_published,
                        category_id: editingPost.category_id,
                        published_at: editingPost.is_published ? (editingPost.published_at || new Date().toISOString()) : null,
                    })
                    .eq('id', editingPost.id);

                if (error) throw error;
            } else {
                // Create
                const { error } = await supabase
                    .from('blog_posts')
                    .insert({
                        title: editingPost.title,
                        slug: slugValue,
                        content: editingPost.content,
                        excerpt: editingPost.excerpt,
                        locale: selectedLocale,
                        author: editingPost.author,
                        meta_description: editingPost.meta_description,
                        meta_keywords: editingPost.meta_keywords,
                        featured_image_url: editingPost.featured_image_url,
                        featured_image_alt: editingPost.featured_image_alt,
                        is_published: false,
                        category_id: editingPost.category_id,
                    });

                if (error) throw error;
            }

            setIsEditing(false);
            setEditingPost(null);
            await fetchData();
        } catch (error) {
            console.error('Error saving post:', error);
            setTranslationError('Error guardando artículo');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar este artículo?')) return;

        try {
            const { error } = await supabase
                .from('blog_posts')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await fetchData();
        } catch (error) {
            console.error('Error deleting post:', error);
        }
    };

    const handleTranslate = async (postId: string) => {
        try {
            setTranslationStatus('translating');
            setTranslationError('');

            const post = posts.find(p => p.id === postId);
            if (!post) throw new Error('Post no encontrado');

            // Llamar a server action para traducir
            const response = await fetch('/api/admin/translate-blog', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    postId,
                    sourceLocale: selectedLocale,
                    targetLocales: LOCALES.map(l => l.id).filter(l => l !== selectedLocale)
                })
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.error || 'Error en traducción');

            setTranslationStatus('success');
            setTimeout(() => {
                setTranslationStatus('idle');
                fetchData();
            }, 2000);
        } catch (error) {
            setTranslationStatus('error');
            setTranslationError(error instanceof Error ? error.message : 'Error desconocido');
        }
    };

    const handleImageUpload = async (file: File) => {
        if (!file) return;

        try {
            const fileName = `${Date.now()}-${file.name}`;
            const { error } = await supabase.storage
                .from('blog-images')
                .upload(fileName, file);

            if (error) throw error;

            const { data } = supabase.storage
                .from('blog-images')
                .getPublicUrl(fileName);

            if (editingPost) {
                setEditingPost({
                    ...editingPost,
                    featured_image_url: data.publicUrl,
                    featured_image_alt: file.name.split('.')[0]
                });
            }
        } catch (error) {
            console.error('Error uploading image:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
                <Loader className="animate-spin text-slate-400" size={40} />
            </div>
        );
    }

    // FORM VIEW
    if (isEditing && editingPost) {
        return (
            <div className="min-h-screen bg-white dark:bg-slate-950">
                <div className="max-w-5xl mx-auto px-8 py-20">
                    <button
                        onClick={() => {
                            setIsEditing(false);
                            setEditingPost(null);
                        }}
                        className="mb-8 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    >
                        ← Volver
                    </button>

                    <h1 className="text-5xl font-serif mb-12">
                        {editingPost.id ? 'Editar Artículo' : 'Nuevo Artículo'}
                    </h1>

                    <div className="space-y-8">
                        {/* Title */}
                        <div>
                            <label className="block text-xs uppercase tracking-widest font-medium text-slate-500 mb-3">
                                Título
                            </label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded text-lg focus:outline-none focus:ring-2 focus:ring-lime-400"
                                value={editingPost.title}
                                onChange={(e) =>
                                    setEditingPost({ ...editingPost, title: e.target.value })
                                }
                                placeholder="Ej: 5 Errores en Web Inmobiliaria"
                            />
                        </div>

                        {/* Excerpt */}
                        <div>
                            <label className="block text-xs uppercase tracking-widest font-medium text-slate-500 mb-3">
                                Extracto (Resumen corto)
                            </label>
                            <textarea
                                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded focus:outline-none focus:ring-2 focus:ring-lime-400"
                                rows={3}
                                value={editingPost.excerpt}
                                onChange={(e) =>
                                    setEditingPost({ ...editingPost, excerpt: e.target.value })
                                }
                                placeholder="Descripción breve que aparece en el listado"
                            />
                        </div>

                        {/* Content */}
                        <div>
                            <label className="block text-xs uppercase tracking-widest font-medium text-slate-500 mb-3">
                                Contenido (Markdown)
                            </label>
                            <textarea
                                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-lime-400"
                                rows={20}
                                value={editingPost.content}
                                onChange={(e) =>
                                    setEditingPost({ ...editingPost, content: e.target.value })
                                }
                                placeholder="Usa Markdown: # Título, ## Subtítulo, **negrita**, etc."
                            />
                        </div>

                        {/* Featured Image */}
                        <div>
                            <label className="block text-xs uppercase tracking-widest font-medium text-slate-500 mb-3">
                                Imagen Destacada
                            </label>
                            {editingPost.featured_image_url && (
                                <div className="mb-4 relative">
                                    <img
                                        src={editingPost.featured_image_url}
                                        alt={editingPost.featured_image_alt}
                                        className="w-full max-h-64 object-cover rounded border border-slate-200 dark:border-slate-800"
                                    />
                                    <button
                                        onClick={() =>
                                            setEditingPost({
                                                ...editingPost,
                                                featured_image_url: '',
                                                featured_image_alt: ''
                                            })
                                        }
                                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded hover:bg-red-600"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            )}
                            <label className="block border-2 border-dashed border-slate-300 dark:border-slate-700 rounded p-8 text-center cursor-pointer hover:border-slate-400 transition">
                                <Upload className="mx-auto mb-2 text-slate-400" size={32} />
                                <span className="text-sm text-slate-600 dark:text-slate-400">
                                    Haz click para subir imagen
                                </span>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) {
                                            handleImageUpload(e.target.files[0]);
                                        }
                                    }}
                                />
                            </label>
                        </div>

                        {/* Meta SEO */}
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs uppercase tracking-widest font-medium text-slate-500 mb-3">
                                    Meta Description (SEO)
                                </label>
                                <textarea
                                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded focus:outline-none focus:ring-2 focus:ring-lime-400 text-sm"
                                    rows={2}
                                    value={editingPost.meta_description}
                                    onChange={(e) =>
                                        setEditingPost({
                                            ...editingPost,
                                            meta_description: e.target.value
                                        })
                                    }
                                    placeholder="Máx 160 caracteres"
                                />
                                <span className="text-xs text-slate-400 mt-1">
                                    {editingPost.meta_description.length}/160
                                </span>
                            </div>

                            <div>
                                <label className="block text-xs uppercase tracking-widest font-medium text-slate-500 mb-3">
                                    Keywords (separados por coma)
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded focus:outline-none focus:ring-2 focus:ring-lime-400"
                                    value={editingPost.meta_keywords}
                                    onChange={(e) =>
                                        setEditingPost({
                                            ...editingPost,
                                            meta_keywords: e.target.value
                                        })
                                    }
                                    placeholder="casa lujo, inmobiliaria, venta"
                                />
                            </div>
                        </div>

                        {/* Category */}
                        {categories.length > 0 && (
                            <div>
                                <label className="block text-xs uppercase tracking-widest font-medium text-slate-500 mb-3">
                                    Categoría
                                </label>
                                <select
                                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded focus:outline-none focus:ring-2 focus:ring-lime-400"
                                    value={editingPost.category_id || ''}
                                    onChange={(e) =>
                                        setEditingPost({
                                            ...editingPost,
                                            category_id: e.target.value || undefined
                                        })
                                    }
                                >
                                    <option value="">Sin categoría</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Publish Status */}
                        <div className="flex items-center gap-4 p-6 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                            <input
                                type="checkbox"
                                id="publish"
                                checked={editingPost.is_published}
                                onChange={(e) =>
                                    setEditingPost({
                                        ...editingPost,
                                        is_published: e.target.checked
                                    })
                                }
                                className="rounded"
                            />
                            <label htmlFor="publish" className="text-sm font-medium cursor-pointer">
                                Publicado
                            </label>
                            <span className="text-xs text-slate-500 ml-auto">
                                {editingPost.is_published ? 'Visible públicamente' : 'Borrador privado'}
                            </span>
                        </div>

                        {/* Translation Status */}
                        {translationStatus !== 'idle' && (
                            <div
                                className={`p-4 rounded flex items-center gap-3 ${
                                    translationStatus === 'translating'
                                        ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300'
                                        : translationStatus === 'success'
                                            ? 'bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-300'
                                            : 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-300'
                                }`}
                            >
                                {translationStatus === 'translating' && <Loader size={16} className="animate-spin" />}
                                {translationStatus === 'success' && <CheckCircle size={16} />}
                                {translationStatus === 'error' && <AlertCircle size={16} />}
                                <span className="text-sm">
                                    {translationStatus === 'translating' && 'Traduciendo...'}
                                    {translationStatus === 'success' && 'Traducción completada'}
                                    {translationStatus === 'error' && translationError}
                                </span>
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="flex gap-4 pt-6 border-t border-slate-200 dark:border-slate-800">
                            <button
                                onClick={handleSave}
                                className="px-8 py-4 bg-lime-400 text-slate-900 font-bold text-sm uppercase tracking-wider rounded hover:bg-lime-500 transition"
                            >
                                Guardar Borrador
                            </button>

                            {editingPost.id && (
                                <button
                                    onClick={() => handleTranslate(editingPost.id)}
                                    disabled={translationStatus === 'translating'}
                                    className="px-8 py-4 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm uppercase tracking-wider rounded hover:bg-slate-50 dark:hover:bg-slate-900 transition disabled:opacity-50"
                                >
                                    <Globe size={16} className="inline mr-2" />
                                    Traducir Automático
                                </button>
                            )}

                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setEditingPost(null);
                                }}
                                className="ml-auto px-8 py-4 text-slate-600 dark:text-slate-400 font-bold text-sm uppercase tracking-wider hover:text-slate-900 dark:hover:text-white transition"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // LIST VIEW
    return (
        <div className="min-h-screen bg-white dark:bg-slate-950">
            <div className="max-w-6xl mx-auto px-8 py-20">
                {/* Header */}
                <div className="flex justify-between items-start mb-12 border-b border-slate-200 dark:border-slate-800 pb-8">
                    <div>
                        <h1 className="text-5xl font-serif mb-4">Blog</h1>
                        <p className="text-slate-600 dark:text-slate-400">Gestiona artículos en {LOCALES.find(l => l.id === selectedLocale)?.label}</p>
                    </div>
                    <button
                        onClick={handleCreateNew}
                        className="px-8 py-4 bg-lime-400 text-slate-900 font-bold text-sm uppercase tracking-wider rounded hover:bg-lime-500 transition"
                    >
                        + Nuevo Artículo
                    </button>
                </div>

                {/* Locale Selector */}
                <div className="mb-12">
                    <label className="block text-xs uppercase tracking-widest font-medium text-slate-500 mb-4">
                        Idioma
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {LOCALES.map((loc) => (
                            <button
                                key={loc.id}
                                onClick={() => setSelectedLocale(loc.id)}
                                className={`px-4 py-2 text-sm font-medium rounded transition ${
                                    selectedLocale === loc.id
                                        ? 'bg-lime-400 text-slate-900'
                                        : 'border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                                }`}
                            >
                                {loc.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Posts List */}
                {posts.length > 0 ? (
                    <div className="space-y-4">
                        {posts.map((post) => (
                            <div
                                key={post.id}
                                className="border border-slate-200 dark:border-slate-800 rounded p-6 hover:border-slate-300 dark:hover:border-slate-700 transition"
                            >
                                <div className="flex items-start justify-between gap-6">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                                            {post.excerpt}
                                        </p>
                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                            <span>{post.locale.toUpperCase()}</span>
                                            <span>•</span>
                                            <span>{new Date(post.created_at).toLocaleDateString('es-ES')}</span>
                                            <span>•</span>
                                            <span
                                                className={post.is_published ? 'text-green-600' : 'text-yellow-600'}
                                            >
                                                {post.is_published ? 'Publicado' : 'Borrador'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setEditingPost(post);
                                                setIsEditing(true);
                                            }}
                                            className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-900 transition"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => handleDelete(post.id)}
                                            className="px-4 py-2 text-sm border border-red-300 dark:border-red-900 text-red-600 dark:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-950 transition"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 border border-slate-200 dark:border-slate-800 rounded">
                        <p className="text-slate-500">No hay artículos en {LOCALES.find(l => l.id === selectedLocale)?.label}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

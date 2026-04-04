'use client';

import React, { useEffect, useState } from 'react';
import { checkAuthAction, logoutAction } from '@/app/actions';
import { useRouter } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { Languages, LogOut, ArrowLeft } from 'lucide-react';
import { TranslationPanel } from '@/components/admin/TranslationPanel';

type TabType = 'properties' | 'hero' | 'blog';

export default function TranslationsHub() {
  const [activeTab, setActiveTab] = useState<TabType>('properties');
  const [isAuthed, setIsAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function check() {
      const authed = await checkAuthAction();
      if (!authed) {
        router.push('/admin/login');
        return;
      }
      setIsAuthed(true);
      setLoading(false);
    }
    check();
  }, [router]);

  const handleLogout = async () => {
    await logoutAction();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a192f] flex items-center justify-center font-serif italic text-white/40">
        Verificando autenticación...
      </div>
    );
  }

  if (!isAuthed) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-[#0a192f] to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-700/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Languages className="w-6 h-6" />
            <h1 className="text-2xl font-serif">Centro de Traducciones</h1>
          </div>
          <div className="flex gap-4">
            <Link
              href="/admin"
              className="flex items-center gap-2 text-sm hover:text-blue-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al Admin
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-slate-700/50">
          <button
            onClick={() => setActiveTab('properties')}
            className={`px-4 py-2 font-semibold transition-colors border-b-2 ${
              activeTab === 'properties'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Propiedades
          </button>
          <button
            onClick={() => setActiveTab('hero')}
            className={`px-4 py-2 font-semibold transition-colors border-b-2 ${
              activeTab === 'hero'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Banners/Hero
          </button>
          <button
            onClick={() => setActiveTab('blog')}
            className={`px-4 py-2 font-semibold transition-colors border-b-2 ${
              activeTab === 'blog'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Blog Posts
          </button>
        </div>

        {/* Properties Tab */}
        {activeTab === 'properties' && (
          <div>
            <TranslationPanel
              title="Traducir Descripciones de Propiedades"
              description="Traduce automáticamente las descripciones de propiedades del catálogo a 5 idiomas con IA. Las traducciones se guardan en la tabla property_metadata."
              onTranslate={async () => {
                const response = await fetch('/api/admin/translations/run', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                });
                return response.json();
              }}
            />
            <div className="mt-6 p-4 bg-slate-800/50 rounded border border-slate-700">
              <h4 className="font-semibold mb-2">📖 Ver editor detallado</h4>
              <p className="text-sm text-gray-400 mb-4">
                Para editar traducciones individuales, usar el panel de edición completo.
              </p>
              <Link
                href="/admin/translations"
                className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors text-sm"
              >
                Ir al Editor de Traducciones
              </Link>
            </div>
          </div>
        )}

        {/* Hero Tab */}
        {activeTab === 'hero' && (
          <div>
            <TranslationPanel
              title="Traducir Títulos del Banner/Hero"
              description="Traduce automáticamente los títulos de los banners de la página de inicio a 5 idiomas. Las traducciones se guardan en el campo 'titles' de cada slide."
              onTranslate={async () => {
                const response = await fetch('/api/admin/translations/hero', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                });
                return response.json();
              }}
            />
            <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700/50 rounded">
              <p className="text-sm text-blue-300">
                ℹ️ Los títulos se almacenan como JSON: {'{es, en, fr, de, it, pl}'}
              </p>
            </div>
          </div>
        )}

        {/* Blog Tab */}
        {activeTab === 'blog' && (
          <div>
            <TranslationPanel
              title="Traducir Títulos y Extractos de Blog"
              description="Traduce automáticamente los títulos y extractos de blog posts a 5 idiomas. Se crean nuevas filas en blog_posts para cada idioma marcadas como 'no publicadas' para revisión."
              onTranslate={async () => {
                const response = await fetch('/api/admin/translations/blog', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({}),
                });
                return response.json();
              }}
            />
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-slate-800/50 rounded border border-slate-700">
                <h4 className="font-semibold mb-2">📝 Traducción de Contenido</h4>
                <p className="text-sm text-gray-400 mb-4">
                  Para traducir el contenido completo de posts, usa un cliente REST con la acción <code className="bg-slate-900 px-2 py-1 rounded text-xs">translateBlogContentAction()</code>
                </p>
              </div>
              <div className="p-4 bg-yellow-900/20 border border-yellow-700/50 rounded">
                <p className="text-sm text-yellow-300">
                  ⚠️ Los posts traducidos se crean con <code className="bg-slate-900 px-2 py-1 rounded text-xs">is_published: false</code> para revisión antes de publicar.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 mt-12 py-6 text-center text-sm text-gray-400">
        <p>Centro de Traducciones • Traducción automática con IA</p>
      </footer>
    </div>
  );
}

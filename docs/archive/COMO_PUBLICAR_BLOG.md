# 📰 Cómo Publicar Artículos de Blog - Vidahome

## Opción 1: Vía Supabase Dashboard (La más rápida)

### Paso 1: Accede a Supabase
```
https://app.supabase.com/
```

### Paso 2: Abre la tabla `blog_posts`
1. En el panel izquierdo, ve a **Editor → blog_posts**
2. Haz click en **+ Insert row**

### Paso 3: Rellena los campos

```
id:                   [Auto-generado, déjalo vacío]
title:                "5 Errores en Web Inmobiliaria que Pierden Ventas"
slug:                 "5-errores-web-inmobiliaria"
excerpt:              "Descubre los 5 fallos más comunes que hacen que visitantes no se conviertan"
content:              [Tu contenido completo en markdown o texto]
locale:               "es"
author:               "Vidahome"
featured_image_url:   "https://vidahome.es/images/blog-1.jpg" [OPCIONAL]
meta_description:     "5 errores comunes en webs inmobiliarias - Cómo maximizar ventas"
meta_keywords:        "web inmobiliaria, marketing, conversión"
is_published:         false [primero FALSE para revisar]
category_id:          [OPCIONAL, deja vacío]
created_at:           [Auto-generado]
updated_at:           [Auto-generado]
published_at:         [Déjalo vacío hasta publicar]
```

### Paso 4: Guarda el artículo
Haz click en **Save**

### Paso 5: Revisa en tu web
- Español: `https://vidahome.es/es/blog`
- Inglés: `https://vidahome.es/en/blog`
- etc.

### Paso 6: Publica
Cuando esté listo, cambia `is_published` a `true` y actualiza `published_at` a ahora

---

## Opción 2: Crear Admin Panel para Blog (Recomendado)

Esto te permite publicar desde tu web sin acceder a Supabase.

### Crear archivo admin para blog

**File**: `src/app/[locale]/admin/blog/page.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { BlogPost } from '@/types/blog';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function BlogAdminPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingPost({
      id: '',
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      locale: 'es',
      author: 'Vidahome',
      featured_image_url: '',
      meta_description: '',
      meta_keywords: '',
      is_published: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
    } as BlogPost);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editingPost) return;

    try {
      if (editingPost.id) {
        // Update existing
        const { error } = await supabaseAdmin
          .from('blog_posts')
          .update({
            title: editingPost.title,
            slug: editingPost.slug,
            content: editingPost.content,
            excerpt: editingPost.excerpt,
            meta_description: editingPost.meta_description,
            meta_keywords: editingPost.meta_keywords,
            featured_image_url: editingPost.featured_image_url,
            is_published: editingPost.is_published,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingPost.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabaseAdmin
          .from('blog_posts')
          .insert({
            title: editingPost.title,
            slug: generateSlug(editingPost.title),
            content: editingPost.content,
            excerpt: editingPost.excerpt,
            locale: editingPost.locale,
            author: editingPost.author,
            meta_description: editingPost.meta_description,
            meta_keywords: editingPost.meta_keywords,
            featured_image_url: editingPost.featured_image_url,
            is_published: editingPost.is_published,
          });

        if (error) throw error;
      }

      setIsEditing(false);
      setEditingPost(null);
      await fetchPosts();
    } catch (error) {
      console.error('Error saving post:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este artículo?')) return;

    try {
      const { error } = await supabaseAdmin
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  if (loading) return <div className="p-8">Cargando...</div>;

  if (isEditing && editingPost) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">
          {editingPost.id ? 'Editar Artículo' : 'Nuevo Artículo'}
        </h1>

        <div className="space-y-6 bg-white dark:bg-slate-800 p-6 rounded-lg">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">Título</label>
            <input
              type="text"
              className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
              value={editingPost.title}
              onChange={(e) =>
                setEditingPost({ ...editingPost, title: e.target.value })
              }
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium mb-2">Extracto (Resumen)</label>
            <textarea
              className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
              rows={3}
              value={editingPost.excerpt}
              onChange={(e) =>
                setEditingPost({ ...editingPost, excerpt: e.target.value })
              }
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium mb-2">Contenido (Markdown)</label>
            <textarea
              className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 font-mono text-sm"
              rows={15}
              value={editingPost.content}
              onChange={(e) =>
                setEditingPost({ ...editingPost, content: e.target.value })
              }
            />
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Meta Description</label>
              <input
                type="text"
                className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                value={editingPost.meta_description}
                onChange={(e) =>
                  setEditingPost({
                    ...editingPost,
                    meta_description: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Keywords (comma separated)</label>
              <input
                type="text"
                className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                value={editingPost.meta_keywords}
                onChange={(e) =>
                  setEditingPost({
                    ...editingPost,
                    meta_keywords: e.target.value,
                  })
                }
              />
            </div>
          </div>

          {/* Publish Status */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editingPost.is_published}
                onChange={(e) =>
                  setEditingPost({
                    ...editingPost,
                    is_published: e.target.checked,
                  })
                }
              />
              <span className="text-sm font-medium">Publicado</span>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-6 border-t">
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Guardar
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditingPost(null);
              }}
              className="px-6 py-2 border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Blog Admin</h1>
        <button
          onClick={handleCreateNew}
          className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          + Nuevo Artículo
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-100 dark:bg-slate-700">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium">Título</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Idioma</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Estado</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="border-t dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700">
                <td className="px-6 py-4">{post.title}</td>
                <td className="px-6 py-4 text-sm">{post.locale.toUpperCase()}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      post.is_published
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {post.is_published ? 'Publicado' : 'Borrador'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm space-x-2">
                  <button
                    onClick={() => {
                      setEditingPost(post);
                      setIsEditing(true);
                    }}
                    className="text-blue-500 hover:underline"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="text-red-500 hover:underline"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Helper function
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
```

**Usar esta página:**
- Español: `https://vidahome.es/es/admin/blog`
- Inglés: `https://vidahome.es/en/admin/blog`

---

## Opción 3: Crear Script TypeScript (Para importar masivamente)

**File**: `scripts/add-blog-post.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function addBlogPost() {
  const newPost = {
    title: 'Guía Completa: Comprar Casa de Lujo en España',
    excerpt: 'Los 10 pasos esenciales para encontrar tu villa perfecta en España',
    content: `
# Guía Completa: Comprar Casa de Lujo en España

## Introducción

Comprar una casa de lujo en España es una inversión importante...

## Paso 1: Define Tu Presupuesto

Antes de comenzar la búsqueda...

## Paso 2: Elige la Ubicación

Considera factores como...

---

Este es un ejemplo. Reemplaza con tu contenido.
    `,
    locale: 'es',
    author: 'Vidahome',
    meta_description: 'Guía paso a paso para comprar vivienda de lujo en España',
    meta_keywords: 'vivienda lujo, comprar casa, inmobiliaria',
    is_published: false, // Draft
  };

  try {
    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .insert({
        ...newPost,
        slug: generateSlug(newPost.title),
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }

    console.log('✅ Artículo creado:');
    console.log(`   ID: ${data.id}`);
    console.log(`   Título: ${data.title}`);
    console.log(`   Slug: ${data.slug}`);
    console.log(`   URL: https://vidahome.es/es/blog/${data.slug}`);
    console.log(`\n   Estado: Borrador (is_published: false)`);
    console.log(`   Cambiar a publicado en Supabase cuando esté listo`);
  } catch (error) {
    console.error('❌ Error fatal:', error);
  }
}

// Ejecutar
addBlogPost();
```

**Ejecutar en terminal:**
```bash
cd c:\Users\Admin\.gemini\antigravity\scratch\inmovilla-next-app

npx tsx scripts/add-blog-post.ts
```

---

## Template: Estructura de Contenido para un Post

```markdown
# Título Principal (H1)

## Introducción (100-150 palabras)
- Plantea el problema
- Por qué es importante
- Qué aprenderá el lector

## Índice de Contenidos
- Sección 1
- Sección 2
- etc.

## Sección 1: Fundamentos
- Explicación clara
- Ejemplos prácticos
- Datos/estadísticas

## Sección 2: [Tema profundo]
- Análisis detallado
- Case studies
- Comparativas

## Sección 3: Cómo aplicarlo
- Pasos claros
- Herramientas necesarias
- Timeline

## Conclusión
- Resumen
- Llamada a acción ("Contáctanos para más info")
- Links internos

## FAQ (Opcional)
- Preguntas comunes
- Respuestas directas

---

**Metadata:**
- Title: 60 caracteres (incluir keyword)
- Meta Description: 160 caracteres
- Keywords: 5-7 palabras clave relevantes
```

---

## 📋 SEO Checklist Antes de Publicar

- ☐ Título contiene palabra clave principal
- ☐ Extracto es atractivo y clara la propuesta
- ☐ Contenido tiene 2000+ palabras (para SEO)
- ☐ H2/H3 headers naturales con keywords
- ☐ Meta description <160 caracteres
- ☐ Featured image agregada (si es posible)
- ☐ Links internos a otras páginas (3-5 min)
- ☐ Links externos a fuentes confiables (2-3)
- ☐ Contenido revisado (sin faltas)
- ☐ is_published = true cuando esté listo

---

## 🔗 Artículo Publicado Aparecerá en:

```
https://vidahome.es/es/blog/               (Listado)
https://vidahome.es/es/blog/nombre-post/   (Detalle)

https://vidahome.es/en/blog/
https://vidahome.es/en/blog/post-name/
```

---

## 💡 Tips Finales

**Para SEO:**
- Publicar 1-2 artículos/semana
- Usar palabras clave locales (Grau, Alicante, Playa)
- Actualizar posts viejos regularmente

**En Supabase:**
- Primero guardar como `is_published: false` (draft)
- Revisar todo cuidadosamente
- Luego cambiar a `is_published: true`

**Contenido recomendado:**
- "Guía: Comprar casa de lujo"
- "5 errores web inmobiliaria"
- "Mercado inmobiliario 2024"
- "Qué buscan compradores de lujo"
- "Locaciones mejores de Alicante"

---

Documento creado: 26 Feb 2026

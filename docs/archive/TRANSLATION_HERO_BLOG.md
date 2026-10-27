# 🌍 Sistema de Traducción - Extensión a Banner y Blog

**Versión**: 2.1 (Propiedades + Banner + Blog)  
**Fecha**: 24/02/2026  
**Status**: ✅ Server Actions Listos

---

## 📚 Contenidos Traducibles

El sistema de traducción con Perplexity ahora cubre **3 tipos de contenido**:

| Contenido | Tabla | Campos | Traducción |
|-----------|-------|--------|-----------|
| **Propiedades** | `property_metadata` | `descriptions` (JSON) | ✅ `translatePropertiesAction()` |
| **Banner/Hero** | `hero_slides` | `titles` (JSON) | ✅ `translateHeroAction()` (NUEVO) |
| **Blog Posts** | `blog_posts` | `title`, `excerpt`, `content` | ✅ `translateBlogPostAction()` (NUEVO) |

---

## 🎯 Banner/Hero - Traducción de Títulos

### Estructura en BD

```sql
-- hero_slides.titles es JSON con estructura:
{
  "es": "Espectacular villa en la costa",
  "en": "Spectacular coastal villa",
  "fr": "Villa côtière spectaculaire",
  "de": "Spektakuläre Küstenvilla",
  "it": "Spettacolare villa costiera",
  "pl": "Spektakularna willa przybrzeżna"
}
```

### Server Action

**Ubicación**: `src/app/actions/translate-hero.ts`

```typescript
import { translateHeroAction } from '@/app/actions/translate-hero';

// Usar en componente o API route
const result = await translateHeroAction();

// Result tiene estructura:
{
  success: boolean,
  translated: number,        // Cuántos banners se tradujeron
  errors: number,            // Errores durante traducción
  error_details?: [...],
  cost_estimate: string      // Ej: "0.0045€"
}
```

### Cómo Funciona

1. **Fetch**: Obtiene todos los `hero_slides` con campos `id` y `title`
2. **Prompt**: Envía los títulos en español a Perplexity
3. **Traducción**: Recibe JSON con 5 idiomas (EN, FR, DE, IT, PL)
4. **Update**: Para cada banner, actualiza campo `titles` con todas las traducciones
5. **Log**: Registra en `translation_log` con tokens y costo

---

## 📝 Blog Posts - Traducción de Títulos, Extracto y Contenido

### Estructura en BD

```sql
-- blog_posts tabla con campos por locale
id: UUID
title: string              -- Título del post
excerpt: string            -- Extracto/resumen
content: string            -- Contenido completo (Markdown)
locale: string             -- 'es', 'en', 'fr', 'de', 'it', 'pl'
slug: string               -- URL-friendly identifier
is_published: boolean      -- Draft/Published
category_id: UUID          -- Relación con categorías
created_at: timestamp
```

### Server Actions

#### 1. `translateBlogPostAction(postIds?)`

**Ubicación**: `src/app/actions/translate-blog.ts`

Traduce **títulos y extracto** de posts españoles a otros idiomas.

```typescript
import { translateBlogPostAction } from '@/app/actions/translate-blog';

// Traducir todos los posts españoles (últimos 10)
const result = await translateBlogPostAction();

// O traducir posts específicos
const result = await translateBlogPostAction(['post-id-1', 'post-id-2']);

// Result tiene estructura:
{
  success: boolean,
  translated: number,    // Posts traducidos
  errors: number,
  error_details?: [...],
  cost_estimate: string
}
```

**Comportamiento**:
- Busca posts españoles (`locale === 'es'`)
- Envía TÍTULO y EXTRACTO a Perplexity
- **Crea nuevas filas** `blog_posts` para cada idioma
- Marca como `is_published: false` para revisión
- Contenido se copia del original (traducir por separado)

#### 2. `translateBlogContentAction(postId)`

**Ubicación**: `src/app/actions/translate-blog.ts`

Traduce el **contenido completo** de un post individual.

```typescript
import { translateBlogContentAction } from '@/app/actions/translate-blog';

// Traducir contenido de un post específico
const result = await translateBlogContentAction('post-id');

// Result tiene estructura:
{
  success: boolean,
  translations?: {
    en: "English content...",
    fr: "Contenu français...",
    de: "Deutscher Inhalt...",
    it: "Contenuto italiano...",
    pl: "Zawartość polska..."
  },
  error?: string,
  cost_estimate: string
}
```

**Características**:
- Divide contenido en chunks (máx 2000 chars cada uno)
- Traduce cada chunk por separado (evita límites de tokens)
- Une los chunks traducidos con `\n\n`
- **No actualiza BD** - retorna solo traducciones para revisión

---

## 🔧 Crear Panel Admin para Banner y Blog

### 1. API Route para Traducir Banner

```typescript
// src/app/api/admin/translations/hero/route.ts
import { translateHeroAction } from '@/app/actions/translate-hero';

export async function POST(req: Request) {
  const result = await translateHeroAction();
  return Response.json(result);
}
```

### 2. API Route para Traducir Blog

```typescript
// src/app/api/admin/translations/blog/route.ts
import { translateBlogPostAction } from '@/app/actions/translate-blog';

export async function POST(req: Request) {
  const body = await req.json();
  const result = await translateBlogPostAction(body.postIds);
  return Response.json(result);
}
```

### 3. Admin Page (Ejemplo de Botones)

```tsx
// src/app/[locale]/admin/translations/hero/page.tsx
'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

export default function TranslateHeroAdmin() {
  const [translating, setTranslating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleTranslate = async () => {
    setTranslating(true);
    const res = await fetch('/api/admin/translations/hero', { method: 'POST' });
    const data = await res.json();
    setResult(data);
    setTranslating(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Traducir Banners</h1>
      
      <button
        onClick={handleTranslate}
        disabled={translating}
        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {translating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Traduciend...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Auto-traducir Banners
          </>
        )}
      </button>

      {result && (
        <div className="mt-6 p-4 bg-green-100 rounded">
          <p>✅ Traducidos: {result.translated}</p>
          <p>❌ Errores: {result.errors}</p>
          <p>💰 Costo: {result.cost_estimate}</p>
        </div>
      )}
    </div>
  );
}
```

---

## 📊 Ejemplos de Uso en Admin Panel

### Traducir Todo (Propiedades + Banner + Blog)

```typescript
// src/app/[locale]/admin/translations/page.tsx
const handleTranslateAll = async () => {
  // 1. Propiedades
  await runAutoTranslationAction();
  
  // 2. Banner
  await fetch('/api/admin/translations/hero', { method: 'POST' });
  
  // 3. Blog
  await fetch('/api/admin/translations/blog', { method: 'POST' });
  
  showMessage('✅ Todo traducido correctamente');
};
```

---

## 💰 Costos Estimados

| Tipo | Cantidad | Tokens Est. | Costo |
|------|----------|-----------|-------|
| 1 Propiedad (500 chars) | 1 | ~200 | €0.00004 |
| 1 Banner (50 chars) | 1 | ~50 | €0.00001 |
| 1 Blog Post (2000 chars) | 1 | ~800 | €0.00016 |
| **Total Sesión** | 100 prop + 10 hero + 5 blog | ~50k | **~€0.01-€0.02** |

---

## 🚀 Próximos Pasos

### Fase 1 (Ahora)
- ✅ Server actions para Hero y Blog listos
- ⏭️ Crear API routes
- ⏭️ Crear paneles admin con botones

### Fase 2 (Opcional)
- Traducción automática en el contenido (descripción de categorías, etc)
- Sistema de aprobación de traducciones antes de publicar
- Soporte para actualizaciones parciales

### Fase 3 (Futuro)
- Sistema de control de versiones para traducciones
- Historial de cambios por idioma
- Caché inteligente de traducciones

---

## ✅ Checklist de Implementación

- [ ] Archivo `translate-hero.ts` creado
- [ ] Archivo `translate-blog.ts` creado
- [ ] API route `/api/admin/translations/hero` creada
- [ ] API route `/api/admin/translations/blog` creada
- [ ] Admin page para hero traducciones
- [ ] Admin page para blog traducciones
- [ ] Botones en panel admin principal
- [ ] Test traducción en sandbox
- [ ] Deploy a producción

---

## 🔗 Referencias

- [Perplexity AI API Docs](https://docs.perplexity.ai)
- [Server Actions Next.js](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript)

---

**Autor**: GitHub Copilot  
**Versión**: 2.1 (Multi-content Translation)

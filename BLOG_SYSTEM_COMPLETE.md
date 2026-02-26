# 📰 BLOG SYSTEM COMPLETO - Guía de Implementación

> Status: ✅ IMPLEMENTADO Y LISTO PARA USAR

---

## 📋 Resumen del Sistema

Tu blog ahora es **completamente funcional** con:

✅ Admin panel profesional (estilo web)  
✅ Automatización de traducciones automáticas  
✅ Supabase configurado con RLS & Storage  
✅ 6 idiomas soportados (ES, EN, FR, DE, IT, PL)  
✅ SEO optimizado  
✅ Imagen destacadas con Storage  

---

## 🏗️ Arquitectura

```
COMPONENTES:

Frontend:
├── src/app/[locale]/blog/page.tsx          (Listado público)
├── src/app/[locale]/blog/[slug]/page.tsx   (Artículo individual)
├── src/app/[locale]/admin/blog/page.tsx    (🆕 Admin panel)
└── src/components/Navbar.tsx               (Link en navbar)

Backend:
├── src/app/api/admin/translate-blog/route.ts  (🆕 Endpoint traducción)
├── src/app/actions/blog.ts                    (Server actions)
└── src/app/actions/translate-blog.ts          (Traducción existente)

Database (Supabase):
├── blog_posts                (Artículos)
├── blog_categories          (Categorías)
├── blog_tags                (Etiquetas)
├── blog_post_tags          (Relación M-N)
└── blog_translation_log    (Tracking automático)

Storage:
└── blog-images/            (Imágenes destacadas)
```

---

## 🚀 PASO 1: Configurar Supabase SQL

### En Supabase Dashboard:

1. **Ir a**: SQL Editor → New Query
2. **Copiar contenido** de: `sql/blog-complete-setup.sql`
3. **Ejecutar** (play button)
4. **Verificar**: Ver todas las tablas bajo Table Editor

Esto crea:
- ✅ 5 tablas (blog_posts, categories, tags, etc.)
- ✅ 11 índices (optimización)
- ✅ RLS policies (seguridad)
- ✅ Funciones helper

### Almacenamiento de Imágenes:

1. **Storage** → **New Bucket**
2. **Nombre**: `blog-images`
3. **Public**: ✓ (checkbox)
4. **File size limit**: 10MB
5. **Allowed MIME**: `image/*`

---

## 🎨 PASO 2: Admin Panel en Uso

### URL:
```
https://vidahome-website.vercel.app/es/admin/blog/    (Español)
https://vidahome-website.vercel.app/en/admin/blog/    (Inglés)
etc.
```

⚠️ **Nota**: URL temporal en Vercel. Cuando migración a vidahome.es esté completa, cambiar dominio.

### Funcionalidades:

#### 📝 Crear/Editar Artículos

1. Click en **"+ Nuevo Artículo"** o **Editar**
2. Rellena:
   - **Título**: "5 Errores en Web Inmobiliaria"
   - **Extracto**: Texto corto para listado
   - **Contenido**: Markdown completo
   - **Imagen**: Upload desde Storage
   - **Meta SEO**: Description + Keywords
   - **Categoría**: Selecciona (opcional)

3. Luego:
   - ☐ Guarda como **Borrador** (is_published: false)
   - ☐ Revisa cambios en preview
   - ☐ Click **"Publicado"** para ir en vivo
   - ☐ Click **"Guardar Borrador"**

#### 🌍 Traducciones Automáticas

1. **Crear artículo en Español**
2. Click **"Traducir Automático"**
3. Sistema automáticamente:
   - ✅ Traduce título, extracto, contenido
   - ✅ Crea posts borrador en EN, FR, DE, IT, PL
   - ✅ Guarda en tabla `blog_translation_log`

4. Revisa traducciones:
   - Cambiar idioma en selector superior
   - Ver artículos EN, FR, etc.
   - Editar si necesitas ajustes
   - Publicar cuando esté listo

#### 🗂️ Filtrar por Idioma

Selector superior muestra todos los idiomas.
Cada idioma tiene sus artículos separados.

---

## 📊 Flujo de Publicación

```
1. CREAR (Español)
   └─ Admin panel → Nuevo artículo
   
2. REVISAR
   └─ Guardar como Borrador
   └─ Preview en https://vidahome.es/es/blog/slug
   
3. TRADUCIR
   └─ Click "Traducir Automático"
   └─ Espera 1-2 minutos
   └─ Sistema crea borrador en 5 idiomas
   
4. REVISAR TRADUCCIONES
   └─ Cambiar idioma → Editar si necesario
   └─ Verificar calidad
   
5. PUBLICAR TODOS
   └─ Marcar "Publicado" en cada idioma
   └─ ¡Artículo en vivo en 6 idiomas!
```

---

## 🛠️ Configuración Técnica

### Environment Variables Necesarias

En `.env.local`:

```bash
# Ya deberías tener
NEXT_PUBLIC_SUPABASE_URL="https://yheqvroinbcrrpppzdzx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# Para traducción automática (AGREGAR)
PERPLEXITY_API_KEY="ppl_..."  # https://www.perplexity.ai/settings/api

```

### Obtener Perplexity API Key

1. Ir a: https://www.perplexity.ai/settings/api
2. Crear nueva key
3. Copiar a `.env.local`
4. Reiniciar dev server

---

## 📈 Tabla `blog_posts` - Estructura Completa

```sql
Columna                 Tipo              Descripción
─────────────────────────────────────────────────────────────
id                      UUID              ID único
title                   VARCHAR(255)      Título (ej: "5 Errores...")
slug                    VARCHAR(255)      URL-friendly (ej: "5-errores")
excerpt                 VARCHAR(500)      Resumen corto (listado)
content                 TEXT              Contenido completo (Markdown)
locale                  VARCHAR(5)        Idioma: es, en, fr, de, it, pl
author                  VARCHAR(100)      Autor (default: "Vidahome")
featured_image_url      VARCHAR(500)      URL imagen destacada
featured_image_alt      VARCHAR(255)      Alt text imagen
meta_description        VARCHAR(160)      Para SEO (Google snippet)
meta_keywords           VARCHAR(255)      Keywords (ej: "casa, lujo")
is_published            BOOLEAN           true=público, false=borrador
category_id             UUID              Referencia a blog_categories
created_at              TIMESTAMP         Fecha creación
updated_at              TIMESTAMP         Fecha última edición
published_at            TIMESTAMP         Fecha publicación
```

---

## 🔗 Tablas Relacionadas

### `blog_categories`
```sql
id              UUID
name            VARCHAR(100)    -- "Mercado Inmobiliario"
slug            VARCHAR(100)    -- "mercado-inmobiliario"
description     TEXT
locale          VARCHAR(5)      -- es, en, fr, etc.
icon            VARCHAR(50)     -- Icon name (opcional)
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### `blog_tags`
```sql
id              UUID
name            VARCHAR(50)     -- "Lujo"
slug            VARCHAR(50)     -- "lujo"
locale          VARCHAR(5)
created_at      TIMESTAMP
```

### `blog_post_tags` (Many-to-Many)
```sql
id              UUID
post_id         UUID REFERENCES blog_posts(id)
tag_id          UUID REFERENCES blog_tags(id)
```

### `blog_translation_log` (Automatización)
```sql
id                      UUID
source_post_id          UUID        -- Post original
target_post_id          UUID        -- Post traducido
source_locale           VARCHAR(5)  -- es
target_locale           VARCHAR(5)  -- en, fr, etc.
status                  VARCHAR(20) -- pending, in_progress, completed, failed
cost_estimate           VARCHAR(20) -- €
error_message           TEXT        -- Si falló
created_at              TIMESTAMP
completed_at            TIMESTAMP
```

---

## 🚦 RLS (Row Level Security) - Seguridad

| Tabla | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| blog_posts | Public (si published=true) + Admin | Admin | Admin | Admin |
| blog_categories | Public | Admin | Admin | Admin |
| blog_tags | Public | Admin | Admin | Admin |

**¿Qué significa?**
- ✅ Visitantes ven solo artículos publicados
- ✅ Borradores solo ve admin
- ✅ Solo admin puede crear/editar

---

## 📱 Frontend - URLs Públicas

### Listado de Artículos
```
https://vidahome-website.vercel.app/es/blog/
https://vidahome-website.vercel.app/en/blog/
https://vidahome-website.vercel.app/fr/blog/
etc.
```

### Artículo Individual
```
https://vidahome-website.vercel.app/es/blog/5-errores-web-inmobiliaria/
https://vidahome-website.vercel.app/en/blog/5-common-web-mistakes/
```

⚠️ **URLs temporales en Vercel** - Cambiarán a vidahome.es después de migración

---

## 💡 Mejores Prácticas

### Estructura de Contenido Markdown

```markdown
# Título Principal (H1)

## Introducción
Párrafo introductorio...

## Sección 1
Contenido...

### Subsección
Más contenido...

## Conclusión
Resumen y CTA...

---

**Tags**: lujo, inmobiliaria, venta
```

### SEO Checklist Antes de Publicar

- ☐ Título <60 caracteres
- ☐ Meta Description <160 caracteres
- ☐ Contenido >2000 palabras
- ☐ Imagen destacada 1200x630px
- ☐ Keywords en título + H2s
- ☐ Links internos (3-5 mínimo)
- ☐ Links externos (2-3 autoridades)
- ☐ Revisado ortografía

### Frecuencia de Publicación para SEO

- **Óptimo**: 2 artículos/semana
- **Bueno**: 1 artículo/semana
- **Mínimo**: 2 artículos/mes

---

## 🐛 Troubleshooting

### Traducción falla
```
✓ Verificar PERPLEXITY_API_KEY en .env.local
✓ Comprobar que API key tiene créditos
✓ Ver error en blog_translation_log (Supabase)
```

### Imagen no sube
```
✓ Comprobar tamaño < 10MB
✓ Verificar formato (JPG, PNG, WebP)
✓ Check bucket "blog-images" público en Supabase
```

### Post no aparece en público
```
✓ Verificar is_published = true
✓ Comprobar published_at !== NULL
✓ Revisar RLS policies (blog_posts_select)
```

### Traducción crea duplicados
```
Normal - Sistema crea draft en cada idioma
Solución: Consultar blog_translation_log para trackear
```

---

## 🔄 Automatización Futura (Roadmap)

Ideas para extender:

1. **Auto-publicar después de traducción**
   - Post original se publica automáticamente
   - Traducciones quedan en draft para revisar

2. **Compartir automáticamente a redes**
   - Twitter/LinkedIn automático
   - Con imagen destacada + link

3. **Email newsletter**
   - Enviar artículo nuevo a suscriptores
   - Per idioma

4. **Analytics integrado**
   - Ver vistas por artículo
   - Tiempo promedio lectura
   - Bounce rate

5. **Correlaciones automáticas**
   - Sugerir artículos relacionados
   - Link "Más artículos" al final

---

## 📝 Archivos Creados/Modificados

```
NUEVOS:
├── sql/blog-complete-setup.sql                 (Schema + RLS)
├── src/app/[locale]/admin/blog/page.tsx       (Admin panel)
├── src/app/api/admin/translate-blog/route.ts  (Endpoint)
└── BLOG_SYSTEM_COMPLETE.md                     (Este documento)

MODIFICADOS:
└── src/components/Navbar.tsx                   (Link "Blog")

EXISTENTES (no tocados):
├── src/app/[locale]/blog/page.tsx             (Listado público)
├── src/app/[locale]/blog/[slug]/page.tsx      (Artículo público)
├── src/app/actions/blog.ts                    (Server actions)
└── src/types/blog.ts                          (Types)
```

---

## 🚀 Próximos Pasos

### AHORA:
1. ✅ Ejecutar SQL en Supabase
2. ✅ Crear bucket "blog-images"
3. ✅ Agregar PERPLEXITY_API_KEY a .env.local
4. ✅ Hacer push & deploy Vercel

### MÁS TARDE:
1. Crear primeros artículos (blog SEO strategy)
2. Optimizar para Google (sitemap, keywords)
3. Agregar newsletter suscriptores
4. Social media integration

---

## 📞 Quick Reference

**URL Admin**: `https://vidahome-website.vercel.app/es/admin/blog/` (cada idioma)  
**URL Pública**: `https://vidahome-website.vercel.app/es/blog/` (listado) + `https://vidahome-website.vercel.app/es/blog/slug/` (artículo)  
**Dominio**: Vercel por ahora → vidahome.es cuando migración esté completa  
**Default Draft**: is_published = false (siempre guarda como draft)  
**Auto-translate**: Click "Traducir Automático" en panel  
**Images**: Sube en Storage "blog-images" (max 10MB)  
**Markdown**: Soportado en contenido (títulos, **negrita**, etc.)  

---

**Última actualización**: 26 Feb 2026  
**Status**: ✅ Producción lista  
**Idiomas**: 6 (ES, EN, FR, DE, IT, PL)  
**Características**: Blog completo + Traducciones automáticas + Admin panel

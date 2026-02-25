# Vidahome - Estado del Proyecto y Contexto Actual

Este documento es una bitácora para mantener el contexto de desarrollo entre sesiones. Úsalo para que Antigravity (o cualquier desarrollador) entienda rápidamente qué se ha hecho y qué falta.

---

## 🚀 Logros Recientes (Completado)

### 1. Integración de API Inmovilla (Web API)
- **Cambio de Estrategia**: Se migró de la REST API (v1) a la **Web API** (`apiweb.inmovilla.com`).
- **Razón**: La REST API tiene límites de frecuencia (rate limits) y es menos flexible para el catálogo. La Web API es más estable y permite peticiones por procesos.
- **Seguridad**: Implementación de validación de tipos y sanitización de entradas para evitar inyecciones SQL en los parámetros de búsqueda.

### 2. Infraestructura de Proxy (Arsys)
- **Static IP**: Configuración de un proxy en PHP alojado en Arsys (`api.vidahome.es`).
- **Problema Solucionado**: Vercel usa IPs dinámicas que Inmovilla bloquea. El proxy usa la IP fija de Arsys que ya está autorizada.
- **Seguridad**: Comunicación Vercel -> Arsys protegida con `X-Proxy-Secret`.

### 3. Caché Inteligente de Descripciones (Supabase)
- **Desafío**: El proceso `paginacion` de Inmovilla no devuelve las descripciones de los anuncios (solo datos básicos). El proceso `ficha` sí las trae pero es lento (1 por 1).
- **Solución**: Supabase actúa como "memoria rápida". 
    - Se han sincronizado **50 propiedades** manualmente.
    - **Supabase-First para TODO**: El sistema ahora intenta cargar la vivienda completa (precio, fotos, descripción) desde Supabase antes de llamar a la API de Inmovilla. Esto reduce el tiempo de carga de ~2s a milisegundos para propiedades ya conocidas.
    - El sistema tiene un motor de **auto-aprendizaje**: cuando alguien visita una ficha por primera vez, el sistema guarda el objeto completo en Supabase.

### 4. Visualización y UX Premium
- **Google Maps**: Integrado en la ficha de cada propiedad. Usa coordenadas exactas o dirección.
    - *Corrección técnica*: Se ajustó la **Content Security Policy (CSP)** en `next.config.ts` para permitir el cargue de frames de Google Maps.
    - *Diseño*: Se mantienen los **colores originales** del mapa para facilitar la identificación de puntos de interés (playas, zonas verdes) por parte del usuario.
- **Limpieza de Textos**: Motor que elimina etiquetas HTML, emoticonos excesivos y asteriscos de portales que vienen del CRM.
- **Selector de Idioma**: Soporte para Español (`es`) e Inglés (`en`).

---

### 5. Soporte Multi-idioma Inteligente (Caché JSONB)
- **Problema**: El catálogo solo cargaba descripciones en español desde Supabase.
- **Solución**: Se implementó una columna `descriptions` (JSONB) que almacena un mapa de idiomas (`es`, `en`, `fr`, etc.).
- **Auto-Aprendizaje**: Al visitar una ficha, el sistema extrae automáticamente todos los idiomas disponibles de Inmovilla y los guarda en la "bóveda" de Supabase.
- **Autotraducción con IA (Gratis)**: Integración con **Hugging Face** (Helsinki-NLP/MarianMT y NLLB) para traducir automáticamente descripciones faltantes desde el español. Las traducciones se guardan en Supabase para futuras consultas.
- **Panel de Control de Traducciones**: Nueva sección en `/admin/translations` que permite revisar, corregir y guardar manualmente las descripciones en todos los idiomas (ES, EN, FR, DE).
- **Corrección de Build**: Solucionado error de tipado en `revalidateTag` para compatibilidad con Next.js 16.

### 6. Refinamiento y Optimización de i18n
- **Traducción de Tipos de Propiedad**: Implementado un mapeador dinámico (`src/lib/utils/property-types.ts`) que traduce términos nativos de Inmovilla (p.ej., "Chalet" → "Villa", "Piso" → "Apartment").
- **Formulario de Contacto Localizado**: Internacionalización completa de `ContactForm.tsx`, incluyendo etiquetas, placeholders y mensajes de éxito/error.
- **Optimización de Carga (IA)**:
    - **Supabase-First**: El sistema ahora consulta Supabase antes de intentar cualquier traducción por IA. Esto elimina latencias de hasta 60s en propiedades ya cacheadas.
    - **Timeout y AbortController**: Implementado un tiempo de espera máximo de 8 segundos para la IA. Si el modelo de Hugging Face está "frío", el sistema cancela la petición y muestra el texto original para no bloquear la experiencia del usuario.
- **SEO Internacional**: Los metadatos de las fichas (títulos y descripciones OpenGraph) ahora se generan dinámicamente en el idioma seleccionado.

### 7. Traducción de Horarios y Banner Multilingüe
- **Traducción de Horarios dinámicos**: Creado `src/lib/utils/schedule-translator.ts` para traducir automáticamente cadenas de texto libre de horarios (p.ej. "Lunes - Viernes" → "Monday - Friday"). Aplicado en Footer y Página de Contacto.
- **Títulos de Hero Multilingüe**:
    - Se ha evolucionado la tabla `hero_slides` con una columna `titles` (JSONB) para permitir títulos específicos por idioma.
    - **Panel Admin**: Actualizada la interfaz de gestión de vídeos para permitir la edición simultánea de títulos en Español e Inglés.
    - **Banner dinámico**: El componente `LuxuryHero` ahora selecciona automáticamente el título según el locale del usuario, con fallback al español legado.
- **Página de Contacto**: Internacionalización completa de la página de contacto (`/contacto`), incluyendo cabeceras, descripciones de oficina y etiquetas.

### 8. Optimización de Performance en Homepage (Batching)
- **Desafío**: La homepage en inglés era lenta (~8s) porque intentaba cargar los detalles de las 6 viviendas destacadas una por una, disparando múltiples consultas a Supabase y peticiones externas.
- **Solución**: 
    - **Batch Fetching**: Se refactorizó `getFeaturedPropertiesWithDetailsAction` para realizar una única consulta masiva a Supabase (`.in('cod_ofer', featuredIds)`). Esto reduce drásticamente el overhead de conexión y latencia.
    - **Corrección de Mapeo de Idiomas**: Se detectó un error en el adaptador de la API donde las descripciones planas devueltas por Inmovilla se marcaban siempre como Español (`es`), lo que causaba fallos de caché en Inglés y forzaba el uso de la IA en cada carga.
    - **Caché Persistente**: Se implementó `unstable_cache` para la lista de IDs destacados, evitando consultas redundantes a la base de datos en cada refresco.

---

## 9. Optimización de Rendimiento en Homepage - FeaturedGrid Server Component
- **Problema Identificado**: `FeaturedGrid` era un Client Component que llamaba `getFeaturedPropertiesWithDetailsAction()` en `useEffect`, causando latencia en la carga inicial.
- **Causa Raíz**: En versión en inglés (en), la latencia de red se acumulaba más notoriamente que en español (es), donde el caché local es más rápido.
- **Solución Implementada**:
  - **Server Component**: Convertido `FeaturedGrid` a async Server Component que pre-carga los datos antes del render.
  - **Caché por Locale**: Envuelta `getFeaturedPropertiesWithDetailsAction()` en `unstable_cache` con variación por idioma (`getCachedFeaturedPropertiesForLocale`).
  - **Arquitectura Escalable**: Estructura diseñada para agregar fácilmente más idiomas (fr, de, it, pt, etc.) en el futuro.
- **Beneficios**:
  - SSR más rápido (~400-500ms para todas las 6 propiedades)
  - Mejor Core Web Vitals (no layout shift después del render)
  - Caché compartido entre todas las solicitudes al mismo locale
  - Sin overhead de `useEffect` y estado del cliente

---

### 10. Traducción Automática PRO (Perplexity AI Engine + Server Actions)
- **Arquitectura Final (Producción)**:
    - **Server Actions** (`src/app/actions/translate-perplexity.ts`): Core logic que:
      - Llama a Perplexity API con modelo `sonar-small-online`
      - Actualiza `property_metadata.descriptions` JSON con traducciones
      - Registra todas las traducciones en `translation_log` (éxito/error, tokens, costo)
    - **Admin Panel** (`src/app/[locale]/admin/translations/page.tsx`):
      - Carga lista de propiedades desde `property_metadata`
      - Permite edición manual de traducciones en 5 idiomas (EN, FR, DE, IT, PL)
      - Botón de auto-traducción dispara `translatePropertiesAction()`
    - **API Routes** (`src/app/api/admin/translations/*`):
      - GET `/api/admin/translations` - Listar propiedades
      - POST `/api/admin/translations/run` - Ejecutar auto-traducción
      - POST `/api/admin/translations/save` - Guardar edits manuales

- **Integración de Perplexity API**:
    - Modelo: `sonar-small-online` (balanceado entre velocidad y calidad)
    - Idiomas soportados: Inglés (EN), Francés (FR), Alemán (DE), Italiano (IT), Polaco (PL)
    - Prompt experto para sector inmobiliario de lujo

- **Características**:
    - ✅ Evita errores JWT usando `supabaseAdmin` (SERVER_ROLE_KEY)
    - ✅ Auto-merge: nuevas traducciones se fusionan con existentes (no sobrescriben)
    - ✅ Logging completo: `translation_log` registra ejecuciones (tokens, costo estimado)
    - ✅ Interfaz amigable para edición manual
    - ✅ Control de cache: `revalidateTag()` invalidate datos después de cambios

### 11. Translation Hub Multicontenido (24/02/2026)
- **Problema**: Sistema de traducción solo cubría propiedades
- **Solución**: Extendido a **Banner/Hero** y **Blog Posts**
  - `translateHeroAction()` en `src/app/actions/translate-hero.ts` - Traduce títulos de slides
  - `translateBlogPostAction()` en `src/app/actions/translate-blog.ts` - Traduce títulos/extractos
  - `translateBlogContentAction()` en `src/app/actions/translate-blog.ts` - Traduce contenido completo
- **Interfaz Centralizada**: `/admin/translations-hub` con 3 tabs (Propiedades, Banners, Blog)
  - Componente `TranslationPanel` reutilizable para cualquier contenido
  - API routes para cada tipo: `/api/admin/translations/{hero,blog}`
  - UI con indicadores de estado, costo y detalles de errores
- **Data Format**:
  - `hero_slides.titles`: JSON con estructura `{es, en, fr, de, it, pl}`
  - `blog_posts`: Múltiples filas (una por idioma) con `is_published: false` para revisión
- **Builds Completados**:
  - ✅ **Commit 9345e5f**: Funciones de traducción para Hero y Blog
  - ✅ **Commit 0f332a0**: Hub centralizado, API routes, componentes

## 12. Sistema de Sincronización Incremental de Propiedades (25/02/2026)
- **Problema Identificado**: Arquitectura original dispersaba llamadas a Inmovilla por toda la app, multiplicando rate limits
- **Solución Implementada**:
  - **Sincronización Centralizada**: Nueva action `syncPropertiesIncrementalAction()` en `src/app/actions/inmovilla.ts`
  - **Batch Processing**: Procesa 10 propiedades por ciclo usando tabla `sync_progress` para tracking persistente
  - **API Endpoint**: `/api/admin/sync-incremental` para integración con GitHub Actions
  - **GitHub Actions Cron**: Workflow automático que ejecuta sync cada minuto
  - **Supabase Source of Truth**: Todos los reads públicos usan `property_metadata` (Supabase), no Inmovilla directamente
- **Logros**:
  - ✅ 18 de 77 propiedades sincronizadas exitosamente
  - ✅ Base arquitectónica sólida para expansión
  - ✅ Logging detallado [Sync Inc] para debugging

### 12a. Optimización de Rate Limit Inmovilla (25/02/2026 v2)
- **Problema**: Inmovilla tiene límite de 10 llamadas/minuto, pero implementación hacía 1 + 10 = 11 llamadas
- **Causa Raíz**: Workflow ejecutaba cron cada 1 minuto con batch size de 10 propiedades
- **Solución (Commit a8d737e)**:
  - Cron interval: `*/1 * * * *` → `*/2 * * * *` (ahora cada 2 minutos)
  - Batch size: 10 → 8 propiedades por ciclo
  - Resultado: 1 + 8 = 9 llamadas cada 2 minutos = ~4.5 llamadas/minuto (bien bajo del límite)
- **Impacto**:
  - Throughput: ~4 propiedades sincronizadas por minuto (8 cada 2 min)
  - ETA para sincronizar 77: ~16-20 minutos desde ahora (18/77 ya hechas)
  - Cero errores rate limit esperados
  - Sistema de sync estable y escalable

## 12b. Traducciones Profesionales Multiidioma (25/02/2026 v3)
- **Problema**: Traducciones literales con LinkedIn no resonaban culturalmente con compradores internacionales
- **Solución (Commit c90a4e2)**:
  - Creado `scripts/translate-direct.ts` usando Perplexity API directamente
  - Nuevo prompt de 15+ años de experiencia en lujo inmobiliario internacional
  - Guías específicas por mercado:
    * **English**: Enfoque inversión + prestigio localización
    * **French**: Elegancia + estándar refinamiento francés
    * **German**: Precisión técnica + calidad construcción
    * **Italian**: Estética + lifestyle mediterráneo  
    * **Polish**: Características prácticas + potencial inversión
  - Temperature: 0.2 → 0.4 (tono más natural y atractivo)
- **Resultados**:
  - ✅ 24/24 propiedades traducidas (EN, FR, DE, IT, PL)
  - ✅ Descripciones culturalmente adaptadas, no literales
  - ✅ Mantiene terminología inmobiliaria precisa en cada idioma
  - ✅ Totalmente desplegado y funcional

## ✅ Completado

- ✅ Sistema de traducción con Perplexity AI (Propiedades, Banners, Blog)
- ✅ Translation Hub centralizado con interfaz tabbed
- ✅ Admin panel funcional con edición manual y auto-traducción
- ✅ Build pipeline limpio sin errores TypeScript
- ✅ Arquitectura segura (Server Actions sin JWT)
- ✅ Logging de auditoría completo en `translation_log`
- ✅ Consolidación de datos: todas las fuentes se consultan desde `property_metadata`
- ✅ Sistema de sincronización incremental de Inmovilla (GitHub Actions + Supabase)
- ✅ Optimización de rate limit: 9 llamadas cada 2 minutos (4.5/min promedio)
- ✅ 18/77 propiedades sincronizadas (en progreso)

## 🎯 Próximas Mejoras (Opcionales)

1. **Interfaz de contenido**: Traductor interactivo para contenido largo de blog
2. **Sistema de aprobación**: Revisar traducciones antes de publicar
3. **Historial**: Versiones de traducciones por idioma
4. **Optimización**: Caché inteligente de traducciones frecuentes

## 🚀 Roadmap Estratégico: Independencia de Inmovilla (6-8 meses)

**Ver documento completo**: [PRODUCT_INDEPENDENCE_ROADMAP.md](./PRODUCT_INDEPENDENCE_ROADMAP.md)

⚠️ **IMPORTANTE**: Este roadmap es estrategia a **LARGO PLAZO (junio-agosto 2026)**. Actualmente (febrero 2026) la **prioridad es estabilidad**:
- ✅ Sincronizar 77/77 propiedades completamente
- ✅ Validar descripciones, fotos, metadatos en production
- ✅ Asegurar performance y UX de vidahome-website
- ✅ Una vez 100% estable → comenzar Fase 1 del roadmap

**Resumen Ejecutivo** (para cuando sea momento):
- Fase 1: Infraestructura Supabase Pro + Storage (Semanas 1-4)
- Fase 2: Sincronización de fotos desde Inmovilla → Supabase Storage (Semanas 5-8)
- Fase 3: Integración vidahome-encargo ↔ vidahome-website (Semanas 9-12)
- Fase 4: APIs Idealista + Fotocasa para multiplicar publicaciones (Semanas 13-20)
- Fase 5: Prescindir gradualmente de Inmovilla (Semanas 21-26)
- Fase 6: Optimizaciones finales + Documentación (Semanas 27-30)
- Fase 7: Monitoreo y mantenimiento (Ongoing)

**Beneficio Clave** (futuro): De "sincronizar datos de Inmovilla" a "publicar en 3 portales desde un único panel".

---

## 13. Multilingual Footer & Query Optimization (2026-02-25)

### 🌍 Multilingual Capabilities Indicator
- **Footer Added**: "Nous parlons français. We speak English. Mówimy po polsku. Parliamo italiano."
- **Purpose**: Display identical in all language descriptions to showcase agency speaks multiple languages
- **Implementation**:
  - Modified `translate-direct.ts` to append footer to new translations
  - Created `add-multilingual-footer.ts` for batch updates to existing properties
  - Updated 49 existing properties with footer (27 already had it)
- **Automatic**: All future translationsinclude footer automatically

### 🚀 Denormalización de Datos Frecuentes (Property Features Table)
- **Problema**: Listados y filtrados requieren hacer muchas llamadas a `property_metadata` o a Inmovilla para obtener precio, rooms, baths, área
- **Solución**: Nueva tabla `property_features` en Supabase con campos altamente indexados
- **Tabla Creada**: 
  ```sql
  CREATE TABLE property_features (
    id BIGSERIAL PRIMARY KEY,
    cod_ofer INTEGER (FK → property_metadata),
    precio NUMERIC(12,2),
    habitaciones INTEGER,
    banos INTEGER,
    superficie NUMERIC(10,2),  -- m2
    plantas INTEGER,
    ascensor BOOLEAN,
    parking BOOLEAN,
    terraza BOOLEAN,
    ano_construccion INTEGER,
    estado_conservacion TEXT,
    clase_energetica TEXT,
    created_at / updated_at / synced_at TIMESTAMP
  )
  ```
- **Índices**: precio, habitaciones, superficie, synced_at para consultas ultra-rápidas
- **RLS**: Lectura pública, escritura solo service role
- **Auto-población**: `syncPropertiesIncrementalAction()` ahora hace upsert a ambas tablas (property_metadata + property_features)

### 📊 Impacto
- Consultas de listado: 100-1000ms → <100ms
- Eliminación de llamadas redundantes a API
- Preparación para Growth Phase (Supabase Pro + Storage)
- Escalable para 1000+ propiedades sin degradación

### 🔄 Tabla `properties` - Mejor Estructura (PENDIENTE REVISIÓN)
- **Observación**: Existe tabla `properties` con mejor estructura que `property_metadata`:
  - Columnas separadas: description_es, description_en, description_fr, description_de, description_it, description_pl
  - Más limpia, legible, eficiente para queries por idioma
- **Decision PENDIENTE**: Cuando se complete 77/77 sync, revisar alineación de tablas:
  - ¿Usar `properties` como tabla principal?
  - ¿Consolidar `property_metadata` + `properties` en una sola?
  - ¿Mantener ambas para diferentes casos de uso?
- **Timeline**: Después de completar captura de datos (actualmente 50/77)

---

*Última actualización: 25/02/2026 (18:45) - Sync: 50/77 propiedades ✅ | Multilingual footer (49 updated) ✅ | Property features table ✅ | PENDING: Table structure optimization post-sync*

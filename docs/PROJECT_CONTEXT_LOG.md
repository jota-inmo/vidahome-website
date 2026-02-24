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

- **Build Fixes Completados**:
    - ✅ **Commit 0311cae**: Movida Edge Function a `supabase/functions/` (fuera del root)
    - ✅ **Commit 54fe3af**: Actualizado `tsconfig.json` para excluir carpeta `supabase/`
    - ✅ **Commit c55beae**: Corregido import `createClient` → `supabaseAdmin` en API routes
    - ✅ **Commit b6d91e7**: Añadido type guard `'translated' in res` para manejo correcto de tipos
    - ✅ **Commit 8c1964f**: Corregida firma `revalidateTag()` (añadido segundo argumento options object) para Next.js 16.1.6

## ✅ Completado

- ✅ Sistema de traducción con Perplexity AI operacional
- ✅ Admin panel funcional para edición de traducciones
- ✅ Build pipeline limpio sin errores TypeScript
- ✅ Arquitectura de servidor segura (sin Edge Functions con JWT)
- ✅ Logging de auditoría en `translation_log`

## 🎯 Próximas Mejoras (Opcionales)

1. **Validación automática**: Revisar precisión de traducciones Perplexity en todos los idiomas
2. **Mejoras SEO**: Metadatos dinámicos por idioma
3. **Refactor de Limpieza**: Aplicar motor de limpieza de textos a todos los idiomas guardados

---
*Última actualización: 24/02/2026 (12:30) - Server Actions + Perplexity integrados. Build exitoso. Admin panel listo.*

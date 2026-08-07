# CLAUDE.md - Vidahome Website (Next.js + Supabase + CRM)

## 🏗️ Project Architecture
- **Framework**: Next.js 15+ (App Router).
- **Styling**: Tailwind CSS 4.0.
- **Database**: Supabase (PostgreSQL).
- **i18n**: `next-intl` (locales: `es`, `en`, `fr`, `de`, `it`, `pl`).
- **Auth**: Custom HMAC-SHA256 signed session cookie (`admin_session`) for `/admin` routes.
- **AI**: Gemini 2.5 Flash (free tier, 10 RPM) for property + blog translations. Replaced Perplexity (2026-04-04). 7s delay between API calls to avoid 429 errors.
- **Geodata**: Catastro API integration for property valuation and location data.
- **Analytics**: Custom event tracking system integrated with Supabase.

## 🔄 CRM & External Systems
- **Inmovilla CRM**: The primary source of property data (synced into Supabase by the Broker CRM, not by this repo).
- **Inmovilla Web API**: ❌ Retired 2026-04-15 (`b57eaae`) — `web-client.ts`/`web-service.ts` and the Arsys proxy were deleted. This repo makes NO direct Inmovilla API calls.
- **Relationship**: The project acts as a high-performance, SEO-friendly storefront. It reads Supabase (`property_metadata`) only.
- **Shared Database**: This Supabase DB is shared with a **Broker CRM/Backoffice**. The web consumes `encargos` (energy certificates) and `price_audit` updated by that side.

## 📋 Commands (npm)
- `npm run dev`: Start local development server.
- `npm run build`: Production build.
- `npm run lint`: Linting with ESLint.
- `npm run translate:perplexity`: Bulk translation script.
- `npm run test`: Run unit tests (Vitest).

## 🗄️ Database Schema Summary (Supabase)
- **`property_metadata`**: 
  - `cod_ofer` (PK), `ref`, `full_data` (JSONB), `descriptions` (JSONB - translations), `photos` (Text[]), `updated_at`.
- **`property_features`**: 
  - `cod_ofer`, `habitaciones`, `banos`, `superficie`. (Used for fast filtering).
- **`encargos`** → se lee vía **`encargos_web_view`** (desde 2026-08-07): 
  - Vista ENMASCARADA, la ÚNICA vía de lectura de encargos para esta web. No incluye NINGUNA columna de dirección (`dir`/`numero`/`cp`/`tipo_via`/`nombre_via`/`bloque`/`escalera`/`puerta` no son ni seleccionables — regla RGPD "la dirección NUNCA en output público", por construcción).
  - **NUNCA** volver a `encargos_public_view` (read-path interno del CRM, SÍ lleva dirección) ni a `encargos` directo (SELECT anon bloqueado desde Phase 0 v2 F.6).
  - `lat_exacta`/`lng_exacta` de la vista SIEMPRE pasan por `getPublicCoords` (jitter) en el server action antes de servir al visitante.
  - Si la web necesita una columna nueva del encargo: añadirla a la vista por migración (repo CRM) + a `ENCARGO_COLUMNS_FOR_WEB` — decisión consciente, no drift.
- **`leads_valuation_v2`**: 
  - Valuation requests from the `/vender` form.
- **`hero_slides`**: 
  - Homepage video/title configuration.
- **`blog`**: 
  - `id`, `slug`, `titles`, `contents` (JSONB translations).
- **`translation_log`**: 
  - Audit trail for AI translation costs and success.
- **`price_audit`**: 
  - History of property price changes.

## 🛠️ Code Conventions
- **Language**: TypeScript (strict).
- **Server Actions**: All DB mutations and external API calls must reside in `src/app/actions`.
- **Components**: Functional components. Use `use client` at the very top only for interactive components.
- **i18n**: Never hardcode strings in components; use `useTranslations()`. All pages translated: Home, Properties, Contact, About/Nosotros, Vender, Blog.
- **Blog**: Admin CRUD via server actions (supabaseAdmin). Tablas: `blog_posts`, `blog_categories`, `blog_tags`. Storage: bucket `blog-images`. Traducciones Gemini. Botón "Generar con IA" enlaza artefacto Claude externo.
- **Next.js 15+ params**: `params` es Promise — siempre `await params` en páginas dinámicas.
- **Naming**: 
  - React Components: PascalCase.
  - Files/Folders: kebab-case.
  - DB Columns: snake_case.
- **API**: Do NOT add direct Inmovilla API calls — the Web API client was removed 2026-04 (the web reads Supabase only).

## 🔐 Authentication
Admin routes are protected via `requireAdmin()` check in Server Actions and Middlewares. The secret is `process.env.ADMIN_PASSWORD`.

## 📍 Important Endpoints
- `/api/sync/cron`: Cron cada 30 min (Vercel Cron Jobs). Step 1: delta sync (nuevas/eliminadas/reactivadas). Step 2: photo refresh (main_photo = NULL). Step 3: auto-translate (Gemini, max 2 propiedades/run, 7s delay).
- `/api/admin/translate-blog`: POST — traduce blog post a 5 idiomas (1 llamada Gemini/idioma, JSON response). maxDuration=300s.
- `/api/admin/sync`: System-wide property synchronization.
- `/api/admin/translations`: Trigger AI translation engine.
- `/admin/sync`: Visual panel for managing data freshness.
- `/api/catastro/provincias`: Provincias (Catastro API + fallback 52 provincias hardcoded).
- `/api/catastro/municipios?provincia=X`: Municipios (Catastro API).
- `/api/catastro/vias`: Callejero autocompletar.
- `/api/catastro/numeros`: Números de portal por calle.
- `/api/catastro/search`: Búsqueda por dirección o RC (POST).
- `/api/catastro/details?ref=RC`: Detalle propiedad por referencia catastral.
- `/api/leads/valuation-v2`: Guardar solicitud de valoración (POST).

## 🏠 Catastro Integration
- **Estrategia búsqueda por dirección**: ObtenerNumerero (callejero) → RC → searchPropertiesByRC (XML).
- **Consulta_DNPLOC (JSON)**: degradado a fallback — devuelve error 43 frecuentemente.
- **Endpoint XML**: `ovc.catastro.meh.es/.../Consulta_DNPRC` — fiable para RCs de 14 y 20 chars.
- **Nombres parciales**: si el nombre completo de calle falla, prueba progresivamente versiones más cortas.
- **Provincias/municipios**: API routes (no server actions) para fiabilidad en client components.

## 🔗 Repository Context
This project is part of a decoupling strategy from Inmovilla's frontend, moving towards a bespoke SaaS solution while maintaining the CRM as the backend source.

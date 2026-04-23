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
- **Inmovilla CRM**: The primary source of property data.
- **Inmovilla Web API**: Integrated via `src/lib/api/web-client.ts`.
- **Relationship**: The project acts as a high-performance, SEO-friendly storefront for Inmovilla. It uses Supabase as a local cache/repository (`property_metadata`) to avoid direct API latency and rate limits.
- **Shared Database**: This Supabase DB is shared with a **Broker CRM/Backoffice**. The web consumes `encargos` (energy certificates) and `price_audit` updated by that side.

## 📋 Commands (npm)
- `npm run dev`: Start local development server.
- `npm run build`: Production build.
- `npm run lint`: Linting with ESLint.
- `npm run sync:manual`: Run manual Inmovilla sync script.
- `npm run translate:perplexity`: Bulk translation script.
- `npm run test`: Run unit tests (Vitest).

## 🗄️ Database Schema Summary (Supabase)
- **`property_metadata`**: 
  - `cod_ofer` (PK), `ref`, `full_data` (JSONB), `descriptions` (JSONB - translations), `photos` (Text[]), `updated_at`.
- **`property_features`**: 
  - `cod_ofer`, `habitaciones`, `banos`, `superficie`. (Used for fast filtering).
- **`encargos`**: 
  - Mandates and Energy Certificates (`edi_clase_energetica`, `edi_consumo_energia`).
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
- **API**: Base Inmovilla logic in `src/lib/api/web-client.ts`. Do not use old `client.ts` (REST API).

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

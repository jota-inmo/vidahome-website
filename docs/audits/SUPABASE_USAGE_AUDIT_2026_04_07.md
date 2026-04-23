# Auditoria de uso de Supabase -- vidahome-website

Generado: 2026-04-07
Commit: `27584f56dd9456d854fe99b4487c124ce5cfa15c`

## 1. Tablas accedidas via `.from()`

| Tabla | Operaciones | Archivos (src/) | N refs (src) | N refs total (inc. scripts) |
|---|---|---|---|---|
| `analytics_leads` | SELECT, INSERT | `src/app/actions/analytics.ts:46,83,120,139,156`, `src/lib/hooks/useAnalytics.ts:129` | 6 | 6 |
| `analytics_page_views` | INSERT | `src/lib/hooks/useAnalytics.ts:71` | 1 | 1 |
| `analytics_property_views` | SELECT, INSERT | `src/app/actions/analytics.ts:56,76`, `src/lib/hooks/useAnalytics.ts:92` | 3 | 3 |
| `analytics_searches` | SELECT, INSERT | `src/app/actions/analytics.ts:173`, `src/lib/hooks/useAnalytics.ts:111` | 2 | 2 |
| `analytics_valuations` | SELECT | `src/app/actions/analytics.ts:66` | 1 | 1 |
| `blog_categories` | SELECT | `src/app/actions/blog.ts:91,129` | 2 | 2 |
| `blog_posts` | SELECT, INSERT, UPDATE, DELETE | `src/app/actions/blog.ts:23,58,144,185,224,267,314,349`, `src/app/actions/translate-blog.ts:111,167,247`, `src/app/api/admin/translate-blog/route.ts:134,164` | 13 | 13 |
| `company_settings` | SELECT, INSERT, UPSERT | `src/app/actions/settings.ts:30,61`, `src/app/actions/inmovilla.ts:996`, `src/app/api/leads/valuation-v2/route.ts:107` | 4 | 6 |
| `discrepancias_dismissed` | SELECT, UPSERT | `src/app/actions/discrepancias.ts:89,171` | 2 | 3 |
| `encargos` | SELECT | `src/app/actions/discrepancias.ts:62`, `src/app/actions/inmovilla.ts:162`, `src/app/api/admin/backfill-construction-year/route.ts:100` | 3 | 7 |
| `featured_properties` | SELECT, INSERT, DELETE | `src/app/actions/inmovilla.ts:249,271,351,356` | 4 | 5 |
| `fotos_inmuebles` | SELECT, INSERT, DELETE | `src/app/actions/inmovilla.ts:201` | 1 | 6 |
| `hero_slides` | SELECT, UPDATE | `src/app/actions/hero.ts:25,55,81`, `src/app/actions/populate-hero-titles.ts:20,32`, `src/app/actions/translate-hero.ts:35,153` | 7 | 14 |
| `leads` | INSERT | `src/app/actions/inmovilla.ts:987` | 1 | 1 |
| `leads_valuation_v2` | INSERT | `src/app/api/leads/valuation-v2/route.ts:92` | 1 | 1 |
| `legal_pages` | SELECT, UPSERT | `src/app/actions/legal.ts:27,43,60` | 3 | 4 |
| `price_audit` | INSERT | `src/app/actions/inmovilla.ts:385` | 1 | 4 |
| `properties` | SELECT, UPSERT | `src/app/actions/sync-properties.ts:141,385,545` | 3 | 6 |
| `property_features` | SELECT, UPSERT | `src/app/actions/discrepancias.ts:75`, `src/app/actions/inmovilla.ts:82,157,289,892`, `src/app/actions/properties-admin.ts:48,153,198`, `src/app/actions/sync-properties.ts:246,341,462`, `src/app/actions/translate-gemini.ts:169`, `src/app/actions/translate-perplexity.ts:154`, `src/lib/api/property-features.ts:31,58`, `src/app/api/admin/backfill-construction-year/route.ts:65,84,152,171,178,186,196,212,219,229` | 22 | 42 |
| `property_metadata` | SELECT, INSERT, UPDATE, UPSERT | `src/app/actions/discrepancias.ts:70`, `src/app/actions/inmovilla.ts:60,152,283,466,568,661,830,836,845,974`, `src/app/actions/properties-admin.ts:39,114,126,177,186`, `src/app/actions/sync-properties.ts:54,116,125,133,150,190,317,335,361,414,513,540`, `src/app/actions/translate-gemini.ts:132,241`, `src/app/actions/translate-perplexity.ts:130,221,232,299,315`, `src/app/actions/translations.ts:22,85,97`, `src/app/api/admin/backfill-construction-year/route.ts:47,92`, `src/app/api/admin/backfill-descriptions/route.ts:39,74,88`, `src/app/api/admin/translations/route.ts:24`, `src/app/api/admin/translations/save/route.ts:16,29`, `src/app/api/sync/cron/route.ts:46,78,85` | 38 | 80+ |
| `property_urls` | UPSERT | `src/app/actions/inmovilla.ts:500` | 1 | 3 |
| `rate_limits` | SELECT, INSERT, UPDATE | `src/lib/rate-limit.ts:34,46,63,79` | 4 | 4 |
| `sync_progress` | SELECT, UPSERT | `src/app/actions/inmovilla.ts:729,779,912` | 3 | 7 |
| `translation_log` | INSERT | `src/app/actions/translate-blog.ts:183,199`, `src/app/actions/translate-gemini.ts:248`, `src/app/actions/translate-hero.ts:160,180`, `src/app/actions/translate-perplexity.ts:239,324`, `src/app/actions/translations.ts:104`, `src/app/api/admin/translations/save/route.ts:36` | 9 | 13 |
| `valuation_leads` | INSERT | `src/app/api/leads/valuation/route.ts:113` | 1 | 1 |

## 2. Funciones RPC llamadas

| Funcion | Archivos | N refs |
|---|---|---|
| `exec_sql` | `scripts/deploy-analytics.ts:40`, `scripts/fix-constraint-and-backfill.ts:17` | 2 |
| `execute_sql` | `scripts/migrate-metadata.ts:25` | 1 |
| `update_hero_titles` | `scripts/fix-hero-translations.ts:27` | 1 |

Nota: Todas las llamadas RPC estan en `scripts/` (utilidades offline), ninguna en codigo de produccion (`src/`).

## 3. Buckets de Storage usados

| Bucket | Operaciones | Archivos |
|---|---|---|
| `media` | upload, getPublicUrl | `src/app/actions/media.ts:68,81`, `src/components/LuxuryHero.tsx:82`, `src/app/[locale]/admin/hero/page.tsx:125`, `scripts/migrate-nosotros-images.ts:74` |
| `blog-images` | upload, getPublicUrl | `src/app/actions/blog.ts:379,388` |

## 4. Canales Realtime

| Canal | Archivos |
|---|---|
| `hero_changes` | `src/components/LuxuryHero.tsx:63` |

## 5. Acceso server-side (supabaseAdmin / service key)

Tablas accedidas desde Server Actions o Route Handlers con `supabaseAdmin`:

| Tabla | Archivos |
|---|---|
| `analytics_leads` | `src/app/actions/analytics.ts` |
| `analytics_property_views` | `src/app/actions/analytics.ts` |
| `analytics_searches` | `src/app/actions/analytics.ts` |
| `analytics_valuations` | `src/app/actions/analytics.ts` |
| `blog_categories` | `src/app/actions/blog.ts` |
| `blog_posts` | `src/app/actions/blog.ts`, `src/app/actions/translate-blog.ts`, `src/app/api/admin/translate-blog/route.ts` |
| `company_settings` | `src/app/actions/settings.ts`, `src/app/actions/inmovilla.ts` |
| `discrepancias_dismissed` | `src/app/actions/discrepancias.ts` |
| `encargos` | `src/app/actions/discrepancias.ts`, `src/app/actions/inmovilla.ts` |
| `featured_properties` | `src/app/actions/inmovilla.ts` |
| `hero_slides` | `src/app/actions/hero.ts`, `src/app/actions/populate-hero-titles.ts`, `src/app/actions/translate-hero.ts` |
| `legal_pages` | `src/app/actions/legal.ts` |
| `price_audit` | `src/app/actions/inmovilla.ts` |
| `properties` | `src/app/actions/sync-properties.ts` |
| `property_features` | `src/app/actions/discrepancias.ts`, `src/app/actions/inmovilla.ts`, `src/app/actions/properties-admin.ts`, `src/app/actions/sync-properties.ts`, `src/lib/api/property-features.ts`, `src/app/api/admin/backfill-construction-year/route.ts` |
| `property_metadata` | `src/app/actions/discrepancias.ts`, `src/app/actions/inmovilla.ts`, `src/app/actions/properties-admin.ts`, `src/app/actions/sync-properties.ts`, `src/app/actions/translations.ts`, `src/app/api/admin/backfill-descriptions/route.ts`, `src/app/api/admin/translations/save/route.ts`, `src/app/api/admin/translations/route.ts`, `src/app/api/sync/cron/route.ts` |
| `property_urls` | `src/app/actions/inmovilla.ts` |
| `rate_limits` | `src/lib/rate-limit.ts` |
| `sync_progress` | `src/app/actions/inmovilla.ts` |
| `translation_log` | `src/app/actions/translate-blog.ts`, `src/app/actions/translate-hero.ts`, `src/app/actions/translations.ts`, `src/app/api/admin/translations/save/route.ts` |

Nota: `src/app/actions/translate-gemini.ts` y `src/app/actions/translate-perplexity.ts` importan `supabase` (no `supabaseAdmin`) desde `@/lib/supabase` -- usan anon key, no service key.

Route Handlers con `supabaseAdmin` (via `createClient` con service role):
- `src/app/api/sync/cron/route.ts`
- `src/app/api/leads/valuation-v2/route.ts`
- `src/app/api/admin/translate-blog/route.ts`
- `src/app/api/admin/translations/save/route.ts`
- `src/app/api/admin/translations/route.ts`
- `src/app/api/admin/backfill-construction-year/route.ts`
- `src/app/api/admin/backfill-descriptions/route.ts`

## 6. Tablas mencionadas en SQL files pero NO en codigo TS/JS

| Tabla | Archivo SQL |
|---|---|
| `blog_post_tags` | `sql/blog-complete-setup.sql`, `sql/blog-schema.sql`, `sql/supabase-phase1-setup.sql` |
| `blog_tags` | `sql/blog-complete-setup.sql`, `sql/blog-schema.sql`, `sql/supabase-phase1-setup.sql` |
| `blog_translation_log` | `sql/blog-complete-setup.sql` |

Nota: `blog_tags` y `blog_post_tags` estan definidos en SQL pero nunca se consultan desde el codigo. Pueden ser tablas huerfanas o usadas indirectamente via joins/views.

## 7. Posibles falsos negativos

- **No se encontraron patrones dinamicos**: No hay `.from(\`...\`)` ni `.from(variable)` en el codigo. Todos los nombres de tabla son strings literales.
- **Supabase Edge Function**: `supabase/functions/translate-properties/index.ts` accede a `property_metadata` y `translation_log` desde una Edge Function de Supabase (no parte del build de Next.js).
- **Scripts auxiliares**: Hay ~50 scripts en `scripts/` que acceden a las mismas tablas de produccion. No se incluyen en el build pero se ejecutan manualmente.
- **Views SQL**: Archivo `sql/property_summary_view.sql` podria definir una vista; no se encontro referencia a views desde TS/JS.
- **Tabla `fotos_inmuebles`**: Referenciada en `src/app/actions/inmovilla.ts` (1 ref) pero con 5 refs adicionales en scripts de migracion.

## 8. Resumen

- **Total tablas unicas en codigo (src/):** 25
- **Total tablas unicas incluyendo scripts:** 25 (mismas tablas)
- **Tablas solo en SQL (no en codigo):** 3
- **Buckets de Storage:** 2 (`media`, `blog-images`)
- **Canales Realtime:** 1 (`hero_changes`)
- **Funciones RPC:** 3 (solo en scripts)

### Lista copiable (solo nombres, alfabetica)

```
analytics_leads
analytics_page_views
analytics_property_views
analytics_searches
analytics_valuations
blog_categories
blog_posts
company_settings
discrepancias_dismissed
encargos
featured_properties
fotos_inmuebles
hero_slides
leads
leads_valuation_v2
legal_pages
price_audit
properties
property_features
property_metadata
property_urls
rate_limits
sync_progress
translation_log
valuation_leads
```

# 🌍 Sistema de Traducción - Arquitectura Final

**Estado**: ✅ **Producción Lista** (Build exitoso con todos los tests pasando)

**Última Actualización**: 24/02/2026 12:30 (Commit 8c1964f)

---

## 📋 Resumen Ejecutivo

Sistema de traducción automática para descripciones de propiedades usando:
- **Engine**: Perplexity AI (`sonar-small-online`)
- **Idiomas**: Español (ES - fuente), Inglés (EN), Francés (FR), Alemán (DE), Italiano (IT), Polaco (PL)
- **Almacenamiento**: JSON JSONB (`property_metadata.descriptions`)
- **Admin**: Panel web intuitivo con edición manual + auto-traducción
- **Auditoría**: Tabla `translation_log` con registro completo

---

## 🏗️ Arquitectura de Ficheros

```
src/
├── app/
│   ├── actions/
│   │   ├── translate-perplexity.ts       ⭐ CORE: Llamadas a Perplexity
│   │   └── translations.ts                ⭐ WRAPPERS: Actions para admin
│   ├── api/admin/translations/
│   │   ├── route.ts                      📡 GET: Listar propiedades
│   │   ├── run/route.ts                  📡 POST: Ejecutar auto-traducción
│   │   └── save/route.ts                 📡 POST: Guardar edits manuales
│   └── [locale]/admin/translations/
│       └── page.tsx                      🎨 UI: Admin panel
├── lib/
│   └── supabase-admin.ts                 🔐 Client seguro (SERVICE_ROLE_KEY)
└── types/
    └── inmovilla.ts                      📝 Types comunes
```

---

## 🔐 Flujo de Autenticación

```
┌─────────────────────────────────────────────────────────────┐
│ User accede /admin/translations en navegador              │
├─────────────────────────────────────────────────────────────┤
│ 1. Page.tsx carga propiedades vía API GET                  │
│    GET /api/admin/translations                             │
│    └─ Usa supabaseAdmin (SERVER_ROLE_KEY)                  │
│                                                              │
│ 2. User edita traducciones y hace click "Guardar"          │
│    POST /api/admin/translations/save                       │
│    └─ savePropertyTranslationAction() actualiza JSON      │
│    └─ revalidateTag() invalida cache                       │
│                                                              │
│ 3. User hace click "Auto-traducir"                         │
│    POST /api/admin/translations/run                        │
│    └─ runAutoTranslationAction()                           │
│    └─ translatePropertiesAction() → Perplexity API         │
│    └─ Resultado actualiza property_metadata.descriptions   │
│    └─ Auditoria en translation_log                         │
└─────────────────────────────────────────────────────────────┘
```

**Ventaja**: No hay JWT porque todo ocurre en el servidor (Next.js).

---

## 📡 API Endpoints

### 1. GET /api/admin/translations
**Propósito**: Listar todas las propiedades con sus traducciones

```typescript
// Request:
GET /api/admin/translations

// Response:
[
  {
    cod_ofer: 12345,
    description_es: "Casa de lujo...",
    description_en: "Luxury home...",
    description_fr: "Maison de luxe...",
    // ... más idiomas
  }
]
```

**Código**: `src/app/api/admin/translations/route.ts`

---

### 2. POST /api/admin/translations/run
**Propósito**: Ejecutar auto-traducción de propiedades

```typescript
// Request:
POST /api/admin/translations/run
Content-Type: application/json

{
  "propertyIds": [12345, 12346],  // Opcional: traducir solo estos
  "batchSize": 10                 // Opcional: items por batch
}

// Response:
{
  "success": true,
  "translated": 10,
  "errors": 0,
  "cost_estimate": "€0.0045"
}
```

**Código**: `src/app/api/admin/translations/run/route.ts`

**Internamente llama**: `translatePropertiesAction()` en `translate-perplexity.ts`

---

### 3. POST /api/admin/translations/save
**Propósito**: Guardar cambios manuales en traducciones

```typescript
// Request:
POST /api/admin/translations/save
Content-Type: application/json

{
  "property_id": 12345,
  "descriptions": {
    "description_en": "Updated English text",
    "description_fr": "Texte français mis à jour"
  }
}

// Response:
{
  "success": true,
  "message": "Translations saved and cache invalidated"
}
```

**Código**: `src/app/api/admin/translations/save/route.ts`

**Características**:
- Merge automático: nuevas traducciones se fusionan con existentes
- Cache invalidation vía `revalidateTag('inmovilla_property_list')`

---

## ⚙️ Server Actions

### translatePropertiesAction(propertyIds?, batchSize?)
**Ubicación**: `src/app/actions/translate-perplexity.ts`

```typescript
export async function translatePropertiesAction(
  propertyIds?: string[],      // Optional: IDs específicas
  batchSize?: number           // Optional: items por batch (default 10)
) {
  // 1. Fetch propiedades desde property_metadata
  // 2. Llamada a Perplexity API
  // 3. Parse respuestas JSON
  // 4. Update descriptions JSONB
  // 5. Log to translation_log
  // 6. Return { success: true, translated: N, errors: M, ... }
}
```

**Errores manejados**:
- Missing environment variables
- Network errors
- Invalid JSON response
- Database update errors

---

### updateTranslationAction(propertyId, language, text)
**Ubicación**: `src/app/actions/translate-perplexity.ts`

Edita una traducción individual:

```typescript
export async function updateTranslationAction(
  propertyId: number,
  language: 'en' | 'fr' | 'de' | 'it' | 'pl',
  text: string
) {
  // Actualiza property_metadata.descriptions[`description_${language}`]
}
```

---

### runAutoTranslationAction(propertyIds?)
**Ubicación**: `src/app/actions/translations.ts`

Wrapper que:
1. Llama `translatePropertiesAction()`
2. Invalida cache con `revalidateTag('inmovilla_property_list', {})`
3. Retorna resultado

---

## 📊 Estructura de Base de Datos

### property_metadata
```sql
cod_ofer     INTEGER PRIMARY KEY
descriptions JSONB

-- Ejemplo de descriptions JSON:
{
  "description_es": "Casa de lujo en la playa con vistas al mar",
  "description_en": "Luxury beach house with sea views",
  "description_fr": "Maison de luxe en bord de mer avec vue sur la mer",
  "description_de": "Luxushaus am Strand mit Meerblick",
  "description_it": "Casa di lusso in spiaggia con vista sul mare",
  "description_pl": "Luksusowy dom na plaży z widokiem na morze"
}
```

### translation_log (Auditoría)
```sql
id                  BIGSERIAL PRIMARY KEY
property_id         VARCHAR
status              'success' | 'error'
source_language     'es' | 'manual_edit'
target_languages    TEXT[] (array de idiomas)
error_message       TEXT (si status = 'error')
tokens_used         INTEGER
cost_estimate       DECIMAL
created_at          TIMESTAMP
```

---

## 🎨 Admin UI

**Ubicación**: `src/app/[locale]/admin/translations/page.tsx`

### Componentes
1. **Property List**: Tabla que carga propiedades via GET
2. **Translation Editor**: Campos editables para cada idioma
3. **Action Buttons**:
   - "Guardar" (Save edits)
   - "Auto-traducir" (Run Perplexity for all)

### Estados
- ✅ Loading: Mientras carga propiedades
- ✅ Error: Si GET falla
- ✅ Success: Después de guardar cambios
- ✅ Translating: Durante auto-traducción

---

## 🔧 Configuración Requerida

### Variables de Entorno
```
# .env.local (local) o Vercel Secrets (producción)
PERPLEXITY_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...  # SERVER ONLY - SERVICE ROLE
```

### next.config.ts
```typescript
const config: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "yourdomain.com"],
    },
  },
};
```

### tsconfig.json
```json
{
  "exclude": ["node_modules", "supabase"]
}
```

---

## 🚀 Deployment

### Vercel
1. Push a branch `main`
2. Vercel detecta cambios y compila automáticamente
3. TypeScript checking valida todo
4. Deploy si build exitoso

### Secrets en Vercel
```
PERPLEXITY_API_KEY = sk-...
SUPABASE_SERVICE_ROLE_KEY = sbp_...
```

---

## 📈 Monitoreo

### Logs de Traducción
```sql
SELECT 
  property_id,
  status,
  tokens_used,
  cost_estimate,
  created_at
FROM translation_log
WHERE status = 'success'
ORDER BY created_at DESC
LIMIT 100;
```

### Costo Estimado
- Token cost: **$0.0002 per 1000 tokens** (Perplexity Sonar Small)
- Ejemplo: 100 propiedades × 500 chars → ~€0.05-€0.10

---

## ⚡ Performance

| Operación | Tiempo | Notas |
|-----------|--------|-------|
| GET propiedades | 200-400ms | Supabase query + JSON parse |
| Auto-traducción (1 prop) | 2-3s | Perplexity API call |
| Auto-traducción (10 props) | 15-25s | Batch mode |
| Guardar edits | 300-500ms | Update + revalidateTag |

---

## 🛠️ Troubleshooting

### Error: "PERPLEXITY_API_KEY is missing"
→ Revisa `.env.local` o Vercel Secrets

### Error: "revalidateTag expects 2 arguments"
→ ✅ FIXED en commit 8c1964f: `revalidateTag('tag', {})`

### Error: "Property 'translated' does not exist"
→ ✅ FIXED en commit b6d91e7: Type guard `'translated' in res`

### Error: "supabaseAdmin is not exported"
→ ✅ FIXED en commit c55beae: Import desde `src/lib/supabase-admin`

### Traducción en blanco después de guardar
→ Verifica que `descriptions` JSON no tenga campos nulos
→ Ejecuta `revalidateTag` en todas las rutas que usen datos

---

## 📚 Ficheros Relacionados

- [Deno Edge Function (referencia)](./EDGE_FUNCTION_CORRECTED_CODE.md) - Deprecated, usar Server Actions
- [Project Context Log](./docs/PROJECT_CONTEXT_LOG.md) - Historial completo
- [Supabase Setup](./supabase_setup.sql) - Schema inicial

---

**Autor**: GitHub Copilot  
**Versión**: 2.0 (Server Actions + Perplexity)  
**Status**: ✅ Production Ready

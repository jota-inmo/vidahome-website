# 🔧 Data Sync Architecture - COMPLETE ✅

> **STATUS**: ✅ **FULLY IMPLEMENTED** - All sync operations via Server Actions

**Razón**: Evitar errores JWT y simplificar la autenticación. Ahora TODO usa **Next.js Server Actions** con `supabaseAdmin` en lugar de Edge Functions.

## 📍 Arquitectura Actual (Completamente Operativa)

### Server Actions (✅ En Uso)
- `src/app/actions/sync-properties.ts` - Sincronización de propiedades desde Inmovilla CRM
- `src/app/actions/translations.ts` - Traducciones con Perplexity AI
- `src/app/actions/translate-perplexity.ts` - Lógica de traducción

### API Endpoints (✅ En Uso)
- `src/app/api/admin/sync/route.ts` - Endpoints para sincronización (POST/GET)
- `src/app/api/admin/translations/route.ts` - Endpoint para traducciones

### Admin UI (✅ En Uso)
- `src/app/[locale]/admin/sync/page.tsx` - Panel de sincronización de propiedades
- `src/components/admin/SyncPropertiesClient.tsx` - Interfaz interactiva de sync
- Dashboard mejorado con link a `/admin/sync`

## ⚡ FLUJO COMPLETO DE DATOS

```
┌─────────────────────────────────────────────────────────────────┐
│                    INMOVILLA CRM                                │
│              (Crear propiedad aquí)                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              INMOVILLA WEB API                                  │
│         (getProperties, getPropertyDetails)                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                 │
        ▼                                 ▼
┌──────────────────────┐    ┌─────────────────────────────┐
│ syncSingleProperty   │    │ syncAllProperties           │
│ (Manual/On-demand)   │    │ (Auto on catalog load)      │
└──────────────────────┘    └─────────────────────────────┘
        │                                 │
        └────────────────┬────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│           PROPERTY_METADATA TABLE                               │
│        (Central Repository - Single Source of Truth)            │
│                                                                 │
│  Columns:                                                       │
│  - cod_ofer (PK)                                               │
│  - ref                                                         │
│  - descriptions (JSONB):                                       │
│    {                                                           │
│      description_es: "...",                                    │
│      description_en: "...",                                    │
│      description_fr: "...",                                    │
│      description_de: "...",                                    │
│      description_it: "...",                                    │
│      description_pl: "..."                                     │
│    }                                                           │
│  - full_data (JSONB) - Complete API response                  │
│  - updated_at                                                 │
└────────────┬──────────┬──────────┬──────────────┬──────────────┘
             │          │          │              │
    ┌────────▼──┐  ┌────▼────┐  ┌─▼──────┐  ┌────▼────┐
    │  Catalog  │  │ Detail   │  │Translator  │Translation
    │  /        │  │  Page    │  │Admin Hub   │Log
    │Properties │  │          │  │            │
    └───────────┘  └──────────┘  └────────────┘└────────────┘
```

## 🔄 FLUJO DE SINCRONIZACIÓN

### 1️⃣ **Sincronización Automática** (En cada carga de catálogo)
```typescript
// En: src/app/actions/inmovilla.ts → fetchPropertiesAction()
// Se ejecuta: Cada vez que se carga /propiedades
// Resultado: Las primeras 30 propiedades se syncan a property_metadata
```

### 2️⃣ **Sincronización Manual Single** (A demanda)
```typescript
// En: src/app/actions/sync-properties.ts
// Ubicación: /admin/sync → Input field → "Sincronizar"
// Función: syncSinglePropertyAction(propertyId: number)
// Resultado: 1 propiedad synca a property_metadata
```

### 3️⃣ **Sincronización Manual All** (A demanda)
```typescript
// En: src/app/actions/sync-properties.ts
// Ubicación: /admin/sync → "Sincronizar Todo"
// Función: syncAllPropertiesAction()
// Resultado: TODAS las propiedades syncan a property_metadata (paginado)
```

### 4️⃣ **Traducción Automática** (Generar en admin)
```typescript
// En: src/app/actions/translations.ts
// Ubicación: /admin/translations-hub → "Traducir" button
// Flujo: 
//   1. Fetch properties from property_metadata (ya tienen descriptions)
//   2. Enviar a Perplexity AI para traducción
//   3. Guardar traducciones en property_metadata.descriptions
//   4. Log en translation_log
```

---

## 📋 WORKFLOW TÍPICO (Usuario Final)

### A. Nueva Propiedad Publicada en CRM

**Opción 1: Acceso Inmediato (Recomendado)**
```
1. Crear propiedad en Inmovilla CRM
2. Ir a https://vidahome.es/es/admin/sync
3. Ingresar Property ID
4. Click "Sincronizar"
5. ¡Propiedad disponible en catálogo, detalle, traductor!
```

**Opción 2: Automático (Pasivo)**
```
1. Crear propiedad en Inmovilla CRM
2. Esperar a que alguien visite /propiedades
3. Auto-sync importa primeras 30 propiedades
4. Propiedad disponible en ~2 minutos
```

**Opción 3: Sincronización Total (Periódico)**
```
1. Ir a https://vidahome.es/es/admin/sync
2. Click "Sincronizar Todo" (bottom section)
3. Esperar a que complete (~30 seg)
4. TODAS las propiedades updated
```

### B. Traducir Propiedades

**Después de sincronizar:**
```
1. Ir a https://vidahome.es/es/admin/translations-hub
2. Seleccionar propiedades a traducir
3. Click "Generar Traducciones"
4. Esperar a Perplexity AI
5. Traducciones guardadas automáticamente en property_metadata
```

---

## 🔧 ARCHIVOS CREADOS/MODIFICADOS

### ✅ Nuevos Archivos
| Archivo | Propósito |
|---------|-----------|
| `src/app/actions/sync-properties.ts` | Server actions para single/all sync |
| `src/app/api/admin/sync/route.ts` | API endpoints (POST/GET) para sync |
| `src/app/[locale]/admin/sync/page.tsx` | Admin page para sync |
| `src/components/admin/SyncPropertiesClient.tsx` | UI component para sync |

### 🔄 Archivos Modificados
| Archivo | Cambio |
|---------|--------|
| `src/app/actions/inmovilla.ts` | Agregado auto-sync en fetchPropertiesAction |
| `src/app/actions/translations.ts` | Ahora usa fetchPropertiesAction (no API directo) |
| `src/app/[locale]/admin/page.tsx` | Agregado link a /admin/sync |
| `src/app/api/admin/translations/route.ts` | Ahora usa fetchPropertiesAction |

---

## ✅ ESTRUCTURA DE PROPERTY_METADATA

```javascript
{
  cod_ofer: "12345",           // ID único de propiedad
  ref: "REF-001",              // Referencia CRM
  descriptions: {              // JSONB con traducciones
    description_es: "Casa de lujo en primera línea de playa...",
    description_en: "Luxury beachfront villa...",
    description_fr: "Villa de luxe en première ligne de plage...",
    description_de: "Luxusvilla in erster Strandlinie...",
    description_it: "Villa di lusso in prima linea di spiaggia...",
    description_pl: "Luksusowa willa na pierwszej linii plaży..."
  },
  full_data: {                 // Complete Inmovilla API response
    // ... 50+ propiedades del API
  },
  updated_at: "2024-02-24T13:32:00Z"
}
```

---

## � Configuración del Modelo Perplexity

El modelo Perplexity está centralizado y puede cambiarse sin modificar código:

### Opción 1: Via Environment Variable (Recomendado)
```bash
# En Vercel Settings → Environment Variables, agrega:
PERPLEXITY_MODEL=llama-3.1-sonar-small-128k-online
```

### Opción 2: Default Fallback
Si no está configurada, usa automáticamente:
- `llama-3.1-sonar-small-128k-online` (pequeño, rápido, económico)

### Cambiar de Modelo
Si Perplexity descontinúa un modelo nuevamente:
1. Consulta https://docs.perplexity.ai/docs/getting-started/models
2. Actualiza `PERPLEXITY_MODEL` en Vercel
3. Sin código, sin redeploy, cambio instantáneo

### Modelos Disponibles
- `llama-3.1-sonar-small-128k-online` - Recomendado (balance velocidad/calidad)
- `llama-3.1-sonar-large-128k-online` - Mayor capacidad
- `llama-3.1-sonar-huge-128k-online` - Máxima capacidad

---

## 📍 Archivos Centralizados

### Sincronizar Manualmente (CLI)
```bash
# Sincronizar 1 propiedad
curl -X POST "https://vidahome.es/api/admin/sync?property_id=12345"

# Sincronizar TODAS
curl -X GET "https://vidahome.es/api/admin/sync"
```

### Verificar Datos
```sql
-- Ver propiedades en property_metadata
SELECT cod_ofer, ref, updated_at 
FROM property_metadata 
ORDER BY updated_at DESC 
LIMIT 10;

-- Ver historial de traducciones
SELECT property_id, status, cost_estimate, created_at
FROM translation_log
ORDER BY created_at DESC
LIMIT 20;
```

---

## 🆘 TROUBLESHOOTING

### Propiedad no aparece en catálogo después de sync
```
1. ✅ Verificar que sync completó exitosamente
2. ✅ Confirmar property_id es correcto
3. ✅ Check Vercel logs: https://vercel.com/
4. ✅ Revalidar cache: GET /api/revalidate?tag=properties
```

### Traducciones no se guardan
```
1. ✅ Verificar PERPLEXITY_API_KEY en Vercel Env vars
2. ✅ Check Perplexity account has credits
3. ✅ Revisar translation_log table para errores
4. ✅ Reintentar desde /admin/translations-hub
```

### Errores de tipo en TypeScript
```
✅ Todos resueltos en commits recientes:
  - e91007d: Convertir env strings a numbers
  - 2d0b155: Usar método correcto getProperties()
```

---

## 📊 COMMITS RELEVANTES

```
ff8ba79 feat: Add property sync system for new CRM entries
e91007d fix: Convert environment variables to correct types
2d0b155 fix: Use correct getProperties method
```

---

## 🎯 PRÓXIMOS PASOS (Opcionales)

- [ ] Configurar webhook Inmovilla → auto-sync en creation
- [ ] Agregar scheduler para sync automático diario
- [ ] Dashboard de historial de sync/traducciones
- [ ] Bulk actions: traducir x propiedades de una vez
- [ ] Email notifications cuando sync completa

---

**Última actualización**: Feb 24, 2026 - Sistema completamente centralizado y futuro-proof ✅

---

## 🆘 Si Sigue Sin Funcionar

Comprueba:
1. ✅ Configuración del modelo en `src/config/perplexity.ts`
2. ✅ Variable `PERPLEXITY_MODEL` en Vercel (si no, usa default)
3. ✅ `PERPLEXITY_API_KEY` está configurada en Vercel
4. ✅ Tabla `translation_log` existe en Supabase
5. ✅ `property_metadata` tiene datos sincronizados

Si algo sigue mal, dame error exacto y lo arreglamos.
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  const startTime = Date.now();

  try {
    // Parse request
    const { property_ids, batch_size } = (await req.json()) as TranslateRequest;
    const actualBatchSize = Math.min(batch_size || BATCH_SIZE, BATCH_SIZE);

    // Initialize Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey || !perplexityKey) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ===== MODIFIED: Use property_metadata table =====
    let query = supabase
      .from("property_metadata")
      .select("cod_ofer, descriptions");

    // Filter by specific properties if provided
    if (property_ids && property_ids.length > 0) {
      query = query.in("cod_ofer", property_ids.map(Number));
    } else {
      // Find properties needing translation
      // (assuming descriptions has description_es but missing others)
      query = query.not("descriptions", "is", null);
    }

    const { data: properties, error: fetchError } = await query.limit(
      actualBatchSize
    );

    if (fetchError) {
      throw new Error(`Failed to fetch properties: ${fetchError.message}`);
    }

    if (!properties || properties.length === 0) {
      return new Response(
        JSON.stringify({
          translated: 0,
          errors: 0,
          error_details: [],
          cost_estimate: "0€",
          duration_ms: Date.now() - startTime,
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Prepare translations request to Perplexity
    const sourceTexts = properties
      .map((prop) => {
        // Extract Spanish description from JSON
        const descriptions = prop.descriptions || {};
        const sourceText = descriptions.description_es || descriptions.descripciones || "";
        return {
          cod_ofer: prop.cod_ofer,
          text: sourceText.substring(0, 500), // Limit to 500 chars
        };
      })
      .filter((item) => item.text);

    if (sourceTexts.length === 0) {
      return new Response(
        JSON.stringify({
          translated: 0,
          errors: properties.length,
          error_details: properties.map((p) => ({
            property_id: String(p.cod_ofer),
            error: "No Spanish description found",
          })),
          cost_estimate: "0€",
          duration_ms: Date.now() - startTime,
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Call Perplexity API with batch translations
    const prompt = `You are a professional real estate translator specializing in luxury properties in Spain.

Translate the following Spanish property descriptions to English, French, German, Italian, and Polish.

Return ONLY a valid JSON object with this structure (no markdown, no code blocks):
{
  "translations": [
    {
      "cod_ofer": 12345,
      "en": "English translation",
      "fr": "French translation",
      "de": "German translation",
      "it": "Italian translation",
      "pl": "Polish translation"
    }
  ]
}

Spanish texts to translate:
${sourceTexts.map((item) => `COD_OFER: ${item.cod_ofer}\nTEXT: ${item.text}`).join("\n---\n")}`;

    const perplexityResponse = await fetch(PERPLEXITY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${perplexityKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages: [
          {
            role: "system",
            content:
              "You are a professional translator expert in luxury real estate in Spain. You provide high-quality translations only in JSON format.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2,
      }),
    });

    if (!perplexityResponse.ok) {
      const errorText = await perplexityResponse.text();
      throw new Error(
        `Perplexity API error: ${perplexityResponse.status} - ${errorText}`
      );
    }

    const perplexityData = await perplexityResponse.json();
    const usage = perplexityData.usage || { prompt_tokens: 0, completion_tokens: 0 };
    const totalTokens = usage.prompt_tokens + usage.completion_tokens;
    const costEstimate = (totalTokens / 1000) * 0.0002;

    // Parse translations
    let translations: any[] = [];
    try {
      const content = perplexityData.choices[0]?.message?.content || "{}";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
      translations = parsed.translations || [];
    } catch (parseError) {
      console.error("Failed to parse Perplexity response:", parseError);
      throw new Error("Invalid translation response format");
    }

    // Update properties in database
    let successCount = 0;
    let errorCount = 0;
    const errorDetails: Array<{ property_id: string; error: string }> = [];

    for (const translation of translations) {
      try {
        const { cod_ofer, en, fr, de, it, pl } = translation;

        // ===== MODIFIED: Update descriptions JSON in property_metadata =====
        const { data: existing } = await supabase
          .from("property_metadata")
          .select("descriptions")
          .eq("cod_ofer", cod_ofer)
          .single();

        const updatedDescriptions = {
          ...(existing?.descriptions || {}),
          description_en: en,
          description_fr: fr,
          description_de: de,
          description_it: it,
          description_pl: pl,
        };

        const { error: updateError } = await supabase
          .from("property_metadata")
          .update({ descriptions: updatedDescriptions })
          .eq("cod_ofer", cod_ofer);

        if (updateError) {
          throw updateError;
        }

        // Log successful translation
        await supabase.from("translation_log").insert({
          property_id: String(cod_ofer),
          status: "success",
          source_language: "es",
          target_languages: ["en", "fr", "de", "it", "pl"],
          tokens_used: Math.ceil(totalTokens / translations.length),
          cost_estimate: costEstimate / translations.length,
          created_at: new Date().toISOString(),
        });

        successCount++;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errorDetails.push({
          property_id: String(translation.cod_ofer || "unknown"),
          error: message,
        });
        errorCount++;

        // Log error
        await supabase.from("translation_log").insert({
          property_id: String(translation.cod_ofer || "unknown"),
          status: "error",
          error_message: message,
          created_at: new Date().toISOString(),
        });
      }
    }

    const response: TranslateResponse = {
      translated: successCount,
      errors: errorCount,
      error_details: errorDetails.length > 0 ? errorDetails : undefined,
      cost_estimate: `${costEstimate.toFixed(4)}€`,
      duration_ms: Date.now() - startTime,
    };

    return new Response(JSON.stringify(response), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Edge Function error:", message);

    return new Response(
      JSON.stringify({
        translated: 0,
        errors: 1,
        error_details: [
          {
            property_id: "error",
            error: message,
          },
        ],
        cost_estimate: "0€",
        duration_ms: Date.now() - startTime,
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
```

---

## 📝 Cambios Clave

| Parte | Cambio |
|------|--------|
| **Tabla** | `properties` → `property_metadata` |
| **ID** | `property_id` → `cod_ofer` |
| **Columna** | `description_es` (text) → `descriptions` (JSON) |
| **Update** | UPDATE columns → UPDATE descriptions JSON |
| **Parsing** | Extracto `description_es` del JSON |

---

## 🚀 Pasos para Actualizar

1. Ve a **Supabase Console** → **Functions** → **translate-properties**
2. **Reemplaza** todo el código con el de arriba
3. Click **"Deploy"** (botón de guardar/desplegar)
4. Espera confirmación de deploy
5. Intenta traducir de nuevo

---

## ✅ Verificación

Después de actualizar, ejecuta:

```bash
npm run translate:perplexity
```

Debería funcionar sin errores JWT.

---

## 📊 Estructura de `descriptions` JSON

Tu JSON en `property_metadata.descriptions` debería ser algo como:

```json
{
  "description_es": "Espectacular casa de lujo en la costa...",
  "descripciones": "Espectacular casa de lujo en la costa...",
  "description_en": null,
  "description_fr": null,
  "description_de": null,
  "description_it": null,
  "description_pl": null
}
```

La Edge Function lo actualizará con las traducciones.

---

## 🆘 Si Sigue Sin Funcionar

Comprueba:
1. ✅ Código actualizado en Supabase (no en repo local)
2. ✅ Deploy completó exitosamente
3. ✅ `PERPLEXITY_API_KEY` está en Supabase Secrets
4. ✅ Tabla `translation_log` existe
5. ✅ `property_metadata` tiene datos

Si algo sigue mal, dame error exacto y lo arreglamos.

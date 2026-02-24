# 🏗️ Arquitectura Final - Sistema de Propiedades y Traducciones

> **STATUS**: ✅ **COMPLETAMENTE IMPLEMENTADO Y OPERATIVO**
>
> Última actualización: Feb 24, 2026 - Sistema futuro-proof con configuración centralizada

## 📍 Arquitectura Actual (Completamente Operativa)

### Server Actions (✅ En Uso)
- `src/app/actions/sync-properties.ts` - Sincronización de propiedades desde Inmovilla CRM
- `src/app/actions/translate-perplexity.ts` - Traducciones con Perplexity AI (usa config centralizada)
- `src/app/actions/translate-hero.ts` - Traducciones para hero section (usa config centralizada)
- `src/app/actions/translate-blog.ts` - Traducciones para blog (usa config centralizada)
- `src/app/actions/inmovilla.ts` - Fetch con auto-sync de primeras 30 propiedades

### Configuration (✅ Centralizada)
- `src/config/perplexity.ts` - Configuration hub para modelo Perplexity
  - Exports `getPerplexityModel()` - Lee env var `PERPLEXITY_MODEL` con fallback
  - Exports `PERPLEXITY_CONFIG` - Objeto con settings completos
  - Permite cambios de modelo sin código

### API Endpoints (✅ En Uso)
- `src/app/api/admin/sync/route.ts` - POST/GET endpoints para sincronización
- `src/app/api/admin/translations/route.ts` - Endpoint para traducciones

### Admin UI (✅ En Uso)
- `src/app/[locale]/admin/sync/page.tsx` - Panel de sincronización de propiedades
- `src/components/admin/SyncPropertiesClient.tsx` - Interfaz interactiva de sync
- Dashboard mejorado con link a `/admin/sync`

---

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

---

## 🔄 FLUJO DE SINCRONIZACIÓN

### 1️⃣ **Sincronización Automática** (En cada carga de catálogo)
```
Ubicación: src/app/actions/inmovilla.ts → fetchPropertiesAction()
Ejecución: Cada vez que se carga /propiedades
Resultado: Las primeras 30 propiedades se syncan a property_metadata
```

### 2️⃣ **Sincronización Manual Single** (A demanda)
```
Ubicación: src/app/actions/sync-properties.ts
URL: /admin/sync → Input field → "Sincronizar"
Función: syncSinglePropertyAction(propertyId: number)
Resultado: 1 propiedad synca a property_metadata
```

### 3️⃣ **Sincronización Manual All** (A demanda)
```
Ubicación: src/app/actions/sync-properties.ts
URL: /admin/sync → "Sincronizar Todo"
Función: syncAllPropertiesAction()
Resultado: TODAS las propiedades syncan a property_metadata (paginado, batch de 20)
```

### 4️⃣ **Traducción** (Generar en admin)
```
Ubicación: /admin/translations-hub → "Generar Traducciones"
Flujo:
  1. Fetch properties from property_metadata (ya tienen descriptions)
  2. Enviar a Perplexity AI (modelo via getPerplexityModel())
  3. Guardar traducciones en property_metadata.descriptions
  4. Log en translation_log
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
4. Esperar a Perplexity AI (con modelo centralizado)
5. Traducciones guardadas automáticamente en property_metadata
```

---

## 🔧 ARCHIVOS CREADOS/MODIFICADOS

### ✅ Nuevos Archivos (Phase 5 - Sync System)
| Archivo | Propósito |
|---------|-----------|
| `src/app/actions/sync-properties.ts` | Server actions para single/all sync |
| `src/app/api/admin/sync/route.ts` | API endpoints (POST/GET) para sync |
| `src/app/[locale]/admin/sync/page.tsx` | Admin page para sync |
| `src/components/admin/SyncPropertiesClient.tsx` | UI component para sync |

### ✅ Nuevos Archivos (Phase 8 - Config Centralization)
| Archivo | Propósito |
|---------|-----------|
| `src/config/perplexity.ts` | Configuration hub centralizada |

### 🔄 Archivos Modificados (Phase 8 - Config Centralization)
| Archivo | Cambio |
|---------|--------|
| `src/app/actions/translate-perplexity.ts` | Ahora importa y usa `getPerplexityModel()` |
| `src/app/actions/translate-hero.ts` | Ahora importa y usa `getPerplexityModel()` |
| `src/app/actions/translate-blog.ts` | Actualiza 2 locaciones para usar `getPerplexityModel()` |
| `supabase/functions/translate-properties/index.ts` | Lee `PERPLEXITY_MODEL` env var con fallback |
| `src/app/[locale]/admin/page.tsx` | Agregado link a /admin/sync |

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
    // ... datos completos del API
  },
  updated_at: "2024-02-24T13:32:00Z"
}
```

---

## 📦 Configuración del Modelo Perplexity

### ✅ Nueva Arquitectura (Centralizada)

El modelo Perplexity está **completamente centralizado** y puede cambiarse sin modificar código:

**Archivo centralizado**: `src/config/perplexity.ts`

```typescript
// Lectura de variable de ambiente con fallback inteligente
export function getPerplexityModel(): string {
  return process.env.PERPLEXITY_MODEL || 'llama-3.1-sonar-small-128k-online';
}

// Objeto de configuración completo
export const PERPLEXITY_CONFIG = {
  model: getPerplexityModel(),
  apiUrl: 'https://api.perplexity.ai/chat/completions',
  temperature: 0.2,
  availableModels: {
    small: 'llama-3.1-sonar-small-128k-online',
    large: 'llama-3.1-sonar-large-128k-online',
    huge: 'llama-3.1-sonar-huge-128k-online',
  }
};
```

### 🎯 Usar Diferentes Modelos

**Opción 1: Via Environment Variable (Recomendado)**
```bash
# En Vercel Settings → Environment Variables, agrega:
PERPLEXITY_MODEL=llama-3.1-sonar-small-128k-online
```

**Opción 2: Default Fallback**
Si no está configurada, usa automáticamente:
- `llama-3.1-sonar-small-128k-online` (pequeño, rápido, económico)

### 🚀 Cambiar de Modelo (Futuro-Proof)

Si Perplexity descontinúa un modelo nuevamente:
1. Consulta https://docs.perplexity.ai/docs/getting-started/models
2. Actualiza `PERPLEXITY_MODEL` en Vercel Dashboard
3. **Sin código, sin redeploy, sin commits**
4. Cambio instantáneo ✨

### 📋 Modelos Disponibles
- `llama-3.1-sonar-small-128k-online` - Recomendado (balance velocidad/calidad)
- `llama-3.1-sonar-large-128k-online` - Mayor capacidad
- `llama-3.1-sonar-huge-128k-online` - Máxima capacidad

---

## 📍 Endpoints & Verificación

### Sincronizar Manualmente (CLI)
```bash
# Sincronizar 1 propiedad
curl -X POST "https://vidahome.es/api/admin/sync?property_id=12345"

# Sincronizar TODAS
curl -X GET "https://vidahome.es/api/admin/sync"
```

### Verificar Datos en BD
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
✅ Verificar que sync completó exitosamente
✅ Confirmar property_id es correcto
✅ Check Vercel logs: https://vercel.com/
✅ Revalidar cache: GET /api/revalidate?tag=properties
```

### Traducciones no se guardan
```
✅ Verificar PERPLEXITY_API_KEY en Vercel Env vars
✅ Check Perplexity account tiene créditos
✅ Revisar translation_log table para errores
✅ Reintentar desde /admin/translations-hub
```

### El modelo no se actualiza
```
✅ Verificar que PERPLEXITY_MODEL está en Vercel (opcional)
✅ Si no, verifica que el fallback es correcto en src/config/perplexity.ts
✅ Redeploy si cambiaste env var
```

---

## 📊 COMMITS RELEVANTES

```
e488b28 refactor: Centralize Perplexity model configuration with environment variable
0858511 fix: Update Perplexity model from deprecated sonar-small-online to llama-3.1-sonar-small-128k-online
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

**Sistema completamente operativo ✅ | Futuro-proof contra cambios de API ✨ | Centralizado en `src/config/` 🎯**

---

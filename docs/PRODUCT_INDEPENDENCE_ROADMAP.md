# Product Independence Roadmap: Prescindir de Inmovilla (6-8 meses)

⚠️ **NOTA IMPORTANTE**: Este documento es una **estrategia a LARGO PLAZO (6-8 meses)**. 

**PRIORIDAD ACTUAL (Feb 2026)**: Completar sincronización de 77 propiedades en vidahome-website y asegurar estabilidad de catálogo público. Este roadmap entra en fase de implementación UNA VEZ la web esté 100% estable y todas las propiedades sincronizadas.

---

**Objetivo**: Migrar de arquitectura dependiente de Inmovilla CRM a sistema autónomo con Supabase como fuente única, agregando capacidad de publicación multi-portal (Idealista, Fotocasa).

**Estado Actual** (2026-02-25):
- ✅ 18/77 propiedades sincronizadas desde Inmovilla
- ✅ Supabase Pro tier + Storage disponible
- ✅ vidahome-encargo (gestor interno) y vidahome-website (catálogo público) **comparten BD**
- ✅ Infraestructura de fotos lista (actualmente URLs de `fotos15.inmovilla.com`)

---

## **FASE 1: Infraestructura Base (Semanas 1-4)**

### 1.1 Upgrade y Configuración Supabase
```
Status: ⏳ PENDING
Effort: ~4 horas

Tasks:
□ Upgrade Supabase Free → Pro ($10/mes)
  ├─ Razón: Storage 100GB, Edge Functions, rate limits generosos
  └─ Auto-renew? Sí (presupuesto mensual de agencia)

□ Crear bucket "property-images" en Storage
  ├─ Estructura: /properties/{cod_ofer}/original/{timestamp}-{filename}
  ├─ Configurar CORS para vidahome-website.vercel.app
  └─ RLS policy: Public READ, Service Role WRITE

□ Crear bucket "property-documents" en Storage
  ├─ Estructura: /properties/{cod_ofer}/documents/{type}/{filename}
  │  ├─ type: "contract", "certificate", "energy_rating", etc
  ├─ RLS policy: Private (solo admin + specific policies)
```

### 1.2 Expansión de Schema `property_metadata`
```sql
Status: ⏳ PENDING
Effort: ~2 horas

ALTER TABLE property_metadata ADD COLUMN IF NOT EXISTS
-- Fotos locales
photos_supabucket JSONB DEFAULT '[]'::jsonb,
image_sync_status TEXT DEFAULT 'pending', -- pending|syncing|synced|error
synced_at TIMESTAMP,

-- Documentos
documents JSONB DEFAULT '[]'::jsonb, -- [{type, filename, url, uploaded_at}]

-- Control de fuente de datos
data_source TEXT DEFAULT 'inmovilla', -- inmovilla|native|hybrid
source_locked BOOLEAN DEFAULT false, -- Si true, no actualizar desde sync

-- Estado de publicación multi-portal
publish_status JSONB DEFAULT '{}'::jsonb,
-- Estructura:
-- {
--   "inmovilla": {"published": true, "external_id": "123", "last_sync": "2026-02-25T..."},
--   "idealista": {"published": false, "external_id": null, "error": "..."},
--   "fotocasa": {"published": false, "external_id": null, "error": "..."}
-- }

-- Historial de cambios
publish_logs JSONB DEFAULT '[]'::jsonb
-- {action, portal, timestamp, success, external_id, error}
```

### 1.3 Tabla de Tracking: `photo_sync_jobs`
```sql
CREATE TABLE IF NOT EXISTS photo_sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cod_ofer VARCHAR(10) REFERENCES property_metadata(cod_ofer),
  status TEXT DEFAULT 'pending', -- pending|downloading|uploading|synced|error
  total_photos INT,
  synced_photos INT DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  retries INT DEFAULT 0
);
```

---

## **FASE 2: Sincronización de Fotos (Semanas 5-8)**

### 2.1 Crear Server Action: `downloadAndUploadPhotosAction`
```typescript
File: src/app/actions/photo-sync.ts
Status: ⏳ PENDING

Functionality:
├─ Input: cod_ofer (string)
├─ Step 1: Get property details from Inmovilla
├─ Step 2: Download high-quality photos
│  ├─ Resize para web: 1920px max width
│  ├─ Generar thumbnail: 400px
│  └─ Convertir a WebP
├─ Step 3: Upload to Supabase Storage
│  ├─ Trayecto: /properties/{cod_ofer}/original/{timestamp}-{index}.webp
│  ├─ Generar signed URLs
│  └─ Actualizar `photos_supabucket` en property_metadata
├─ Step 4: Update sync_progress
└─ Error handling: Retry logic (máx 3 intentos)

Integration with syncPropertiesIncrementalAction:
- Después de upsertar en property_metadata, trigger foto sync
- NO bloquear el sync si hay error de fotos (fallback a URLs Inmovilla)
- Logging detallado [Photo Sync] en console
```

### 2.2 Migración Gradual de Fotos
```
Strategy:
├─ Fase 2a: Sync fotos NUEVAS que se descarguen
│  └─ Cada propiedad nueva descarga y almacena en Storage automáticamente
│
├─ Fase 2b: Batch job para fotos EXISTENTES (17 propiedades ya sincronizadas)
│  ├─ Crear task: `npm run sync:photos:batch`
│  ├─ Procesar grupos de 10 propiedades (respetar rate limits)
│  └─ Progress tracking en DB
│
└─ Fase 2c: Fallback inteligente
   ├─ Si `photos_supabucket` vacío → usar `photos` URLs de Inmovilla
   └─ Gradualmente todos tendrán Storage

Timeline:
- Semana 5-6: Implementar video sync action + testing
- Semana 6-7: Correr batch job para 77 propiedades
- Semana 8: Validación + rollback testing
```

### 2.3 Performance + CDN
```
Supabase Storage incluye:
✅ CDN automático
✅ Image transformations (resize, crop, format)
✅ Edge caching
✅ Signed URLs con expiraciones personalizadas

URL Pattern (Supabase):
${SUPABASE_URL}/storage/v1/object/public/property-images/{path}?{transforms}

Transforms (con Supabase):
/?width=500&quality=80  (Desktop)
/?width=300&quality=75  (Mobile)
/?width=100             (Thumbnail)

Implementar en componentes:
<Image
  src={`${property.photos_supabucket[0].url}?width=500&quality=80`}
  sizes="(max-width: 768px) 100vw, 50vw"
  priority
/>
```

---

## **FASE 3: Integración vidahome-encargo ↔ vidahome-website (Semanas 9-12)**

### 3.1 Mapeo de Tablas
```
Situación ACTUAL:
├─ vidahome-encargo → tabla `encargos`
└─ vidahome-website → tabla `property_metadata`
   Completamente aisladas ❌

Situación DESEADA:
┌─ vidahome-encargo (Gestor)
│  ├─ Tabla `encargos` (contratos internos)
│  └─ Tabla `properties` (propiedades edición)
│     (Nuevas propiedades nativas, no Inmovilla)
│
└─ vidahome-website (Catálogo público)
   ├─ Lee de `property_metadata` (TODAS: Inmovilla + nativas)
   └─ Queries unificadas

Schema decisión:
- Option A: Usar `property_metadata` como tabla única
  ├─ Ventaja: Menos duplicación
  └─ Desventaja: Más acoplamiento
  
- Option B: Crear `properties` en vidahome-encargo + trigger sync en property_metadata
  ├─ Ventaja: Separa dominio (gestión vs catálogo)
  └─ Desventaja: Sincronización tediosa

RECOMENDACIÓN: Option A (usar `property_metadata` como tabla única)
├─ Agregar campo `data_source` = "native" para propiedades nuevas
├─ Agregar campo `source_locked = true` para evitar sobrescritura por sync
└─ vidahome-encargo edita `property_metadata` directamente
```

### 3.2 Nueva Interfaz en vidahome-encargo
```
NEW: /encargos/propiedades (CRUD de propiedades)
Status: ⏳ PENDING

Features:
□ Crear propiedad nueva
  ├─ Form con todos los campos
  ├─ Subir fotos directamente a Storage
  └─ Inserta en property_metadata con data_source="native"

□ Editar propiedad existente
  ├─ Toggle: "Lockear ediciones" (ignora sync de Inmovilla)
  ├─ Actualizar descripciones multiidioma
  ├─ Agregar/eliminar fotos
  └─ Cambiar disponibilidad

□ Ver historial
  ├─ Quién cambió qué
  ├─ Cuándo
  └─ Qué valor anterior vs nuevo

□ Bulk actions
  ├─ Publicar a portales
  ├─ Cambiar estado (disponible/vendida)
  └─ Generar PDFs

DB Trigger (NEW):
├─ Antes de UPDATE en property_metadata
│  └─ Si `source_locked = true` y cambio es de sync → RECHAZAR
├─ Después de UPDATE
│  └─ Registrar cambio en audit log
```

---

## **FASE 4: Capacidad de Publicación Multi-Portal (Semanas 13-20)**

### 4.1 Investigación APIs
```
Status: ⏳ TODO (2-3 semanas de research + testing)

IMMOVILLA
└─ Existente, Ya implementado ✅

IDEALISTA
├─ Documentación: https://developers.idealista.com/
├─ Endpoint: Push API para publicaciones
├─ Auth: API Key + Secret
├─ Rate limit: ??? (investigar)
├─ Formato: JSON
└─ Capacidad: upload fotos, descripción, contacto

FOTOCASA
├─ Documentación: https://api.fotocasa.es/
├─ Endpoint: Feed API (XML/JSON)
├─ Auth: API Key
├─ Formato: XML (legacy) o JSON
├─ Capacidad: upload propiedades en batch

STRATEGY:
1. Request API keys/credentials para cada portal
2. Read y documentar endpoints en /docs/PORTAL_APIs/
3. Crear wrapper layer en src/lib/portals/
```

### 4.2 Server Actions para Publicación
```typescript
File: src/app/actions/portal-publish.ts
Status: ⏳ PENDING

Exports:
├─ publishToInmovilla(cod_ofer, propertyData)
├─ publishToIdealista(cod_ofer, propertyData)
├─ publishToFotocasa(cod_ofer, propertyData)
├─ unpublishFromPortal(cod_ofer, portal) -- Delist
└─ syncPublishStatus(cod_ofer) -- Check status en cada portal

Behavior:
├─ Input: cod_ofer + portal names
├─ Mapear property_metadata → portal-specific format
├─ POST a cada API
├─ Update publish_status.{portal}
│  ├─ external_id (ID en el portal)
│  ├─ last_sync timestamp
│  └─ error si aplica
├─ Logging en publish_logs
└─ Return: {success: bool, changes: [{portal, status, external_id}]}

Error Handling:
├─ Retry logic (máx 3 intentos con exponential backoff)
├─ Almacenar error messages completos
└─ Alert admin si falla (email? en-app notification?)
```

### 4.3 UI para Publicación
```
Location: /[locale]/admin/properties/{cod_ofer}/publish

Components:
├─ PublishStatusBoard
│  ├─ 3 cards (Inmovilla, Idealista, Fotocasa)
│  ├─ Badge: published/unpublished/pending/error
│  ├─ External ID y last sync timestamp
│  └─ Button: [Re-sync] [Unpublish]
│
├─ BulkPublishActions
│  ├─ Checkbox para seleccionar propiedades
│  ├─ Dropdown: "Publicar a..."
│  ├─ Confirm: "¿Publicar 5 propiedades a Idealista?"
│  └─ Progress bar durante operación
│
└─ PublishHistoryLog
   ├─ Tabla con historial
   ├─ Portal | Acción | Timestamp | Estado | Error
   └─ Filtros por fecha/portal
```

---

## **FASE 5: Prescindir Gradualmente de Inmovilla (Semanas 21-26)**

### 5.1 Estrategia de Desvinculación
```
Week 21-22:
├─ Dejar de sincronizar Inmovilla automáticamente
├─ Pero mantener capacidad de leerla si es necesario
├─ Cambiar sync_properties cron a "manual trigger only"

Week 23-24:
├─ Verificar que todas las 77 propiedades están en property_metadata
├─ Todas con fotos en Storage
├─ Status de publicación registrado
└─ Sin dependencias de Inmovilla activas

Week 25:
├─ Eliminar código sync de Inmovilla
├─ Eliminar cron from GitHub Actions
└─ Mantener histórico (datos no se borran)

Week 26:
├─ Cancelar credenciales Inmovilla (if no longer needed)
├─ Archive /docs/CATASTRO_*, /docs/ARSYS_*
└─ Documentar "Legacy Inmovilla Support" para referencia
```

### 5.2 Migración de Estado
```sql
-- Semana 21
UPDATE property_metadata
SET data_source = 'inmovilla_legacy'
WHERE (full_data->'source'->'api')::text = 'inmovilla'
AND source_locked = false;

-- Esto permite que:
-- 1. Las propiedades antiguas se vean como "legado Inmovilla"
-- 2. Agentes pueden "renovar" marcándolas como "native"
-- 3. En reportes ver mix de fuentes

-- Semana 25 (after verification)
DELETE FROM sync_progress; -- Cleanup tracking table
DELETE FROM sync_history; -- If exists, cleanup

-- Archive en GB pero NOT delete
CREATE TABLE archive.property_inmovilla_sync AS
SELECT * FROM ...;
```

---

## **FASE 6: Optimizaciones Finales + Docs (Semanas 27-30)**

### 6.1 Performance
```
✅ Foto: WebP + CDN (Supabase edge caching)
✅ Querys: Índices en cod_ofer, data_source, publish_status
✅ Triggers: Audit logging on every change
□ Caching: Next.js unstable_cache por preview (es, en, fr)

Tasks:
├─ Agregar índices en property_metadata
├─ Validar performance con 500 propiedades
├─ Stress test: bulk publish 100 propiedades
└─ Monitor: Supabase logs & Edge function usage
```

### 6.2 Documentación
```
Archivos a crear/actualizar:
├─ /docs/PROPERTY_MANAGEMENT_GUIDE.md
│  └─ Cómo crear/editar/publicar propiedades
│
├─ /docs/PORTAL_API_INTEGRATION.md
│  ├─ Credenciales y auth
│  ├─ Field mapping (property_metadata → cada portal)
│  └─ Error codes & troubleshooting
│
├─ /docs/ARCHITECTURE_MIGRATION.md
│  └─ Antes y después (Inmovilla-sync vs Multi-portal publish)
│
└─ /docs/OPERATIONS_RUNBOOK.md
   ├─ "Property goes down" → unpublish from all
   ├─ "Cambiar precio en tiempo real"
   └─ "Bulk operations"
```

---

## **PHASE 7: Monitoring + Contingency (Ongoing)**

### 7.1 Health Checks
```typescript
// New page: /admin/system-health
├─ Supabase connection ✓
├─ Storage available space
├─ Portal APIs status (ping each)
├─ Sync jobs queue (if any)
├─ Last problematic publishes
└─ Rate limit usage (Idealista, Fotocasa)
```

### 7.2 Alerting
```
Send email/Slack if:
├─ Publish fails 3x en row
├─ Storage usage > 80GB
├─ Portal API returns 5xx
├─ Sync job runs > 5 min
└─ RLS policy errors
```

---

## **Timeline Gantt**

```
Semanas:  1--4  | 5--8  | 9--12 | 13--20 | 21--26 | 27--30
          |----|-------|-------|--------|--------|--------
Phase 1   [████]                                            Supabase setup
Phase 2         [████]                                      Photo sync
Phase 3               [████]                                Integración tablas
Phase 4                     [████████]                      Multi-portal APIs
Phase 5                               [████]                Desvinculación Inmovilla
Phase 6                                     [████]          Performance + docs
Phase 7   [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  Ongoing monitoring

Est. Total: 30 semanas = ~7.5 meses (encaja en 6-8 meses con overlaps)
```

---

## **Risk Mitigation**

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Portal APIs change format | Medium | High | Keep test suite, monitor API changelogs |
| Rate limits hit | High | Medium | Implement queue + backoff, test thresholds |
| Data corruption during migration | Low | Critical | Backup property_metadata antes de cada fase crítica |
| Agentes no adoptan nuevo UI | Medium | High | Training sessions, video tutorials |
| Supabase Free → Pro cost | Low | Low | $10/mes presupuestado, ROI en 1 mes |
| Photos too large (>100GB) | Low | Medium | Implement compression + WebP conversion |

---

## **Success Criteria**

- ✅ Fase 1: Supabase Pro + Storage funcional
- ✅ Fase 2: 77/77 propiedades con fotos en Storage
- ✅ Fase 3: vidahome-encargo + vidahome-website integrados
- ✅ Fase 4: Publicación funcional en 3 portales
- ✅ Fase 5: Cero dependencias de Inmovilla para operación diaria
- ✅ Fase 6: Documentación completa
- ✅ Fase 7: Sistema monitoreado y alertas funcionales

---

**Documento vivo**: Marcar esta sección cuando cada fase completada.
- [ ] Fase 1 Completada: ____/____
- [ ] Fase 2 Completada: ____/____
- [ ] Fase 3 Completada: ____/____
- [ ] Fase 4 Completada: ____/____
- [ ] Fase 5 Completada: ____/____
- [ ] Fase 6 Completada: ____/____

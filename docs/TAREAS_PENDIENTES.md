# Vidahome Website — Tareas Pendientes

> Última actualización: 26/02/2026 — Commit actual: `e017afe`

---

## 🔴 URGENTE — SQL pendiente en Supabase Dashboard

Estas dos migraciones SQL son necesarias para que funcionen features ya desplegadas en producción. Ejecutar en **Supabase Dashboard → SQL Editor** → Run:

### 1. Tabla `discrepancias_dismissed` (necesaria para botón "Descartar" en discrepancias)

```sql
CREATE TABLE IF NOT EXISTS discrepancias_dismissed (
  id SERIAL PRIMARY KEY,
  ref TEXT NOT NULL,
  campo TEXT NOT NULL,
  valor_encargo TEXT NOT NULL,
  valor_web TEXT NOT NULL,
  dismissed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ref, campo, valor_encargo, valor_web)
);
CREATE INDEX IF NOT EXISTS idx_discrepancias_dismissed_ref ON discrepancias_dismissed(ref);

GRANT ALL ON discrepancias_dismissed TO authenticated;
GRANT ALL ON discrepancias_dismissed TO service_role;

NOTIFY pgrst, 'reload schema';
```

### 2. Columna `admin_overrides` en `property_metadata` (necesaria para editor de precios admin)

```sql
ALTER TABLE property_metadata 
ADD COLUMN IF NOT EXISTS admin_overrides JSONB DEFAULT '{}'::jsonb;

GRANT ALL ON property_metadata TO authenticated;
GRANT ALL ON property_metadata TO service_role;

NOTIFY pgrst, 'reload schema';
```

> **Nota**: Se pueden ejecutar ambos bloques juntos en una sola ejecución.

---

## 🟡 SEGURIDAD — Issues de prioridad media/baja (pendientes)

Los 3 fallos **CRÍTICOS** ya están resueltos (commit `e017afe`). Quedan:

### HIGH (prioridad alta)

| # | Issue | Archivo | Descripción |
|---|-------|---------|-------------|
| H3 | XSS en emails | `src/app/api/leads/valuation/route.ts` | Los datos del usuario se insertan en HTML sin sanitizar. Un atacante podría inyectar `<script>` en los campos del formulario de tasación. **Fix**: Escapar HTML con una función `escapeHtml()` antes de interpolar en el template. |
| H4 | Sin validación de input | Varios POST endpoints | No hay schema validation (Zod/Yup) en los bodies de los POST. **Fix**: Añadir validación Zod en los endpoints que aceptan datos. |
| H6 | Body size limit 50MB | `next.config.ts` | `serverActions.bodySizeLimit: '50mb'` es excesivo para una web inmobiliaria. **Fix**: Reducir a `4mb` o `10mb` según necesidad real. |

### MEDIUM (prioridad media)

| # | Issue | Archivo | Descripción |
|---|-------|---------|-------------|
| M1 | Sin rate limit en Catastro | `src/app/api/catastro/*` | Los endpoints de Catastro no tienen rate limiting. Podrían ser abusados. **Fix**: Añadir rate limiter como en otros endpoints. |
| M3 | CSP débil | `next.config.ts` | Content Security Policy usa `unsafe-inline` y `unsafe-eval`. **Fix**: Migrar a nonces o hashes. |
| M6 | Debug endpoint expuesto | `src/app/api/debug/ip/route.ts` | Endpoint `/api/debug/ip` accesible públicamente. **Fix**: Eliminar o proteger con auth. |

### LOW (prioridad baja)

| # | Issue | Descripción |
|---|-------|-------------|
| L1 | CSRF parcial | Server actions tienen protección CSRF nativa de Next.js, pero API routes no. Riesgo bajo si admin migra a otro proyecto. |
| L2 | Email hardcodeado | `info@vidahome.es` está hardcodeado en varios archivos. Mejor moverlo a variable de entorno. |
| L3 | Logs verbosos en sync | Sync incremental loguea datos completos de propiedades. En producción debería ser más discreto. |

---

## 🟢 FUNCIONALIDAD — Mejoras pendientes

### Admin Panel

| Tarea | Prioridad | Notas |
|-------|-----------|-------|
| **Migrar admin a proyecto con Google Auth** | Alta | El usuario tiene otro proyecto (`vidahome-encargo`) con Google Auth ya implementado. Evaluar mover el panel admin allí para tener autenticación robusta sin cookies HMAC. |
| **Tabla `properties` vs `property_metadata`** | Media | Existe tabla `properties` con estructura más limpia (columnas separadas por idioma). Evaluar consolidación. Ver sección 13 de PROJECT_CONTEXT_LOG.md. |

### SEO & Performance

| Tarea | Prioridad | Notas |
|-------|-----------|-------|
| Migrar fotos a Supabase Storage | Baja | Actualmente depende de URLs de Inmovilla. Fase 2 del roadmap de independencia. |
| Schema markup enriquecido | Baja | Añadir `RealEstateListing` schema para Google Rich Results. |

### Traducciones

| Tarea | Prioridad | Notas |
|-------|-----------|-------|
| Sistema de aprobación | Baja | Revisar traducciones antes de publicar. |
| Historial de versiones | Baja | Guardar versiones anteriores de traducciones por idioma. |

### Multi-portal (Roadmap largo plazo)

| Tarea | Prioridad | Notas |
|-------|-----------|-------|
| APIs Idealista + Fotocasa | Futura | Publicar propiedades en múltiples portales desde un único panel. |
| Independencia total de Inmovilla | Futura | Ver `docs/PRODUCT_INDEPENDENCE_ROADMAP.md` para plan completo (6-8 meses). |

---

## ✅ Resuelto recientemente

| Fecha | Commit | Descripción |
|-------|--------|-------------|
| 26/02 | `e017afe` | **Seguridad crítica**: Auth `requireAdmin()` en todas las rutas admin y server actions. Eliminado cron endpoint. Rate limiter falla cerrado. Sin stack traces en respuestas. |
| 26/02 | `e5ec0a9` | Fix: Dénia (key_loca 37699) añadida a localidades_map |
| 26/02 | `f18b237` | Fix: Sync usa `precioinmo`, `tiposMap`, `localidadesMap` + editor de precios admin con override |
| 26/02 | `1a8b524` | Docs: Actualización PROJECT_CONTEXT_LOG + MASTER_SETUP_GUIDE |
| 26/02 | `1a9c055` | Feature: Sistema de discrepancias encargos vs web con señal ⚠️ |
| 26/02 | `91dc06b` | Fix: Habitaciones = simples + dobles |
| 26/02 | `b20c1ef` | Style: Logo doble de alto |
| 26/02 | `b9757f2` | Fix: Build + GitHub Actions env vars |

---

*Para contexto completo del proyecto, ver [PROJECT_CONTEXT_LOG.md](./PROJECT_CONTEXT_LOG.md)*

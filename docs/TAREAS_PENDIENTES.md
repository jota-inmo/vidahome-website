# Vidahome Website — Tareas Pendientes

> Última actualización: 26/02/2026 — Commit actual: `7e90fe9`

---

## ✅ SQL ejecutado en Supabase Dashboard

~~Estas dos migraciones SQL son necesarias para que funcionen features ya desplegadas en producción.~~ **Ejecutadas el 26/02/2026.**

### 1. Tabla `discrepancias_dismissed` ✅
### 2. Columna `admin_overrides` en `property_metadata` ✅

---

## 🟡 SEGURIDAD — Issues restantes (prioridad baja)

Los fallos **CRÍTICOS** (`e017afe`), **HIGH** y **MEDIUM** (`7e90fe9`) están resueltos. Quedan:

### LOW (prioridad baja)

| # | Issue | Descripción |
|---|-------|-------------|
| M3 | CSP débil | Content Security Policy usa `unsafe-inline` y `unsafe-eval`. Migrar a nonces o hashes. |
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
| 26/02 | `7e90fe9` | **Seguridad HIGH+MEDIUM**: XSS fix (escapeHtml), Zod validation en todos los POST, rate limit en Catastro (30/min), body limit 50MB→4MB. |
| 26/02 | `3f990cd` | Fix: "Property" en inglés en todas las locales, tipos IT/PL, fallback `poblacion` |
| 26/02 | `9b8c356` | Fix: Traducciones — eliminar truncación 600 chars + anti-refusal guards |
| 26/02 | `00bf814` | Feature: Locale italiano (IT) con bandera, mensajes completos |
| 26/02 | `52bd2e9` | Fix: No mencionar precio en traducciones |
| 26/02 | `9110188` | Feature: Prompts per-language (Rightmove, SeLoger, ImmoScout24, Immobiliare.it, Otodom.pl) |
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

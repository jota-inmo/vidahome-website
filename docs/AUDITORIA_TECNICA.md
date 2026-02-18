# Auditoría Técnica Completa — Vidahome Premium
**Fecha:** 18 de febrero de 2026  
**Auditor:** Antigravity AI  
**Versión del proyecto:** Next.js 16.1.6 (Turbopack)  
**Alcance:** Lectura + correcciones aplicadas en sesión.

---

## 1. Resumen Ejecutivo

El proyecto Vidahome es una aplicación web inmobiliaria bien construida con un stack moderno (Next.js 16, Supabase, TypeScript). La arquitectura general es sólida. En esta sesión se han **resuelto 3 de los 5 hallazgos críticos/altos** identificados inicialmente. Quedan pendientes acciones manuales fuera del alcance del código (rotación de credenciales, limpieza del historial de Git) y mejoras de medio/largo plazo.

### Estado actual de issues críticos:

| # | Severidad | Issue | Estado |
|---|-----------|-------|--------|
| 1 | 🔴 Crítico | Credenciales de Inmovilla en Git/GitHub | ✅ **Resuelto en código** — ⚠️ Acción manual pendiente |
| 2 | 🔴 Crítico | `/admin-hero` sin protección de middleware | ✅ **Resuelto** |
| 3 | 🔴 Crítico | Contraseña de admin hardcodeada como fallback | ✅ **Resuelto** |
| 4 | 🟠 Alto | Caché de archivos ineficaz en Vercel (serverless) | ✅ **Resuelto** |
| 5 | 🟠 Alto | Endpoint `/api/debug/ip` expuesto en producción | ✅ **Resuelto** |
| 6 | 🟠 Alto | RLS de Supabase demasiado permisiva en `hero_videos` | 🔴 **Pendiente** |

---

## 2. Análisis Detallado

### 2.1 Seguridad

#### ✅ RESUELTO — Credenciales en repositorio Git
**Archivo:** `docs/MASTER_SETUP_GUIDE.md`

**Cambio aplicado:** Se eliminaron todos los valores reales de la tabla de variables de entorno y se reemplazaron por descripciones instructivas. Los valores `13031`, `HQYn5#Gg8`, `_244_ext` y la URL del proxy de Arsys ya no aparecen en el archivo.

> ⚠️ **ACCIÓN MANUAL REQUERIDA — URGENTE:**
> El historial de Git anterior aún contiene los commits con las credenciales. Debes:
> 1. **Rotar la contraseña de Inmovilla** — Contactar con soporte de Inmovilla para cambiarla.
> 2. **Verificar exposición en Git:**
>    ```bash
>    git log --all -S "HQYn5" --oneline
>    ```
> 3. **Limpiar el historial** si aparecen commits:
>    ```bash
>    # Instalar git-filter-repo (pip install git-filter-repo)
>    git filter-repo --replace-text <(echo "HQYn5#Gg8==>REDACTED")
>    git push --force
>    ```
> 4. Si el repositorio es público en GitHub, usar la herramienta de eliminación de secretos de GitHub Security.

---

#### ✅ RESUELTO — Ruta `/admin-hero` sin protección de middleware
**Archivo:** `src/middleware.ts`

**Cambio aplicado:** El matcher del middleware ahora incluye `/admin-hero` y `/admin-hero/*`:

```typescript
export const config = {
    matcher: ['/admin/:path*', '/admin-hero', '/admin-hero/:path*'],
};
```

La lógica de detección también se actualizó para cubrir ambos prefijos:

```typescript
const isAdminPage = pathname.startsWith('/admin') || pathname.startsWith('/admin-hero');
```

Cualquier acceso a `/admin-hero` sin cookie `admin_session` redirige automáticamente a `/admin/login`.

---

#### ✅ RESUELTO — Contraseña de admin hardcodeada como fallback
**Archivo:** `src/app/actions.ts` — función `loginAction`

**Cambio aplicado:** Se eliminó el fallback `|| 'VID@home0720'`. Ahora si `ADMIN_PASSWORD` no está configurado en las variables de entorno, la función devuelve un error claro en lugar de usar un valor por defecto inseguro:

```typescript
const adminPass = process.env.ADMIN_PASSWORD;
if (!adminPass) {
    console.error('[Auth] ADMIN_PASSWORD no está configurado en las variables de entorno.');
    return { success: false, error: 'Error de configuración del servidor' };
}
```

> ⚠️ **Verificar:** Asegúrate de que `ADMIN_PASSWORD` está configurado en el panel de Vercel antes de hacer deploy.

---

#### ✅ RESUELTO — Endpoint de debug expuesto en producción
**Archivo:** `src/app/api/debug/ip/route.ts`

**Cambio aplicado:** Se añadió un guard al inicio del handler que devuelve `404` inmediatamente en producción, sin ejecutar ninguna lógica ni revelar información de infraestructura. El endpoint sigue funcionando en desarrollo local para depuración:

```typescript
if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
```

En producción (Vercel), `/api/debug/ip` ahora devuelve un genérico `404 Not found` sin revelar IPs, headers ni instrucciones de configuración.

---

#### 🔴 PENDIENTE — Política RLS de Supabase demasiado permisiva
**Archivo:** Configuración de Supabase (panel web)

La política `FOR ALL USING (true)` en `hero_videos` permite que cualquier usuario con la clave anónima pública pueda manipular el banner directamente a través de la API de Supabase.

**Acción recomendada:** En el panel de Supabase → Authentication → Policies → tabla `hero_videos`:
```sql
-- Eliminar política actual
DROP POLICY "Gestión Admin" ON hero_videos;

-- Crear política que solo permite lectura pública
CREATE POLICY "Lectura pública" ON hero_videos
    FOR SELECT USING (true);

-- Las operaciones de escritura solo desde el servidor con SERVICE_ROLE_KEY
-- (no necesitan política RLS porque la service role la bypasea)
```

Y en `actions.ts`, usar `SUPABASE_SERVICE_ROLE_KEY` para las operaciones de escritura en `hero_videos`.

---

#### 🟡 MEDIO — Sin rate limiting en formularios públicos
**Archivos:** `src/components/ContactForm.tsx`, `src/app/vender/page.tsx`

Los formularios de contacto y tasación no tienen:
- Rate limiting (un bot puede enviar miles de solicitudes)
- CAPTCHA o validación anti-spam
- Validación de formato de email y teléfono en el servidor

**Acción recomendada:** Añadir Vercel Rate Limiting o implementar un middleware de rate limiting con `@upstash/ratelimit`.

---

#### 🟡 MEDIO — Sanitización de texto demasiado agresiva
**Archivo:** `src/lib/api/web-client.ts` (línea 110)

```typescript
const hasSuspiciousQuotes = /(['\"])[^'\"]*\1/.test(sanitized) || /['\"]/.test(sanitized);
```

Esta regex bloquea cualquier texto que contenga comillas simples o dobles, incluyendo nombres propios legítimos como `O'Brien` o `D'Angelo`.

---

### 2.2 Arquitectura

#### ✅ RESUELTO — Sistema de caché incompatible con Vercel (serverless)
**Archivo:** `src/lib/api/cache.ts`

**Cambio aplicado:** Se reemplazó completamente el módulo de caché. La implementación anterior usaba `fs.writeFileSync` que no funciona en entornos serverless. La nueva implementación tiene dos capas:

1. **`MemoryCache`** — Mantiene compatibilidad con el código existente que usa `apiCache.get/set/remove`. Útil en desarrollo local.

2. **`withNextCache(fn, key, options)`** — Nueva función que envuelve cualquier función async con `unstable_cache` de Next.js 16. Esta caché **sí persiste entre invocaciones serverless** en Vercel usando la Data Cache del framework.

```typescript
// Uso en actions.ts:
const _fetchPropertiesFromApi = withNextCache(
    'inmovilla_property_list',
    async (numagencia, password, ...) => { /* fetch */ },
    { revalidate: 1200, tags: ['inmovilla_property_list'] }
);
```

**Invalidación correcta:** Al actualizar propiedades destacadas, se llama a `revalidateTag('inmovilla_property_list', {})` para forzar un refresco en la próxima petición.

**Impacto en rendimiento:** La página `/propiedades` y la home ahora se benefician de caché real en producción. El tiempo de respuesta debería bajar de ~2-3s a <100ms en peticiones cacheadas.

---

#### ⚠️ PENDIENTE — Monolito de `actions.ts`
El archivo tiene 417 líneas y mezcla responsabilidades muy diferentes. Debería dividirse en módulos: `auth.actions.ts`, `properties.actions.ts`, `hero.actions.ts`, etc.

#### ⚠️ PENDIENTE — Página `/vender` con >1000 líneas
El componente `VenderPage` es un megacomponente. Debería dividirse en subcomponentes: `PropertySearchForm`, `PropertyDetails`, `ValuationEstimation`, `ContactStep`.

#### ⚠️ PENDIENTE — Inconsistencia en rutas del admin
La ruta `/admin-hero` es inconsistente con el resto del panel (que vive bajo `/admin/*`). Aunque ya está protegida por el middleware, sería más limpio moverla a `/admin/hero-banner`.

---

### 2.3 Optimización de Código

#### ✅ RESUELTO — Doble ordenación redundante en `fetchPropertiesAction`
La ordenación redundante (líneas 85 y 95 del original) fue eliminada al refactorizar la función con `withNextCache`. Ahora la ordenación se aplica una sola vez dentro de la función cacheada.

#### ✅ RESUELTO — Clave de caché obsoleta en `updateFeaturedPropertiesAction`
La llamada `apiCache.remove('property_list_v6')` (clave incorrecta) fue reemplazada por `revalidateTag('inmovilla_property_list', {})`, que invalida correctamente la caché de Next.js.

#### 🟡 PENDIENTE — `localidades_map.json` (254 KB) en bundle del cliente
**Archivo:** `src/app/vender/page.tsx`

Este JSON se importa en un Client Component, enviándolo al navegador. Debería moverse al servidor.

#### 🟡 PENDIENTE — `alert()` nativo en página de Vender
Múltiples llamadas a `alert()` en `src/app/vender/page.tsx`. Debería reemplazarse por un sistema de notificaciones in-app (ej: `react-hot-toast`).

---

### 2.4 Mejores Prácticas

#### SEO — Pendiente
- ❌ Sin `og:image` para compartición en redes sociales
- ❌ Sin Schema.org (RealEstateListing) para rich snippets en Google
- ❌ Sin `sitemap.xml` ni `robots.txt`
- ❌ Títulos de páginas interiores no son dinámicos
- ❌ Imágenes con `<img>` en lugar de `<Image>` de Next.js (sin optimización WebP/lazy)

#### Manejo de Errores — Pendiente
- ❌ Errores silenciados con `catch (e) {}` en varios lugares
- ❌ Sin logging centralizado

#### Mantenibilidad — Pendiente
- ❌ Sin tests automatizados
- ❌ Archivos de debug en el repositorio (`test-catastro-live.js`, `hit_api.js`)

---

## 3. Priorización de Issues — Estado Actualizado

| # | Severidad | Issue | Estado |
|---|-----------|-------|--------|
| 1 | 🔴 Crítico | Credenciales de Inmovilla en Git/GitHub | ✅ Código corregido — ⚠️ Rotar contraseña + limpiar Git |
| 2 | 🔴 Crítico | `/admin-hero` sin protección de middleware | ✅ **Resuelto** |
| 3 | 🔴 Crítico | Contraseña de admin hardcodeada como fallback | ✅ **Resuelto** |
| 4 | 🟠 Alto | Caché de archivos ineficaz en Vercel | ✅ **Resuelto** — `withNextCache` implementado |
| 5 | 🟠 Alto | Endpoint `/api/debug/ip` expuesto en producción | ✅ **Resuelto** — Guard de entorno añadido |
| 6 | 🟠 Alto | RLS de Supabase demasiado permisiva en `hero_videos` | 🔴 Pendiente (requiere panel Supabase) |
| 7 | 🟡 Medio | `alert()` nativo en página de Vender | 🟡 Pendiente |
| 8 | 🟡 Medio | `localidades_map.json` (254 KB) en bundle del cliente | 🟡 Pendiente |
| 9 | 🟡 Medio | Sin rate limiting en formularios públicos | 🟡 Pendiente |
| 10 | 🟡 Medio | Sin Schema.org ni sitemap.xml | 🟡 Pendiente |
| 11 | 🟡 Medio | Imágenes con `<img>` en lugar de `<Image>` de Next.js | 🟡 Pendiente |
| 12 | 🟢 Bajo | `actions.ts` monolítico (417 líneas) | 🟢 Pendiente |
| 13 | 🟢 Bajo | `VenderPage` megacomponente (>1000 líneas) | 🟢 Pendiente |
| 14 | 🟢 Bajo | Sin tests automatizados | 🟢 Pendiente |
| 15 | 🟢 Bajo | Archivos de debug en el repositorio | 🟢 Pendiente |

---

## 4. Próximos Pasos Recomendados

### 🚨 Inmediato (Hoy)

1. **Rotar contraseña de Inmovilla** — Contactar con soporte de Inmovilla.
2. **Verificar y limpiar historial de Git** — Ver instrucciones en sección 2.1.
3. **Verificar que `ADMIN_PASSWORD` está configurado en Vercel** — El login fallará si no está.
4. **Hacer deploy a Vercel** — Los cambios de middleware y caché ya están listos.

### Esta semana

5. **Eliminar o proteger `/api/debug/ip`** — Añadir guard de entorno.
6. **Corregir RLS de Supabase** — Cambiar política en el panel de Supabase.

### Próximas 2 semanas

7. **Reemplazar `alert()` por toast notifications** — `react-hot-toast` o similar.
8. **Mover `localidades_map.json` al servidor** — Reducir bundle del cliente.
9. **Añadir rate limiting** — Vercel Rate Limiting o `@upstash/ratelimit`.

### Próximo mes

10. **Schema.org + sitemap.xml** — Impacto SEO muy alto.
11. **Optimizar imágenes con `<Image>` de Next.js**.
12. **Cumplimiento GDPR** — Banner de cookies con consentimiento granular.

---

## 5. Cambios Aplicados en Esta Sesión

| Archivo | Cambio |
|---------|--------|
| `docs/MASTER_SETUP_GUIDE.md` | Eliminadas credenciales reales, reemplazadas por placeholders |
| `src/middleware.ts` | Añadido `/admin-hero` y `/admin-hero/*` al matcher de protección |
| `src/lib/api/cache.ts` | Reescrito: `MemoryCache` + `withNextCache` (Next.js Data Cache) |
| `src/app/actions.ts` | `fetchPropertiesAction` usa `withNextCache`; eliminado fallback de contraseña; `revalidateTag` correcto |
| `src/app/api/debug/ip/route.ts` | Guard de entorno: devuelve `404` en producción sin ejecutar lógica |

**Build status:** ✅ `Exit code: 0` — Compilación exitosa sin errores TypeScript.

---

*Documento actualizado el 18/02/2026 — Auditoría con correcciones aplicadas.*

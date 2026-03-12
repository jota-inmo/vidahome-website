# Últimos cambios (2026-03-12)

## Sesión de Recuperación y Sincronización

### 1. Corrección Crítica de Seguridad y Acceso (Supabase)
- **Qué se cambió:** Se detectó que la variable `SUPABASE_SERVICE_ROLE_KEY` en el `.env` (local y Vercel) contenía erróneamente el valor de la `anon_key`.
- **Por qué se cambió:** Las `Server Actions` y scripts de sincronización fallaban con error `42501 (RLS violation)` porque la `anon_key` está sujeta a políticas de seguridad, mientras que la `service_role` las bypasses.
- **Resultado:** Scripts de sincronización ahora funcionan correctamente tanto en local como en producción.

### 2. Sistema de URLs de Propiedades para Automatización
- **Qué se cambió:** Se creó la tabla `property_urls` y se ejecutó el script de generación masiva.
- **Por qué se cambió:** Para permitir el uso de enlaces directos a las propiedades en diferentes idiomas desde herramientas externas (Google Calendar, CRM de terceros, confirmaciones por email).
- **Resultado:** Generadas y guardadas las URLs para las **80 propiedades** actuales en los 6 idiomas soportados.

### 3. Sincronización de REF 2963
- **Qué se cambió:** Sincronización forzada de la propiedad `28342875` (REF 2963) desde la API de Inmovilla.
- **Resultado:** La propiedad ya está disponible en Supabase y visible en el catálogo web: [Ver propiedad](https://vidahome-website.vercel.app/es/propiedades/28342875).

### 4. Gestión de Duración en Hero Video
- **Qué se cambió:** Se habilitó un campo en el Panel Admin de Hero para configurar la duración de cada diapositiva (en milisegundos).
- **Por qué se cambió:** Para permitir un control total sobre el ritmo visual del banner principal sin necesidad de modificar código.
- **Resultado:** El componente `LuxuryHero` ahora respeta la duración configurada individualmente para cada video o imagen.

### 5. Robustez de Scripts de Servidor
- **Qué se cambió:** Se actualizó la inicialización del cliente Supabase en todos los scripts (`scripts/*.ts`) añadiendo `{ auth: { persistSession: false } }`.
- **Por qué se cambió:** Evita errores de persistencia de sesión en entornos headless o de solo servidor (Node.js).

---

# Últimos cambios (2026-03-04)

## Cambio más reciente

- **Commit:** `8776f8e`
- **Título:** Fix: convertir código de país a CountryCode correctamente en validación de teléfono
- **Archivo principal:** `src/app/[locale]/vender/components/ContactFormStep.tsx`

### Qué se cambió

- Se añadió una conversión explícita desde prefijo telefónico (`+34`, `+33`, etc.) a `CountryCode` interno (`ES`, `FR`, etc.).
- Se corrigió la inicialización del hook de teléfono para que reciba el formato correcto.
- Se mejoró la sincronización del estado del teléfono cuando el usuario vuelve atrás en el formulario.

### Por qué se cambió

- El formulario mostraba el error **"País no soportado"** incluso con números válidos (por ejemplo España `+34`).
- La causa raíz era un desajuste de formatos:
  - Se guardaba `indicativoPais` como `+34`
  - El validador esperaba `CountryCode` como `ES`

### Resultado esperado

- Ya no debe aparecer "País no soportado" para prefijos válidos.
- La validación de teléfono vuelve a funcionar correctamente en el flujo de vender/alquilar.

---

## Cambios inmediatamente anteriores (contexto)

- `13d9952` — Mejorar validación y mensajes de referencia catastral (14-20 caracteres).
- `1ed1f2b` — Hacer validación de teléfono más flexible y permisiva.
- `ff3c18f` — Habitaciones/baños del usuario actualizan valores en recuadro verde de confirmación.
- `f20f16a` — Mostrar habitaciones, baños e info adicional en confirmación.

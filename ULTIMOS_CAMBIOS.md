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

### 6. Gestión Dinámica de Contenidos Legales
- **Qué se cambió:** Se implementó una tabla `legal_pages` en Supabase y una nueva interfaz en el Panel Admin.
- **Por qué se cambió:** Para que el usuario pueda editar los textos de Privacidad, Cookies y Aviso Legal en los 6 idiomas sin tocar el código.
- **Resultado:** Las páginas `/legal/*` ahora son dinámicas y editables desde el panel.

### 7. Email de Notificaciones Configurable
- **Qué se cambió:** Se añadió un campo "Email de Notificaciones" en la configuración de la agencia y se integró con **Resend**.
- **Por qué se cambió:** Para permitir al usuario decidir a qué dirección de correo deben llegar los leads de contacto y tasaciones.
- **Resultado:** Los formularios de la web ahora consultan la DB para saber a quién notificar cada envío.

### 8. Despliegue de Esquema SQL
- **Qué se cambió:** Se ejecutó `sql/legal_and_settings_setup.sql` para preparar las tablas necesarias.
- **Resultado:** Entorno de base de datos listo para el manejo de contenidos dinámicos.

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

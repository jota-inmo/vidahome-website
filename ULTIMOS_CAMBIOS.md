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

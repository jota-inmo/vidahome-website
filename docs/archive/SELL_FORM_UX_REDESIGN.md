# Nuevo Flujo de Formulario "Vender" - Propuesta UX

## Problema Actual
- Flujo comienza directamente con búsqueda de dirección
- No diferencia entre Venta y Alquiler
- No pregunta tipo de bien hasta después de buscar
- Email obligatorio (debería ser opcional)
- Teléfono sin validación amigable de indicativo país
- No hay sugerencia de referencia catastral como fallback
- Experiencia desorganizada: "¿qué debo llenar primero?"

## Nuevo Flujo Propuesto (6 Pasos)

```
STEP 1: TIPO DE OPERACIÓN
┌─────────────────────────────────┐
│ ¿Quieres VENDER o ALQUILAR?     │
│                                 │
│  ○ Venta                        │
│  ○ Alquiler                     │
│                                 │
│ [Siguiente]                     │
└─────────────────────────────────┘

STEP 2: TIPO DE BIEN
┌─────────────────────────────────┐
│ ¿Qué tipo de propiedad tienes?  │
│                                 │
│ [Dropdown con opciones:]        │
│  • Piso/Apartamento             │
│  • Chalet/Casa aislada          │
│  • Adosado                      │
│  • Pareado                      │
│  • Adosado esquinero            │
│  • Local comercial              │
│  • Oficina                      │
│  • Trastero/Almacén            │
│  • Aparcamiento/Garaje          │
│  • Terreno urbano               │
│  • Terreno urbanizable          │
│  • Terreno rústico              │
│  • Otra (especifica)            │
│                                 │
│ [Siguiente]                     │
└─────────────────────────────────┘

STEP 3: DIRECCIÓN
┌─────────────────────────────────┐
│ Búsqueda de Dirección           │
│ (Formato Catastro)              │
│                                 │
│ Provincia: [VALENCIA]           │
│ Municipio: [GANDÍA]             │
│                                 │
│ Tipo de vía: [Calle]            │
│ Vía: [Autocomplete]             │
│ Número: [Autocomplete]          │
│                                 │
│ [Buscar en Catastro]            │
│ [No encuentro mi propiedad]     │
│   ↓ (mostrar alternativa)       │
│   Introduzca Ref. Catastral     │
│   (22 dígitos, opcional)        │
│                                 │
│ [Siguiente]                     │
└─────────────────────────────────┘

STEP 4: DETALLES (SI aplica)
┌─────────────────────────────────┐
│ Información adicional           │
│ (Solo si es PISO/APARTAMENTO)   │
│                                 │
│ Piso/Planta: [  ]               │
│ Puerta: [  ]                    │
│                                 │
│ [Siguiente]                     │
└─────────────────────────────────┘

STEP 5: REVISIÓN & REFERENCIA CAT.
┌─────────────────────────────────┐
│ Propiedades encontradas         │
│ ✓ Dirección correcta            │
│ ✓ Superficie: X m²              │
│ ✓ Valor catastral: €X           │
│                                 │
│ ¿Es esta tu propiedad?          │
│ [Si, Continuar] [No, Buscar otra]
│                                 │
│ ¿No la encuentras?              │
│ Ref. Catastral (opcional):      │
│ [____________________]          │
│ (22 dígitos - búsqueda precisa) │
│                                 │
│ [Siguiente]                     │
└─────────────────────────────────┘

STEP 6: CONTACTO (FLUIDO)
┌─────────────────────────────────┐
│ ¿Cómo te contactamos?           │
│                                 │
│ Tu nombre: *                    │
│ [____________________]          │
│                                 │
│ Email: (opcional)               │
│ [____________________]          │
│ "Te enviaremos la tasación..."  │
│                                 │
│ Teléfono: *                     │
│ [+34] [6XX XX XX XX]            │
│ "Detectamos automáticamente     │ 
│  tu país por el indicativo"     │
│                                 │
│ Mensaje (opcional):             │
│ [___________________]           │
│ "Ej: El piso tiene reforma"     │
│                                 │
│ [Enviar Solicitud]              │
└─────────────────────────────────┘
```

## Detalles de Implementación

### STEP 1: Tipo de Operación
- **Componente:** Radio buttons (venta/alquiler)
- **Icono:** Casa de venta vs casa de alquiler
- **Acción:** Guarda `operationType: 'venta' | 'alquiler'`

### STEP 2: Tipo de Bien
- **Componente:** Dropdown/Select con 12+ opciones
- **Agrupación:** Residencial, Comercial, Terrenos
- **Lógica condicional:** 
  - Si Piso → STEP 4 (piso/puerta)
  - Si Terreno → STEP 3 (saltar puerta)
  - Si Otro → STEP 3 (dirección normal)

### STEP 3: Dirección (Integración Catastro)
- **Búsqueda en 3 niveles:**
  1. Provincia (dropdown)
  2. Municipio (dropdown auto-actualizado)
  3. Vía (autocomplete + tipo de vía)
  4. Número (autocomplete + complementos)

- **Sin resultados?**
  - Mostrar acordeón: "No encuentro mi propiedad"
  - Campo para Ref. Catastral manual (22 dígitos)
  - Validación: debe tener 22 caracteres o dejar vacío

- **Autocomplete amigable:**
  ```
  Usuario escribe: "san fra"
  Sistema sugiere: 
    → San Francisco de Borja
    → San Francisco Javier
  Usuario selecciona → autocompleta número automáticamente
  ```

### STEP 4: Detalles de Piso (Condicional)
- **Solo si:** tipo_bien === 'Piso/Apartamento'
- **Campos:**
  - Piso/Planta: [número o "Bajo", "Principal", "Duplex"]
  - Puerta/Escalera: [A, B, C, etc.]
- **Nota:** "Esto ayuda a validar la referencia catastral"

### STEP 5: Revisión & Referencia Catastral
- **Mostrar:**
  - Dirección encontrada (con foto del Catastro si disponible)
  - Superficie, año construcción, tipo de uso
  - Valor catastral
  - Botones: ✓ Es esta | ✗ Buscar otra

- **Fallback si no encontró:**
  - Campo de Ref. Catastral como "asistente de búsqueda"
  - Descripción amigable: "Si conoces tu referencia catastral (22 dígitos), aquí puedes usarla para búsqueda precisa"
  - No obligatorio: "Si no la tienes, no importa"

### STEP 6: Contacto (FLUIDO & AMIGABLE)

#### Nombre
- Input simple, requerido
- Placeholder: "Tu nombre..."
- Validación: mínimo 2 caracteres

#### Email (OPCIONAL)
- Label: "Email (opcional)"
- Placeholder: "correo@ejemplo.com"
- Validación: si se rellena, debe ser válido
- Nota helptext: "Te enviaremos la tasación por aquí"
- **Importante:** No mostrar error si está vacío

#### Teléfono (REQUERIDO pero AMIGABLE)
- **Estructura:**
  ```
  [Indicativo país] [Campo número]
  [+34 ▼]           [6XX XX XX XX]
  ```

- **Lógica inteligente:**
  1. Input normal en mobile (teclado numérico automático)
  2. Detectar indicativo +34, +39, +33, +49 según lo que escriba
  3. Cambiar dropdown automáticamente si detecta +33 "Paris"
  4. Validar que tenga formato correcto para ese país

- **Validaciones por país:**
  ```javascript
  ES (+34): 9-digit, starts with 6,7,8,9
  FR (+33): 9-digit, starts with 1-9
  IT (+39): 10-digit, starts with 2-6,8,9
  DE (+49): 10-11 digits, starts with 2-9
  UK (+44): 10-digit, starts with 2-9
  ```

- **UX Fluida:**
  - No mostrar errores mientras escribe
  - Al salir del campo: validar y mostrar error si es necesario
  - Sugerir formato correcto
  - Aceptar formatos: "+34 677 12 34 56", "677121234", "+34677121234", "677 12 34 56"

#### Mensaje (OPCIONAL)
- Textarea pequeño
- Placeholder: "Ej. El piso tiene reforma moderna, ascensor, terraza"
- Nota: "Información que te ayude en la tasación"
- Máximo 500 caracteres (suave, sin error)

### Validaciones Generales

**Email:**
```javascript
if (email) {
  // validar si tiene contenido
  if (!isValidEmail(email)) showError();
} else {
  // email vacío está bien ✓
  return true;
}
```

**Teléfono:**
```javascript
// Limpiar: quitar espacios, dashes, +34 al inicio
// Validar por país según indicativo
// Si es +34 y ES válido → OK
// Si es +33 y FR válido → OK
// Etc.
```

**Ref. Catastral (si se usa):**
```javascript
if (refCatastral) {
  if (refCatastral.length !== 22) showError("Debe tener 22 caracteres");
  // Intenta búsqueda API
}
// Si está vacío → no hay problema, ya encontramos por dirección
```

## Transiciones entre Steps

```
Step 1 [Venta/Alquiler] → Step 2 [Tipo de bien]
             ↓
Step 2 [Tipo de bien] → Step 3 [Dirección]
             ↓
Step 3 [Dirección] → (SE BUSCA EN CATASTRO)
             ↓
    ✓ Encontrado → Step 5 [Revisión]
    ✗ No encontrado → Mostrar ref.Catastral en Step 3
             ↓
Step 4 [Piso/Puerta] (SOLO SI es Piso/Apartamento)
             ↓
Step 5 [Revisión & Ref. Catastral]
             ↓
Step 6 [Contacto]
             ↓
        [ENVIAR ✓]
```

## Estado Global del Formulario

```typescript
interface SellFormState {
  // STEP 1
  operationType: 'venta' | 'alquiler';
  
  // STEP 2
  propertyType: 'piso' | 'chalet' | 'adosado' | 'pareado' | 'esquinero' | 
                'local' | 'oficina' | 'trastero' | 'garaje' | 'terreno_urbano' | 
                'terreno_urbanizable' | 'terreno_rustico' | 'otra';
  propertyTypeOther?: string;
  
  // STEP 3 (Address)
  provincia: string;
  municipio: string;
  tipoVia: string;
  via: string;
  numero: string;
  refCatastralManual?: string;
  
  // STEP 4 (Details - Optional)
  pisoPlanta?: string;
  piso?: string;
  puerta?: string;
  
  // STEP 5 (Property from Catastro)
  propertyFromCatastro?: CatastroProperty;
  
  // STEP 6 (Contact)
  nombre: string;
  email?: string;
  telefono: string;
  indicativoPais: string; // ej. "+34"
  mensaje?: string;
}
```

## Beneficios del Nuevo Flujo

✅ **Para el usuario:**
- Claridad desde el inicio (¿venta o alquiler?)
- Pregunta sobre tipo de bien ANTES de buscar
- Camino claro hacia el objetivo
- Email opcional, menos fricción
- Teléfono inteligente con validación por país
- Referencia catastral como "plan B", no como requisito

✅ **Para el negocio:**
- Diferencia entre venta/alquiler en leads
- Tipo de bien clasificado automáticamente
- Mejor calidad de datos
- Más conversiones (menos campos requeridos)
- Información de contacto más completa

✅ **Para SEO/Analytics:**
- Cada step es un evento trackeable
- Embudo de conversión claro
- Tipos de propiedad identificados
- Operación (venta/alquiler) diferenciada

## Base de Datos - Tabla leads_valuation

```sql
CREATE TABLE leads_valuation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- STEP 1
  operation_type VARCHAR(20) NOT NULL, -- 'venta' | 'alquiler'
  
  -- STEP 2
  property_type VARCHAR(50) NOT NULL,
  property_type_other VARCHAR(100),
  
  -- STEP 3
  provincia VARCHAR(100),
  municipio VARCHAR(100),
  tipo_via VARCHAR(50),
  via VARCHAR(200),
  numero VARCHAR(50),
  ref_catastral_manual VARCHAR(22),
  
  -- STEP 4
  piso_planta VARCHAR(50),
  puerta VARCHAR(50),
  
  -- STEP 5
  catastro_data JSONB,
  
  -- STEP 6
  user_name VARCHAR(150) NOT NULL,
  user_email VARCHAR(255),
  user_phone VARCHAR(20) NOT NULL,
  user_country_code VARCHAR(5) NOT NULL, -- '+34', '+33', etc.
  user_message TEXT,
  
  -- Meta
  completed BOOLEAN DEFAULT false,
  estimated_value DECIMAL,
  status VARCHAR(50) DEFAULT 'new' -- 'new', 'contacted', 'scheduled', 'completed'
);
```

## Próximos Pasos

1. **Crear componentes modulares:**
   - `OperationTypeStep.tsx`
   - `PropertyTypeStep.tsx`
   - `AddressSearchStep.tsx`
   - `PropertyDetailsStep.tsx` (piso/puerta)
   - `PropertyReviewStep.tsx` (ref.catastral aquí)
   - `ContactFormStep.tsx` (teléfono inteligente)

2. **Lógica de teléfono:**
   - Crear hook `usePhoneValidation(indicativoPais)`
   - Soportar detección automática de país
   - Validaciones por país

3. **Migracion de datos:**
   - Ejecutar SQL de migración en Supabase
   - Mantener compatibilidad con leads antiguos

4. **Testing:**
   - Test de cada step
   - Validaciones de teléfono para 5+ países
   - Flujo completo end-to-end

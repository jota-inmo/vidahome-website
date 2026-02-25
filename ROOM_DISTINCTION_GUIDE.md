# 🏠 Room Distinction Implementation Guide

## Overview
Este documento describe cómo hemos actualizado la captura de datos para distinguir entre **habitaciones simples** y **habitaciones dobles**.

## ¿Por qué?
Aunque en la web mostramos el total de habitaciones (simples + dobles), el backend ahora captura y almacena estos datos por separado para:
- Análisis detallado de propiedades
- Filtrado avanzado en futuras features
- Mejor entendimiento de la distribución de espacios

## Estructura de Datos

### Campo de Inmovilla → Campo en Supabase

```
Inmovilla:
- habitaciones     → habitaciones_simples (en property_features)
- habdobles        → habitaciones_dobles (en property_features)

Computed:
- habitaciones_simples + habitaciones_dobles = habitaciones (total en property_features)
```

### Tabla property_features - Nuevos campos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `habitaciones` | INTEGER | Total (simples + dobles) |
| `habitaciones_simples` | INTEGER | Dormitorios individuales |
| `habitaciones_dobles` | INTEGER | Dormitorios dobles/matrimoniales |

## Implementación

### Paso 1: Ejecutar la migración en Supabase ✅

**Location**: `migration-add-habitaciones-fields.sql`

Ve a **Supabase Dashboard → SQL Editor** y ejecuta:

```sql
-- Add new columns if they don't exist
ALTER TABLE public.property_features
ADD COLUMN IF NOT EXISTS habitaciones_simples INTEGER DEFAULT 0;

ALTER TABLE public.property_features
ADD COLUMN IF NOT EXISTS habitaciones_dobles INTEGER DEFAULT 0;

-- Create indexes for room searches
CREATE INDEX IF NOT EXISTS idx_property_features_habitaciones_simples 
  ON public.property_features(habitaciones_simples);

CREATE INDEX IF NOT EXISTS idx_property_features_habitaciones_dobles 
  ON public.property_features(habitaciones_dobles);
```

**Time**: ~30 segundos

### Paso 2: Ejecutar el backfill ✅

```powershell
npm run backfill-property-features
```

Esto llenará todos los registros existentes con los datos separados de habitaciones simples y dobles.

**Expected Result**:
```
✅ Backfill Complete:
   Upserted: 77
   Errors: 0
   Total: 77
```

### Paso 3: Verificar la implementación

```powershell
npm run verify-room-distinction
```

**Expected Output**:
```
📊 Found 77 properties

📈 Room Type Distribution:
  • Properties with any rooms: 75/77
  • Properties with simple rooms: 45/77
  • Properties with double rooms: 50/77
  • Properties with BOTH: 30/77 ✨
  • Only simple: 15/77
  • Only double: 20/77

✅ Verification - Habitaciones Sum Check:
  ✓ Correct: 77/77
```

## Archivos Modificados

### 1. **migration-property-features.sql**
- Agregados comentarios explicativos
- Estructura original se mantiene compatible

### 2. **migration-add-habitaciones-fields.sql** (NUEVO)
- Migración para agregar `habitaciones_simples` y `habitaciones_dobles`
- Agrega índices para búsqueda rápida
- Incluye constraint para validar suma

### 3. **src/app/actions/inmovilla.ts**
```typescript
// Ahora calcula correctamente:
const habitacionesSimples = details.habitaciones || 0;
const habitacionesDobles = details.habdobles || 0;
const totalHabitaciones = habitacionesSimples + habitacionesDobles;

// Y guarda los tres valores:
const featureData = {
  habitaciones: totalHabitaciones,
  habitaciones_simples: habitacionesSimples,
  habitaciones_dobles: habitacionesDobles,
  // ...
};
```

### 4. **scripts/backfill-property-features.ts**
- Actualizado para extraer `habdobles` de Inmovilla
- Calcula suma correctamente

### 5. **scripts/finalize-backfill.ts**
- Idem al anterior

### 6. **scripts/verify-room-distinction.ts** (NUEVO)
- Verifica la integridad de la distinción de habitaciones
- Muestra estadísticas de distribución
- Valida que la suma sea correcta

### 7. **src/types/inmovilla.ts**
- Agregado `habdobles?: number;` a `PropertyListEntry`
- Agregado `habdobles?: number;` a `PropertyDetails`

## Uso en Componentes Frontend

### Mostrar solo el total (como antes):
```tsx
<p>Habitaciones: {property.habitaciones}</p>
```

### Mostrar desglose (opcional):
```tsx
<p>
  Habitaciones: {property.habitaciones_simples} simples + {property.habitaciones_dobles} dobles
</p>
```

### Filtrar por tipo:
```typescript
// Buscar propiedades con solo habitaciones dobles (ej: apartamentos grandes)
const bigBedrooms = await supabase
  .from('property_features')
  .select('*')
  .gt('habitaciones_dobles', 2);

// Buscar propiedades con habitaciones simples (ej: reformas, pensiones)
const smallBedrooms = await supabase
  .from('property_features')
  .select('*')
  .gt('habitaciones_simples', 0);
```

## Changelog

**Commit**: [link]
**Date**: 2026-02-25
**Changes**:
- ✅ Agregada distinción simple/doble en captura de datos
- ✅ Actualizado sync incremental
- ✅ Migración lista para Supabase
- ✅ Scripts de verificación
- ✅ Tipos TypeScript actualizados

## Testing Checklist

- [ ] Migración ejecutada en Supabase
- [ ] Backfill completado sin errores
- [ ] 77/77 propiedades con datos
- [ ] Suma de habitaciones verificada
- [ ] Frontend muestra datos correctamente
- [ ] Nuevas propiedades capturan ambos datos

## Future Improvements

1. **Advanced Filtering**: Agregar filtros por tipo de habitación en búsqueda
2. **Analytics Dashboard**: Mostrar distribución de tipos de habitaciones
3. **Recomendaciones**: Sugerir propiedades basadas en preferencia de tipo de habitación
4. **API Endpoint**: Crear `/api/search?simple_rooms=2&double_rooms=1`

## Questions?

Para cambios futuros en la estructura de datos, revisar `PROJECT_CONTEXT_LOG.md` Sección 13 sobre consolidación de tablas.

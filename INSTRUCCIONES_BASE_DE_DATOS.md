# 🔧 Solución: Tabla `leads_valuation_v2` no encontrada

## Problema
```
Could not find the table 'public.leads_valuation_v2' in the schema cache
```

La tabla no existe en tu base de datos de Supabase.

## Solución: Ejecutar SQL en Supabase

### Opción 1: Desde el Dashboard de Supabase (Recomendado)

1. **Ir al editor SQL:**
   - Abre tu proyecto en https://supabase.com/dashboard
   - Ve a **SQL Editor** en el menú lateral

2. **Ejecutar el script:**
   - Abre el archivo: `sql/CREATE_leads_valuation_v2_UPDATED.sql`
   - Copia todo el contenido
   - Pégalo en el editor SQL de Supabase
   - Haz clic en **Run** (▶️)

3. **Verificar:**
   - Ve a **Table Editor**
   - Busca la tabla `leads_valuation_v2`
   - Deberías ver las columnas: habitaciones, banos, notas_adicionales

### Opción 2: Desde terminal con Supabase CLI

```bash
# Si tienes Supabase CLI instalado
supabase db push
```

## Columnas importantes en la tabla actualizada:

```sql
-- Nuevos campos para detalles del inmueble:
habitaciones INTEGER,           -- Número de habitaciones
banos INTEGER,                  -- Número de baños  
notas_adicionales TEXT,         -- Información adicional opcional

-- Ya NO incluye (campos obsoletos eliminados):
-- piso_planta VARCHAR(50),
-- puerta VARCHAR(50),
```

## Después de ejecutar el SQL

1. **Prueba el formulario:**
   - Ve a `/vender` en tu sitio
   - Completa el formulario hasta el final
   - Verifica que se guarda correctamente

2. **Verifica los datos:**
   - En Supabase Dashboard → Table Editor
   - Abre `leads_valuation_v2`
   - Revisa que los registros tienen habitaciones, banos, notas_adicionales

## Nota sobre políticas RLS

La tabla tiene Row Level Security (RLS) habilitado:
- ✅ Cualquiera puede INSERTAR (necesario para el formulario público)
- ✅ Solo admins pueden VER los datos
- ✅ Los emails con `@vidahome` también pueden ver

## Si ya tenías una tabla leads_valuation_v2 antigua

Si quieres mantener los datos existentes, ejecuta en su lugar:

```sql
-- Solo agregar las nuevas columnas
ALTER TABLE leads_valuation_v2 
  ADD COLUMN IF NOT EXISTS habitaciones INTEGER,
  ADD COLUMN IF NOT EXISTS banos INTEGER,
  ADD COLUMN IF NOT EXISTS notas_adicionales TEXT;
```

¡Listo! Después de ejecutar el SQL, el formulario funcionará correctamente.

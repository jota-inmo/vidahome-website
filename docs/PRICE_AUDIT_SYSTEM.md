# 💰 Price Change Audit System

## Descripción

Sistema automático de auditoría de cambios de precio. Cada vez que sincronizas propiedades desde Inmovilla:

- ✅ **Nuevas propiedades**: Se registran con su precio inicial
- 📈 **Precio sube**: Se registra el cambio + porcentaje
- 📉 **Precio baja**: Se registra el cambio + porcentaje  
- 🔒 **Datos preservados**: Fotos, traducciones y metadatos NO se sobrescriben

---

## 🚀 Setup (Una sola vez)

### 1. Crear tabla `price_audit`

```powershell
# Opción A: Via script (automático)
npm run setup:price-audit

# Opción B: Via Supabase Dashboard (manual)
# 1. Vai a Supabase → SQL Editor
# 2. Copia el contenido de: migrations/create_price_audit_table.sql
# 3. Ejecuta el SQL
```

### 2. Verificar que se creó

```powershell
npx tsx -e "
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const { data, error } = await supabase
  .from('price_audit')
  .select('id')
  .limit(1);

console.log(error ? '❌ Table not found' : '✅ Table exists');
"
```

---

## 📊 Schema

| Campo | Tipo | Descripción |
|-------|------|------------|
| `id` | BIGSERIAL | PK auto-increment |
| `cod_ofer` | INTEGER | FK a property_metadata |
| `old_price` | INTEGER | Precio anterior (NULL si es nueva) |
| `new_price` | INTEGER | Precio actual |
| `price_change` | INTEGER | Diferencia en € (new - old) |
| `percentage_change` | NUMERIC(5,2) | Cambio % ((new-old)/old*100) |
| `changed_by` | TEXT | Quién cambió: 'system' o email |
| `changed_at` | TIMESTAMPTZ | Cuándo |
| `notes` | TEXT | Notas opcionales |

---

## 📈 Ejemplo de datos

```
COD 26286665:
  08:00 → Sync: €450,000 → €450,000 (sin cambio)
  14:00 → Sync: €450,000 → €445,000 📉 -1.1%
  
COD 26286590:
  10:00 → Sync: NUEVA → €550,000
  12:00 → Sync: €550,000 → €565,000 📈 +2.7%
  18:00 → Sync: €565,000 → €565,000 (sin cambio)
```

---

## 🔍 Consultas útiles

### Ver todos los cambios de precio hoy

```sql
SELECT 
  cod_ofer,
  old_price,
  new_price,
  price_change,
  percentage_change,
  changed_at
FROM price_audit
WHERE DATE(changed_at) = CURRENT_DATE
ORDER BY changed_at DESC;
```

### Ver propiedades con mayor aumento

```sql
SELECT 
  cod_ofer,
  old_price,
  new_price,
  percentage_change,
  changed_at
FROM price_audit
WHERE percentage_change > 5
ORDER BY percentage_change DESC
LIMIT 10;
```

### Ver historial de una propiedad

```sql
SELECT 
  old_price,
  new_price,
  price_change,
  percentage_change,
  changed_at,
  notes
FROM price_audit
WHERE cod_ofer = 26286665
ORDER BY changed_at DESC;
```

### Estadísticas de cambios

```sql
SELECT 
  COUNT(*) as total_changes,
  COUNT(CASE WHEN price_change > 0 THEN 1 END) as increases,
  COUNT(CASE WHEN price_change < 0 THEN 1 END) as decreases,
  COUNT(CASE WHEN price_change = 0 OR price_change IS NULL THEN 1 END) as no_change,
  ROUND(AVG(ABS(percentage_change))::numeric, 2) as avg_change_percent,
  MAX(percentage_change) as max_increase_percent,
  MIN(percentage_change) as max_decrease_percent
FROM price_audit
WHERE DATE(changed_at) >= CURRENT_DATE - INTERVAL '7 days';
```

---

## 🛡️ Datos que se PRESERVAN

Durante sync, estos datos NO se sobrescriben:

| Dato | Si es NEW | Si EXISTE |
|------|-----------|----------|
| Fotos | ✅ Se agregan | Solo si cambió cantidad |
| Traducciones (EN/FR/DE/IT/PL) | ❌ No (solo ES) | ✅ PRESERVADAS |
| Descripción manual | ❌ No (solo ES) | ✅ PRESERVADA |
| Precio | ✅ Se agrega | ✅ SE ACTUALIZA |
| Metadatos (tipo, población, etc) | ✅ Se agregan | ✅ Se actualizan |

---

## 💻 Uso de APIs

### Desde admin/sync panel

```typescript
// Automáticamente usa la lógica smart
const result = await syncPropertiesFromInmovillaAction();
```

### Desde cron automático

```
Cada hora 08:00-20:00 UTC:
  GET /api/sync/cron
    ↓
  syncPropertiesFromInmovillaAction()
    ↓
  Precios actualizados + Auditoría registrada
```

---

## 📊 Visualización en Dashboard

Para agregar un widget visual, puedes crear una página `/admin/price-audit`:

```sql
-- Query para widget
SELECT 
  'Total changes today' as metric,
  COUNT(*) as value
FROM price_audit
WHERE DATE(changed_at) = CURRENT_DATE

UNION ALL

SELECT 
  'Avg price increase %' as metric,
  ROUND(AVG(CASE WHEN price_change > 0 THEN percentage_change END)::numeric, 1) as value
FROM price_audit
WHERE DATE(changed_at) = CURRENT_DATE AND price_change > 0

UNION ALL

SELECT 
  'Properties updated today' as metric,
  COUNT(DISTINCT cod_ofer) as value
FROM price_audit
WHERE DATE(changed_at) = CURRENT_DATE;
```

---

## 🔧 Cambios en código

### syncPropertiesFromInmovillaAction()

**ANTES** (sobrescribía todo):
```typescript
const { error } = await supabaseAdmin
  .from('property_metadata')
  .upsert(upsertData, { onConflict: 'cod_ofer' });
```

**AHORA** (Smart update):
```typescript
if (existing) {
  // Propiedad existe: actualiza solo precio + fotos
  recordPriceChange(supabaseAdmin, cod_ofer, oldPrice, newPrice);
  smartUpdateProperty(supabaseAdmin, cod_ofer, newData, existing);
} else {
  // Propiedad nueva: inserta todo
  supabaseAdmin.from('property_metadata').insert(insertData);
}
```

---

## ✨ Beneficios

| Beneficio | Valor |
|-----------|-------|
| **Auditoría completa** | Sabe exactamente cuándo y cómo cambió el precio |
| **Datos seguros** | Traducciones manualmente hechas no se pierden |
| **Histórico** | Navega cambios de precio en el tiempo |
| **Análisis** | Identifica patrones de precios |
| **Compliance** | Registra todos los cambios para auditoría |

---

## ❓ Preguntas frecuentes

**P: ¿Se sobrescriben las fotos?**
A: Solo si cambia la cantidad. Si había 15 fotos y sigue habiendo 15, se preservan. Si cambia a 16, se actualiza el array.

**P: ¿Se pierden las traducciones?**
A: NO. Las traducciones EN/FR/DE/IT/PL se preservan automáticamente.

**P: ¿Qué pasa con los metadatos manuales?**
A: Se preservan. El sync solo actualiza: precio, photos (si count cambió), metadata (tipo, población, etc).

**P: ¿Cómo veo el historial?**
A: Usa la tabla `price_audit` directamente en Supabase SQL Editor o crea un dashboard con las queries de arriba.

**P: ¿Puedo eliminar registros de auditoria?**
A: No se recomienda. El historial es importante para compliance. Pero puedes hacer VACUUM si necesitas limpiar.

---

## 📞 Troubleshooting

**P: table "price_audit" does not exist**
A: Ejecuta `npm run setup:price-audit` primero

**P: No veo cambios de precio registrados**
A: Verifica que la tabla exista y que el precio realmente haya cambiado en Inmovilla

**P: Quiero ver solo cambios últimas 24h**
A: `SELECT * FROM price_audit WHERE changed_at > NOW() - INTERVAL '24 hours'`

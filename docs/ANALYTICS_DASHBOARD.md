# 📊 Analytics Dashboard - Guía de Implementación

## ✅ Lo que Hemos Creado

### 1. **Schema SQL de Analytics** (`sql/analytics-schema.sql`)
- 5 tablas para tracking: `analytics_property_views`, `analytics_leads`, `analytics_valuations`, `analytics_page_views`, `analytics_searches`
- Indexes optimizados para queries rápidas
- RLS (Row Level Security) policies para seguridad

### 2. **Hook Cliente** (`src/lib/hooks/useAnalytics.ts`)
```typescript
// En cualquier componente client-side:
const analytics = useAnalytics();
analytics.trackPropertyView('COD-123');
analytics.trackSearch('apartamento 3 habitaciones', 15);
analytics.trackConversion({ type: 'contact_form', propertyId: 'COD-123' });
```

### 3. **Server Action** (`src/app/actions/analytics.ts`)
```typescript
const metrics = await getAnalyticsDashboard(30); // últimos 30 días
// Retorna: totalLeads, topProperties, leadsBy (date/locale/source), conversion rate, etc.
```

### 4. **Dashboard Component** (`src/components/AnalyticsDashboard.tsx`)
- 4 KPI cards (Vistas, Leads, Tasaciones, Conversión)
- Gráficos Recharts: línea, barras, pie chart
- Tabla con top 10 propiedades
- Selector de período (7/30/90/365 días)

### 5. **Admin Page** (`src/app/[locale]/admin/analytics/page.tsx`)
- Página accesible en `/es/admin/analytics` (o `/en/admin/analytics`)
- Layout completo con header y footer note

---

## 🚀 Próximos Pasos

### **PASO 1: Ejecutar SQL Schema en Supabase** (CRÍTICO)

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Abre tu proyecto
3. Ve a **SQL Editor** → **+ New Query**
4. Copia el contenido de `sql/analytics-schema.sql`
5. Pega en el editor
6. Haz click en **Run**

Resultado esperado: "5 statements executed successfully"

---

### **PASO 2: Integrar Tracking en Componentes** (IMPORTANTE)

El hook está listo, solo necesitas agregarlo a estos componentes:

#### **A) En `src/components/LuxuryPropertyCard.tsx`** (Click en propiedad)
```typescript
'use client';
import { useAnalytics } from '@/lib/hooks/useAnalytics';

export function LuxuryPropertyCard({ property, onClick }) {
  const analytics = useAnalytics();
  
  const handleClick = () => {
    analytics.trackPropertyView(property.cod_ofer);
    onClick?.();
  };
  
  return (
    <button onClick={handleClick}>
      {/* card content */}
    </button>
  );
}
```

#### **B) En formulario de contacto** (Lead generado)
```typescript
const handleSubmit = async (e) => {
  e.preventDefault();
  analytics.trackConversion({ 
    type: 'contact_form',
    propertyId: propertyId // si es para una propiedad específica
  });
  // ... enviar formulario
};
```

#### **C) En búsqueda de catálogo** (Search query)
```typescript
const handleSearch = (query: string) => {
  const results = properties.filter(p => 
    p.title.includes(query) // o tu lógica
  );
  analytics.trackSearch(query, results.length);
  setFilteredResults(results);
};
```

---

### **PASO 3: Verificar que Todo Funciona**

1. **Local Testing**:
   ```bash
   npm run dev
   # Abre: http://localhost:3000/es/admin/analytics (o /en/admin)
   # Deberías ver gráficos vacíos (sin datos yet)
   ```

2. **Generar datos de prueba** (opcional):
   ```sql
   -- En Supabase SQL Editor, ejecuta:
   INSERT INTO analytics_property_views (cod_ofer, locale) 
   SELECT 'COD-123', 'es' FROM generate_series(1, 100);
   
   INSERT INTO analytics_leads (email, source, locale) 
   SELECT 'test@example.com', 'contact_form', 'es' FROM generate_series(1, 50);
   ```

3. **Refrescar dashboard**: F5 en `/admin/analytics`

---

## 📊 Dashboard Features

### **KPI Cards**
- **Vistas de Propiedad**: Total de property detail page views
- **Leads Generados**: Total de formularios de contacto + tasaciones
- **Tasaciones**: Solicitudes de valuación
- **Tasa Conversión**: (Leads / Vistas) * 100

### **Gráficos**
1. **Leads por Día** (LineChart)
   - X: Fecha
   - Y: Número de leads
   - Tendencia diaria

2. **Leads por Idioma** (BarChart)
   - Desglose: es, en, fr, de, it, pt
   - Cuál idioma genera más leads

3. **Origen de Leads** (PieChart)
   - contact_form, property_card, search, etc.
   - Proporciones de cada fuente

4. **Embudo de Conversión** (Funnel)
   - Vistas → Leads
   - Porcentaje de conversión

5. **Top 10 Propiedades** (Tabla)
   - Cod_ofer, Vistas, Leads, Conv. Rate
   - Ordenado por vistas

6. **Top Búsquedas** (Lista)
   - Queries más frecuentes en catálogo
   - Useful para SEO/marketing

---

## 🔒 Seguridad

### **RLS Policies** (Ya configuradas en schema)
```sql
-- Insert: Public puede insertar (para tracking eventos)
-- Select: Public puede leer agregados
-- Delete/Update: Solo admin (no implementado yet, TODO)
```

**TODO**: Agregar roles y policies para admin-only access:
```sql
-- Solo admin puede hacer DELETE/UPDATE
ALTER POLICY "analytics_leads_insert" ON analytics_leads 
  USING (auth.role() = 'authenticated');

CREATE POLICY "analytics_admin_delete" 
  ON analytics_leads FOR DELETE 
  USING (auth.uid() IN (SELECT user_id FROM admin_users));
```

---

## 🎯 Métricas Calculadas

El server action `getAnalyticsDashboard(days)` calcula automáticamente:

```typescript
// Ejemplo de retorno:
{
  totalPropertyViews: 1250,
  totalLeads: 45,
  totalValuations: 12,
  
  topProperties: [
    { cod_ofer: 'INM-2024-001', views: 156, leads: 8 },
    { cod_ofer: 'INM-2024-002', views: 134, leads: 6 },
    // ... 10 total
  ],
  
  leadsBy: {
    date: [
      { date: '2024-01-01', count: 3 },
      { date: '2024-01-02', count: 2 },
      // ... 30 days
    ],
    locale: [
      { locale: 'es', count: 30 },
      { locale: 'en', count: 12 },
      { locale: 'fr', count: 3 },
    ],
    source: [
      { source: 'contact_form', count: 28 },
      { source: 'property_card', count: 12 },
      { source: 'search', count: 5 },
    ],
  },
  
  topSearches: [
    { query: 'apartamento lujo gandia', count: 45 },
    { query: 'casa playa', count: 32 },
    // ... 10 total
  ],
  
  conversion: {
    totalViews: 1250,
    totalLeads: 45,
    conversionRate: 3.6, // porcentaje
  }
}
```

---

## 🛠️ Troubleshooting

### **Problema**: Gráficos vacíos después de ejecutar schema
**Solución**: Los datos se generan cuando usuarios realmente interactúan. Usa `PASO 3` para datos de prueba.

### **Problema**: Error "Cannot find module 'recharts'"
**Solución**: `npm install recharts` (ya hecho ✅)

### **Problema**: "DashboardMetrics not exported"
**Solución**: Verifica que `src/app/actions.ts` tenga:
```typescript
export * from './actions/analytics';
```
✅ Ya actualizado.

### **Problema**: Page loads but shows "Error al cargar datos"
**Solución**: 
1. Verifica que SQL schema esté ejecutado en Supabase
2. Revisa browser console para errores
3. Verifica que Supabase client key esté en `.env.local`

---

## 📈 Roadmap Futuro

- [ ] Admin-only access control (RLS policies)
- [ ] Export data as CSV/PDF
- [ ] Custom date range picker
- [ ] Property-specific drill-down
- [ ] Email reports (daily/weekly)
- [ ] Anomaly detection (alertas si algo anormal)
- [ ] Heatmaps de búsquedas (qué palabras clave buscan)
- [ ] A/B testing integration

---

## 💡 Tips

1. **Performance**: El dashboard re-queries en cada cambio de período. Si hay millones de rows, considera agregar `LIMIT` en `getAnalyticsDashboard()`.

2. **Accuracy**: Los datos son precisos solo si integraste `trackPropertyView()`, `trackSearch()`, `trackConversion()` en todos los puntos de interacción.

3. **Privacy**: Actualmente no guardamos user_id ni cookies para tracking (solo session_id). Es GDPR-friendly pero te pierdes la capacidad de retargeting.

4. **Escalabilidad**: Si ves que los gráficos se cargan lentos (>2s), considera:
   - Aumentar indexes en Supabase
   - Añadir `WHERE created_at > now() - interval '30 days'` (ya está)
   - Usar materialized views para agregados diarios

---

## ✨ Summary

| Item | Status | Location |
|------|--------|----------|
| SQL Schema | ✅ Created, ⏳ Pending Execute | `sql/analytics-schema.sql` |
| Client Hook | ✅ Ready | `src/lib/hooks/useAnalytics.ts` |
| Server Action | ✅ Ready | `src/app/actions/analytics.ts` |
| Dashboard Component | ✅ Ready | `src/components/AnalyticsDashboard.tsx` |
| Admin Page | ✅ Ready | `src/app/[locale]/admin/analytics/page.tsx` |
| Tracking Integration | ⏳ TODO | Various components |
| Recharts | ✅ Installed | `npm packages` |

---

**Next Action**: Ve a Supabase y ejecuta el schema SQL. Luego accede a `/admin/analytics` para ver el dashboard. 🚀

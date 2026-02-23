# 🔗 Analytics Integration Guide

Este documento tiene ejemplos de código para integrar el tracking de analytics en componentes existentes.

## 1. LuxuryPropertyCard - Property View Tracking

**Archivo**: `src/components/LuxuryPropertyCard.tsx`

Añade el hook al inicio y en el click handler:

```typescript
'use client';
import { useAnalytics } from '@/lib/hooks/useAnalytics';

export function LuxuryPropertyCard({ property, onClick, ...props }) {
  const analytics = useAnalytics();

  const handleCardClick = () => {
    // Track property view
    analytics.trackPropertyView(property.cod_ofer);
    
    // Luego ejecutar click handler original si existe
    onClick?.();
  };

  return (
    <div 
      onClick={handleCardClick}
      className="cursor-pointer"
      role="button"
      tabIndex={0}
    >
      {/* resto del card content */}
    </div>
  );
}
```

---

## 2. PropertySearch - Search Query Tracking

**Archivo**: `src/components/PropertySearch.tsx`

Integra en el handler de búsqueda:

```typescript
'use client';
import { useAnalytics } from '@/lib/hooks/useAnalytics';

export function PropertySearch({ onResults, ...props }) {
  const analytics = useAnalytics();

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    
    // Buscar propiedades (tu lógica existente)
    const results = await searchProperties(query);
    
    // 🔥 Track la búsqueda
    analytics.trackSearch(query, results.length);
    
    // Mostrar resultados
    onResults?.(results);
  };

  return (
    <input 
      type="text"
      placeholder="Buscar propiedades..."
      onChange={(e) => handleSearch(e.target.value)}
      {...props}
    />
  );
}
```

---

## 3. ContactForm - Lead Tracking

**Archivo**: `src/components/ContactForm.tsx`

Integra en el submit handler:

```typescript
'use client';
import { useAnalytics } from '@/lib/hooks/useAnalytics';

export function ContactForm({ propertyId, onSuccess, ...props }) {
  const analytics = useAnalytics();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      // Enviar el formulario (tu lógica existente)
      await sendContactForm(formData);
      
      // 🔥 Track la conversión (lead)
      analytics.trackConversion({
        type: 'contact_form',
        propertyId: propertyId || undefined,
        email: formData.get('email') as string,
      });
      
      // Mostrar success message
      showSuccessMessage('¡Mensaje enviado!');
      onSuccess?.();
    } catch (error) {
      console.error('Form submission error:', error);
      showErrorMessage('Error al enviar el mensaje');
    }
  };

  return (
    <form onSubmit={handleSubmit} {...props}>
      {/* form fields */}
    </form>
  );
}
```

---

## 4. Valuation Form - Tasación Tracking

**Archivo**: `src/app/[locale]/vender/page.tsx` o su componente de tasación

Integra en el submit handler:

```typescript
'use client';
import { useAnalytics } from '@/lib/hooks/useAnalytics';

export function ValuationForm() {
  const analytics = useAnalytics();

  const handleValuationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      // Enviar tasación (tu lógica existente)
      const result = await requestValuation(formData);
      
      // 🔥 Track la tasación (es un tipo especial de lead)
      analytics.trackConversion({
        type: 'valuation',
        propertyAddress: formData.get('address') as string,
        email: formData.get('email') as string,
      });
      
      showSuccessMessage('¡Tasación solicitada!');
      return result;
    } catch (error) {
      console.error('Valuation error:', error);
      showErrorMessage('Error al solicitar tasación');
      throw error;
    }
  };

  return (
    <form onSubmit={handleValuationSubmit}>
      {/* form fields */}
    </form>
  );
}
```

---

## 5. PropertyGallery / PropertyDetails - Page View

**Archivo**: `src/components/PropertyGallery.tsx` o `PropertyDetails.tsx`

Integra en useEffect para trackear que el usuario está viendo la propiedad:

```typescript
'use client';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { useEffect } from 'react';

export function PropertyGallery({ codOfer, images, ...props }) {
  const analytics = useAnalytics();
  
  useEffect(() => {
    // 🔥 Track que el usuario está viendo los detalles de esta propiedad
    analytics.trackPropertyView(codOfer);
  }, [codOfer, analytics]);

  return (
    <div>
      {/* gallery content */}
    </div>
  );
}
```

---

## 6. PropertyMap - Auto Tracked

**Archivo**: `src/components/PropertyMap.tsx`

Ya se auto-trackea mediante el pathname en useAnalytics, pero si quieres trackear explícitamente:

```typescript
'use client';
import { useAnalytics } from '@/lib/hooks/useAnalytics';

export function PropertyMap({ codOfer, ...props }) {
  const analytics = useAnalytics();
  
  // Opción 1: Auto-track (ya incluida)
  // Opción 2: Explícito
  // const handleMapView = () => {
  //   analytics.trackPropertyView(codOfer);
  // };

  return (
    <div>
      {/* map content */}
    </div>
  );
}
```

---

## 7. GlobalSchema - Auto Page Views (YA HECHO ✅)

**Archivo**: `src/components/GlobalSchema.tsx`

NO NECESITA CAMBIOS. El hook `useAnalytics` ya auto-trackea page views basado en el pathname en su useEffect.

---

## 8. Admin Hero Editor - Optional

**Archivo**: `src/app/[locale]/admin/hero/page.tsx`

Si quieres trackear cambios en el editor (opcional):

```typescript
'use client';
import { useAnalytics } from '@/lib/hooks/useAnalytics';

const handleHeroUpdate = async (data: HeroData) => {
  const analytics = useAnalytics();
  
  try {
    const result = await updateHeroSettings(data);
    
    // Optional: track admin action
    analytics.trackConversion({
      type: 'admin_action',
      action: 'hero_update',
      email: currentAdmin?.email,
    });
    
    return result;
  } catch (error) {
    console.error('Hero update error:', error);
    throw error;
  }
};
```

---

## 🧪 Testing Analytics

### En el Navegador Console:

```javascript
// Simular eventos de tracking:
const { useAnalytics } = window.__NEXT_DATA_PROPS;

// O mejor, desde un componente:
import { useAnalytics } from '@/lib/hooks/useAnalytics';

const analytics = useAnalytics();
analytics.trackPropertyView('TEST-001');
analytics.trackSearch('test query', 5);
analytics.trackConversion({ type: 'contact_form' });
```

### Verificar en Supabase:

```sql
-- Ver eventos de property views
SELECT * FROM analytics_property_views 
ORDER BY created_at DESC LIMIT 10;

-- Ver eventos de leads
SELECT * FROM analytics_leads 
ORDER BY created_at DESC LIMIT 10;

-- Ver búsquedas
SELECT * FROM analytics_searches 
ORDER BY created_at DESC LIMIT 10;
```

---

## ✅ Integration Checklist

```
SQL & Infrastructure:
✅ SQL schema created (sql/analytics-schema.sql)
⏳ SQL schema executed in Supabase SQL Editor

Code Components:
✅ useAnalytics hook created
✅ getAnalyticsDashboard action created
✅ AnalyticsDashboard component created
✅ /admin/analytics page created
✅ Recharts installed

Integration (TODO):
⏳ LuxuryPropertyCard.tsx - add trackPropertyView
⏳ PropertySearch.tsx - add trackSearch
⏳ ContactForm.tsx - add trackConversion
⏳ Valuation form - add trackConversion
⏳ PropertyGallery.tsx - add trackPropertyView
⏳ PropertyMap.tsx - optional explicit tracking

Testing:
⏳ Execute SQL schema in Supabase
⏳ Test /admin/analytics loads
⏳ Manually trigger tracking events
⏳ Verify data appears in Supabase tables
⏳ Verify charts show data in dashboard

Deployment:
⏳ Deploy to staging
⏳ Test in production-like environment
⏳ Monitor analytics dashboard
⏳ Deploy to production
```

---

## 📊 Expected Data Flow

```
User clicks property card
        ↓
LuxuryPropertyCard.onClick fires
        ↓
analytics.trackPropertyView('COD-123')
        ↓
useAnalytics hook → POST to Supabase (analytics_property_views)
        ↓
Data stored in Supabase
        ↓
getAnalyticsDashboard() queries data
        ↓
AnalyticsDashboard component displays in charts
        ↓
User sees on /admin/analytics
```

---

## 🚀 Quick Start

1. **Copy-paste the relevant code** from sections 1-7 above
2. **Execute SQL schema** in Supabase SQL Editor
3. **Test locally**: `npm run dev`
4. **Trigger events** (click properties, search, submit forms)
5. **Check dashboard**: Go to `/admin/analytics`
6. **Verify data** appears in Supabase tables and charts

---

## 💡 Common Mistakes to Avoid

❌ **Forgetting to add 'use client'** at the top of components using useAnalytics
✅ Add `'use client';` before importing hooks

❌ **Not executing the SQL schema** in Supabase
✅ Go to Supabase → SQL Editor → Copy+Paste+Run

❌ **Trackingometry at wrong time** (e.g., on component mount instead of click)
✅ Track on specific user actions (click, submit, etc.)

❌ **Passing wrong parameters** to tracking functions
✅ Use: `trackPropertyView(cod_ofer)`, `trackSearch(query, count)`, `trackConversion(options)`

---

## 🎯 Priority Integration Order

1. **LuxuryPropertyCard** (most visible, most clicks)
2. **ContactForm** (most important for conversions)
3. **PropertySearch** (SEO insights)
4. **Valuation form** (secondary conversion)
5. **PropertyGallery** (detailed view tracking)

Once all integrated, you'll have complete visibility into user behavior! 📈

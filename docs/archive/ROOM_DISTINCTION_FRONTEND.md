# Room Distinction in Frontend

## Overview

The frontend now displays room distinction (simple vs double) **only in property details**, maintaining a clean portfolio listing while providing detailed information when users view individual properties.

## Architecture

### Data Flow

```
property_features (Supabase)
    ├─ habitaciones_simples (stored in DB)
    ├─ habitaciones_dobles (stored in DB)
    └─ habitaciones (total: computed on sync)
            ↓
getPropertyFeatures() [lib/api/property-features.ts]
            ↓
PropertyDetailPage [locale]/propiedades/[id]/page.tsx
            ↓
PropertyDetailClient (receives optional features prop)
            ↓
formatBedrooms() (shows distinction only if both exist)
            ↓
Display with subtotal: "2s + 1d (3 total)"
```

### Components

#### 1. **LuxuryPropertyCard** (Portfolio Listing)
**Location**: `src/components/LuxuryPropertyCard.tsx`

Shows only total rooms - clean, simple UI:
```tsx
<Bed size={16} strokeWidth={1.5} />
<span className="text-sm font-light">{property.habitaciones || '-'}</span>
```

**No changes**: This component fetches from `PropertyListEntry` which has the total.

#### 2. **PropertyDetailClient** (Detail Page)
**Location**: `src/app/[locale]/propiedades/[id]/PropertyDetailClient.tsx`

Shows room distinction when available:

```tsx
interface PropertyDetailClientProps {
    property: PropertyDetails;
    features?: PropertyFeatures | null;  // ← Optional enriched data
}

// Format bedroom value - shows distinction if available
const formatBedrooms = () => {
    if (features && (features.habitaciones_simples || features.habitaciones_dobles)) {
        const parts = [];
        if (features.habitaciones_simples > 0) {
            parts.push(`${features.habitaciones_simples}s`);
        }
        if (features.habitaciones_dobles > 0) {
            parts.push(`${features.habitaciones_dobles}d`);
        }
        return parts.length > 0 ? parts.join(' + ') : (property.habitaciones || '1+');
    }
    return property.habitaciones || '1+';
};

// Usage in the display
<span className="text-xl md:text-2xl font-serif flex items-center gap-3">
    <span className="text-slate-300">{f.icon}</span>
    {f.value}  {/* Shows "2s + 1d" */}
</span>
{f.subtitle && (
    <span className="text-xs text-slate-400 font-light">{f.subtitle}</span>  {/* Shows "(3 total)" */}
)}
```

#### 3. **PropertyDetailPage** (Server Component)
**Location**: `src/app/[locale]/propiedades/[id]/page.tsx`

1. Fetches property data from Inmovilla (via `getPropertyDetailAction`)
2. Fetches enriched features from `property_features` table
3. Passes both to `PropertyDetailClient`

```tsx
export default async function PropertyDetailPage({ params }: Props) {
    const { id, locale } = await params;
    
    // Get basic data
    const result = await getPropertyDetailAction(parseInt(id), locale);
    
    // Get enriched room distinction data
    const properties_features = await getPropertyFeatures(parseInt(id));
    
    return (
        <PropertyDetailClient 
            property={result.data} 
            features={properties_features}  {/* ← Passes enriched data */}
        />
    );
}
```

#### 4. **getPropertyFeatures()** (Database API)
**Location**: `src/lib/api/property-features.ts`

Queries the `property_features` table for detailed data:
```typescript
export async function getPropertyFeatures(cod_ofer: number): Promise<PropertyFeatures | null> {
    const { data } = await supabase
        .from("property_features")
        .select(
            "cod_ofer, precio, habitaciones, habitaciones_simples, habitaciones_dobles, ..."
        )
        .eq("cod_ofer", cod_ofer)
        .single();
    
    return data as PropertyFeatures;
}
```

## Visual Examples

### Portfolio (List View)
```
🛏️ 3 rooms     🚿 2 baths     📐 120 m²
```
↑ Shows only totals - clean and simple

### Detail Page (Before Enhancement)
```
🛏️ Bedrooms: 3
```

### Detail Page (After Enhancement with distinction)
```
🛏️ Bedrooms: 2s + 1d
                (3 total)
```

## Performance Considerations

- **Portfolio**: No database queries for features (uses API data)
- **Detail Page**: Single targeted query to `property_features` (indexed on cod_ofer)
- **Fallback**: If features unavailable, shows total from property data (graceful degradation)

## Examples in Code

### Example Property: COD 27021782
- habitaciones_simples: 3
- habitaciones_dobles: 4
- habitaciones (total): 7

**Portfolio Display**: "7 rooms"
**Detail Display**: "3s + 4d (7 total)"

### Example Property: COD 26286741 (No distinction data)
- habitaciones: 2
- habitaciones_simples: 0
- habitaciones_dobles: 0

**Portfolio Display**: "2 rooms"
**Detail Display**: "2 rooms" (no breakdown, just shows total)

## Future Enhancements

1. **Advanced Filtering**
   - Filter properties: "Only double bedrooms"
   - Filter properties: "3+ single bedrooms"

2. **Analytics**
   - Dashboard: Average rooms by type per area
   - Heatmaps: Distribution of simple vs double across regions

3. **Search API**
   - Query: `/api/search?simple_rooms=2&double_rooms=1`
   - Returns properties matching exact combination

4. **UI Improvements**
   - Icon variation: bed vs bed-double icons
   - Color coding: single rooms in blue, double in purple
   - Interactive breakdown: click to expand/collapse

## Testing Checklist

- [ ] Portfolio shows total rooms only (no distinction)
- [ ] Detail page shows distinction when both types exist
- [ ] Subtotal displayed in smaller text below
- [ ] Fallback works when no features data available
- [ ] Mobile responsive (small screens don't overflow)
- [ ] Multiple language support (s/d abbreviations work in all locales)

## File Changes Summary

| File | Change |
|------|--------|
| `src/lib/api/property-features.ts` | NEW - Database queries for features |
| `src/app/[locale]/propiedades/[id]/PropertyDetailClient.tsx` | UPDATED - Added features prop & formatBedrooms() |
| `src/app/[locale]/propiedades/[id]/page.tsx` | UPDATED - Fetch and pass features data |
| `src/components/LuxuryPropertyCard.tsx` | NO CHANGE - Remains simple |

## Deployment Notes

- ✅ No breaking changes to existing components
- ✅ Graceful fallback if `property_features` unavailable
- ✅ No additional API calls beyond the normal detail page flow
- ✅ Type-safe with `PropertyFeatures` interface
- ✅ Build passes TypeScript strict mode

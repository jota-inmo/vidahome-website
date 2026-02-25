# Sincronización Incremental de Propiedades

## Problema

El sync tradicional (`syncPropertiesFromInmovillaAction`) intenta sincronizar todas las propiedades de una vez, lo que causa:
- Rate limiting de Inmovilla API
- Errores de conflicto en Supabase ("ON CONFLICT DO UPDATE command cannot affect row a second time")
- Tiempos de espera largos

## Solución: Sincronización en Batches

La nueva función `syncPropertiesIncrementalAction()` sincroniza **solo 10 propiedades cada vez**, con un sistema de progreso.

```
Llamada 1: Props 1-10 ✓
Llamada 2: Props 11-20 ✓
Llamada 3: Props 21-30 ✓
...cada 30 segundos
```

## Instalación

### 1. Ejecutar migración en Supabase

Abre **Supabase → SQL Editor** y ejecuta:

```bash
# Copiar el contenido de: sync-progress-table.sql
# Pegar en Supabase SQL Editor y ejecutar
```

### 2. Agregar SYNC_SECRET a Vercel

En **Vercel Dashboard → Settings → Environment Variables**:

```
SYNC_SECRET = your-super-secret-key-here
```

Ejemplo recomendado:
```
SYNC_SECRET = svx_sync_auto_prod_2026_$(openssl rand -hex 16)
```

### 3. Configurar Cron Job Externo

Opción A: **EasyCron** (recomendado - gratis)

1. Ir a https://www.easycron.com
2. Login / Sign up (gratis)
3. Click "New Cron Job"
4. Configurar:
   - **URL**: `https://vidahome-website.vercel.app/api/admin/sync-incremental?batchSize=10`
   - **Headers**: Agregar header personalizado
     ```
     Authorization: Bearer YOUR_SYNC_SECRET
     ```
   - **Frequency**: Every 30 seconds (o 1 minuto)
   - **Timezone**: UTC
5. Save

Opción B: **GitHub Actions** (free, más confiable)

Crear `.github/workflows/sync-properties.yml`:

```yaml
name: Sync Properties Incrementally

on:
  schedule:
    - cron: '*/1 * * * *'  # Every minute (EasyCron only runs every 1 min)

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger incremental sync
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SYNC_SECRET }}" \
            -H "Content-Type: application/json" \
            -d '{"batchSize": 10}' \
            https://vidahome-website.vercel.app/api/admin/sync-incremental
```

Luego agregar `SYNC_SECRET` en GitHub Secrets.

Opción C: **Vercel Cron Functions** (si tienes plan Pro)

Crear `src/app/api/cron/sync-properties/route.ts`:

```typescript
import { syncPropertiesIncrementalAction } from '@/app/actions/inmovilla';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    // Verify Vercel cron secret
    if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await syncPropertiesIncrementalAction(10);
    return NextResponse.json(result);
}

// Enable cron in vercel.json:
// "crons": [{
//   "path": "/api/cron/sync-properties",
//   "schedule": "*/1 * * * *"
// }]
```

## Testing

Hacer una llamada manual para probar:

```bash
# Sin autenticación (dev)
curl https://vidahome-website.vercel.app/api/admin/sync-incremental

# Con autenticación (prod)
curl -H "Authorization: Bearer YOUR_SYNC_SECRET" \
  https://vidahome-website.vercel.app/api/admin/sync-incremental?batchSize=10
```

Respuesta esperada:
```json
{
  "success": true,
  "synced": 10,
  "total": 145,
  "isComplete": false,
  "message": "Synced 10 properties. 135 remaining.",
}
```

## Monitoreo

Verificar progreso en Supabase:

```sql
SELECT 
  last_synced_cod_ofer,
  total_synced,
  (SELECT COUNT(*) FROM sync_progress) as total_calls,
  last_sync_at,
  status
FROM sync_progress
ORDER BY created_at DESC
LIMIT 5;
```

## Ventajas

✅ Evita rate limits (10 props / 30s = 1200 props/hora)
✅ Sin conflictos de base de datos
✅ Progreso persistente (continue si falla)
✅ Fácil de pausar/reanudar
✅ Se puede hacer en paralelo en múltiples instancias
✅ Logs claros en Vercel

## Parar/Pausar

Simplemente detener el cron job. El siguiente intento continuará desde donde se quedó.

## Resincronizar Todo

Para empezar de 0:

```sql
-- En Supabase SQL Editor
DELETE FROM sync_progress;
DELETE FROM property_metadata WHERE cod_ofer != 0; -- optional
```

Luego reiniciar cron.

## Próximas Mejoras

- [ ] Traducir descriptions automáticamente después del sync
- [ ] Generar thumbnails de fotos
- [ ] Actualizar featured_properties automáticamente
- [ ] Webhooks de Inmovilla para cambios en tiempo real

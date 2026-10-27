# 🔧 Solución: Hero Slides RLS Policy Issue

## Problema Identificado
Las traducciones en Supabase no se guardan porque hay una **política RLS (Row Level Security)** que está bloqueando TODOS los updates, incluso con `SERVICE_ROLE_KEY`.

```
Error: new row violates row-level security policy for table "hero_slides"
```

## Solución

### Paso 1: Desactivar RLS en Supabase
1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto → `SQL Editor`
3. Ejecuta el SQL de `SQL_FIX_HERO_RLS.sql`:

```sql
ALTER TABLE public.hero_slides DISABLE ROW LEVEL SECURITY;
```

### Paso 2: Ejecutar el script de actualización
```bash
cd c:\Users\Admin\.gemini\antigravity\scratch\inmovilla-next-app
npm run tsx scripts/populate-hero-translations.ts
```

O con variables de entorno:
```bash
$env:NEXT_PUBLIC_SUPABASE_URL="https://yheqvroinbcrrpppzdzx.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="tu_key_aqui"
npx tsx scripts/populate-hero-translations.ts
```

### Paso 3: Verificar en Supabase
- Abre la tabla `hero_slides`
- Verifica que el campo `titles` tenga los 6 idiomas:
  - `es` → Hogares excepcionales, experiencia inigualable
  - `en` → Homes that inspire, where luxury finds its place
  - `fr` → Vivre exceptionnellement, au cœur du Grau
  - `de` → Außergewöhnliche Häuser, leidenschaftlich vermittelt
  - `it` → Case straordinarie, dove nascono i vostri sogni
  - `pl` → Niezwykłe mieszkania, doświadczenie bez granic

### Paso 4: Re-habilitar RLS (Opcional)
Una vez confirmado que funcionó, puedes re-habilitar RLS:

```sql
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
```

## Archivos relacionados
- `scripts/populate-hero-translations.ts` - Script para poblar traducciones
- `scripts/fix-hero-translations.ts` - Script de debug (alternativo)
- `src/app/actions/populate-hero-titles.ts` - Server Action (si necesitas desde app)

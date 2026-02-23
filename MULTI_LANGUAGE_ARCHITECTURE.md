# 🌍 Arquitectura Multi-Idioma Escalable (2026 Roadmap)

**Estado Actual**: ES + EN cacheados en Supabase  
**Objetivo**: Preparar infraestructura para 5+ idiomas sin cambios en componentes  
**Enfoque**: DRY, serverless-friendly, SEO-first

---

## 📐 Arquitectura Propuesta

### 1. **Tabla de Configuración de Idiomas** (Supabase)

```sql
-- Tabla nueva: i18n_config
CREATE TABLE i18n_config (
    locale VARCHAR(5) PRIMARY KEY, -- 'es', 'en', 'fr', 'de', 'it', 'pt'
    name VARCHAR(50) NOT NULL,     -- 'Español', 'English', 'Français'
    flag_emoji VARCHAR(2),         -- '🇪🇸', '🇬🇧', '🇫🇷'
    is_active BOOLEAN DEFAULT true,
    seo_priority INTEGER DEFAULT 0, -- 1=main, 2=secondary (para hreflang)
    direction VARCHAR(3) DEFAULT 'ltr', -- 'ltr' o 'rtl' (árabe, hebreo futuro)
    created_at TIMESTAMP DEFAULT now()
);

INSERT INTO i18n_config (locale, name, flag_emoji, seo_priority) VALUES
('es', 'Español', '🇪🇸', 1),
('en', 'English', '🇬🇧', 2),
('fr', 'Français', '🇫🇷', 0),
('de', 'Deutsch', '🇩🇪', 0),
('it', 'Italiano', '🇮🇹', 0),
('pt', 'Português', '🇵🇹', 0);

-- Index para lectura rápida
CREATE INDEX idx_i18n_config_active ON i18n_config(is_active);
```

---

### 2. **Estructura de Traducciones Centralizada**

**Problema Actual**: Las traducciones están en `messages/{locale}.json` y dispersas en Supabase.

**Solución Nueva**: Centralizar + cachear dinámicamente.

```typescript
// src/lib/i18n/translations.ts

import { unstable_cache } from 'next/cache';

// Tipos seguros
export type TranslationKey = 
    | 'hero.title'
    | 'hero.subtitle'
    | 'nav.home'
    | 'nav.properties'
    | 'nav.contact'
    | 'property.price'
    | 'property.area'
    | 'property.rooms'
    // ... (generar automáticamente desde los archivos JSON)

export type Locale = 'es' | 'en' | 'fr' | 'de' | 'it' | 'pt';

// Cache por locale
const getCachedTranslations = unstable_cache(
    async (locale: Locale) => {
        // Opción 1: JSON estático (actual)
        try {
            const translations = await import(`@/messages/${locale}.json`);
            return translations.default;
        } catch (e) {
            console.warn(`Translations for ${locale} not found, falling back to Spanish`);
            const fallback = await import('@/messages/es.json');
            return fallback.default;
        }
    },
    [`translations_${locale}`],
    { revalidate: 86400, tags: ['translations'] } // Cachear 24h
);

export async function getTranslation(locale: Locale, key: TranslationKey): Promise<string> {
    const translations = await getCachedTranslations(locale);
    const parts = key.split('.');
    
    let current = translations;
    for (const part of parts) {
        current = current?.[part];
    }
    
    return current || key; // Fallback: mostrar la clave
}
```

---

### 3. **Auto-Traducción Smart (Traducción on-demand)**

**Problema Actual**: Solo traduce si llama a IA.  
**Solución**: Queue de traducción + fallback a español.

```typescript
// src/lib/i18n/auto-translator.ts

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_URL!,
    token: process.env.UPSTASH_REDIS_TOKEN!,
});

// Límite de traducciones simultáneas (no saturar Hugging Face)
const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '60s'), // 10 traducciones/min
});

export async function translateWithQueue(
    text: string,
    fromLocale: Locale,
    toLocale: Locale,
    cod_ofer: number,
    priority: 'high' | 'normal' = 'normal'
) {
    // Evitar traducir lo ya traducido
    const existing = await getTranslationFromCache(cod_ofer, toLocale);
    if (existing) return existing;

    // Verificar rate limit
    const { success } = await ratelimit.limit(`translate-${cod_ofer}`);
    if (!success) {
        console.log(`[Translator] Rate limited for ${cod_ofer}, returning Spanish fallback`);
        return await getTranslationFromCache(cod_ofer, 'es');
    }

    // Encolar traducción en background
    // (Usar Vercel Cron o una tabla de "pending_translations")
    await enqueuePendingTranslation({
        cod_ofer,
        fromLocale,
        toLocale,
        text,
        priority,
    });

    // Retornar español mientras se traduce en background
    return text;
}

async function enqueuePendingTranslation(job: any) {
    const { supabaseAdmin } = await import('@/lib/supabase-admin');
    
    await supabaseAdmin.from('pending_translations').insert({
        cod_ofer: job.cod_ofer,
        from_locale: job.fromLocale,
        to_locale: job.toLocale,
        text: job.text,
        priority: job.priority,
        status: 'pending',
        created_at: new Date().toISOString(),
    });
}
```

**Tabla Supabase**:
```sql
CREATE TABLE pending_translations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cod_ofer INTEGER NOT NULL,
    from_locale VARCHAR(5) NOT NULL,
    to_locale VARCHAR(5) NOT NULL,
    text TEXT NOT NULL,
    priority VARCHAR(10) DEFAULT 'normal',
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'done', 'failed'
    result TEXT,
    error_message TEXT,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT now(),
    processed_at TIMESTAMP,
    
    UNIQUE(cod_ofer, to_locale)
);

CREATE INDEX idx_pending_translations_status ON pending_translations(status, priority);
```

---

### 4. **Cron Job para Traducir en Background**

```typescript
// src/app/api/cron/process-translations/route.ts

export async function POST(req: Request) {
    // Verificar que el request viene de Vercel Cron (header: Authorization)
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    const { supabaseAdmin } = await import('@/lib/supabase-admin');
    const { translateText } = await import('@/lib/api/translator');

    // Obtener máximo 5 traducciones pendientes (para no sobrecargar)
    const { data: pending } = await supabaseAdmin
        .from('pending_translations')
        .select('*')
        .eq('status', 'pending')
        .order('priority', { ascending: false })
        .limit(5);

    if (!pending?.length) {
        return Response.json({ processed: 0 });
    }

    let processed = 0;

    for (const job of pending) {
        try {
            const translated = await translateText(
                job.text,
                job.from_locale,
                job.to_locale,
                8000 // timeout 8s
            );

            await supabaseAdmin
                .from('pending_translations')
                .update({
                    status: 'done',
                    result: translated,
                    processed_at: new Date().toISOString(),
                })
                .eq('id', job.id);

            // Actualizar property_metadata con la traducción completada
            const { data: metadata } = await supabaseAdmin
                .from('property_metadata')
                .select('descriptions')
                .eq('cod_ofer', job.cod_ofer)
                .single();

            if (metadata) {
                const descriptions = metadata.descriptions || {};
                descriptions[job.to_locale] = translated;

                await supabaseAdmin
                    .from('property_metadata')
                    .update({ descriptions })
                    .eq('cod_ofer', job.cod_ofer);
            }

            processed++;
        } catch (error) {
            console.error(`[Translator Cron] Error translating ${job.id}:`, error);

            await supabaseAdmin
                .from('pending_translations')
                .update({
                    status: 'failed',
                    error_message: (error as Error).message,
                    attempts: job.attempts + 1,
                })
                .eq('id', job.id);
        }
    }

    return Response.json({ processed });
}
```

**Vercel Cron Configuration** (`vercel.json`):
```json
{
    "crons": [
        {
            "path": "/api/cron/process-translations",
            "schedule": "*/10 * * * *"
        }
    ]
}
```

---

### 5. **Hreflang Tags para SEO Multi-Idioma**

```typescript
// src/app/[locale]/propiedades/[id]/page.tsx

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale, id } = params;
    const property = await getProperty(id);

    // Generar URLs alternas para cada idioma
    const locales = ['es', 'en', 'fr', 'de', 'it', 'pt'];
    const alternates = locales.map(lang => ({
        hrefLang: lang,
        href: `https://vidahome.es/${lang}/propiedades/${id}`,
    }));

    return {
        title: `${property.tipo} en ${property.municipio} - Ref ${property.cod_ofer} | Vidahome`,
        description: property.seo_metadata?.[locale]?.meta_description,
        alternates: {
            languages: Object.fromEntries(
                alternates.map(alt => [alt.hrefLang, alt.href])
            ),
        },
        openGraph: {
            url: `https://vidahome.es/${locale}/propiedades/${id}`,
            // ... resto de OG tags
        },
    };
}
```

---

### 6. **Inicialización de Nuevos Idiomas (Script)**

```bash
#!/bin/bash
# scripts/add-new-language.sh

LOCALE=$1  # ej: 'fr'
NAME=$2    # ej: 'Français'
FLAG=$3    # ej: '🇫🇷'

if [ -z "$LOCALE" ]; then
    echo "Usage: ./add-new-language.sh fr Français 🇫🇷"
    exit 1
fi

echo "📝 Adding new language: $LOCALE ($NAME)"

# 1. Copiar template de mensajes
cp src/messages/es.json src/messages/$LOCALE.json
echo "✅ Created src/messages/$LOCALE.json"

# 2. Agregar a Supabase
# (El dev debe ejecutar esto manualmente o vía SQL)
cat > /tmp/add_language.sql << EOF
INSERT INTO i18n_config (locale, name, flag_emoji, is_active)
VALUES ('$LOCALE', '$NAME', '$FLAG', false)
ON CONFLICT DO NOTHING;
EOF

echo "📌 Execute this SQL in Supabase:"
echo "---"
cat /tmp/add_language.sql
echo "---"

# 3. Recordar traducir archivos JSON
echo ""
echo "⚠️  TODO: Translate src/messages/$LOCALE.json manually or with AI"
echo "⚠️  TODO: Set is_active=true in Supabase when ready"
```

---

## 🔄 Flujo de Agregar Francés (Ejemplo Completo)

```bash
# 1. Crear archivo de mensajes
cp src/messages/es.json src/messages/fr.json
# → Traducir contenido manualmente o con Claude/GPT

# 2. Agregar a Supabase
-- En Supabase SQL Editor:
INSERT INTO i18n_config (locale, name, flag_emoji, is_active)
VALUES ('fr', 'Français', '🇫🇷', true);

# 3. Actualizar routing (si no está ya soportado)
-- En src/i18n/routing.ts:
export const locales = ['es', 'en', 'fr'];

# 4. Listo. Las propiedades se traducirán automáticamente
-- Las descripciones se traducirán en background
-- Los metadatos SEO se mapearán automáticamente
```

---

## 📊 Comparación: Antes vs Después

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Soportar nuevo idioma** | Editar N archivos | Copiar 1 JSON + SQL |
| **Traducciones de propiedad** | Manual o timeout IA | Background queue |
| **Caché de traducciones** | No | Agresivo (24h) |
| **SEO Hreflang** | Manual | Automático |
| **Rate limiting IA** | No | Sí (10/min) |
| **Fallback si IA falla** | Error | Español automático |
| **Número de idiomas** | 2 máximo | 10+ fácilmente |

---

## 🚀 Implementación Faseada

### Fase 1 (Esta semana)
- [ ] Crear tabla `i18n_config` en Supabase
- [ ] Crear tabla `pending_translations`
- [ ] Crear `src/lib/i18n/auto-translator.ts`
- [ ] Documentar proceso

### Fase 2 (Siguiente semana)
- [ ] Crear Cron job `/api/cron/process-translations`
- [ ] Implementar queue de traducciones
- [ ] Testing con Francés

### Fase 3 (Pre-migración)
- [ ] Implementar Hreflang tags
- [ ] Agregar German (Deutsch) como ejemplo
- [ ] Validar que todo funciona

### Fase 4+ (Post-lanzamiento)
- [ ] Agregar Italiano, Portugués
- [ ] Monitorear performance de traducción

---

## 💡 Beneficios

✅ **Escalable**: Agregar idiomas sin cambios en código  
✅ **Resiliente**: Fallback automático a español  
✅ **SEO-Ready**: Hreflang, meta tags, sitemaps por idioma  
✅ **Performance**: Cache agresivo + background processing  
✅ **Futuro-Proof**: Listo para RTL (árabe), idiomas complejos  

---

**Preparado por**: Antigravity AI  
**Referencia**: Next.js 16, Supabase, Vercel Cron

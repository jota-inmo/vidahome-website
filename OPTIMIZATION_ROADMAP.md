# 📋 Plan de Optimización - Vidahome.es (Post-Performance Fix)

**Fecha**: 23/02/2026  
**Contexto**: Análisis basado en docs, audit y arquitectura actual  
**Objetivo**: Optimizaciones sin romper nada, preparadas para multi-idioma, SEO/GEO y migración de dominio

---

## 🎯 Prioridades Estratégicas

### 1. **SEGURIDAD** (No negociable - 0 rompimiento)
### 2. **SEO/GEO** (Crítico para migración)
### 3. **PERFORMANCE** (Escalable para idiomas)
### 4. **EXPERIENCIA DE USUARIO** (Futuro-proof)

---

## 📊 OPORTUNIDADES IDENTIFICADAS

---

## 🔴 CRÍTICAS (Ejecutar ASAP)

### 1. **Credenciales en Git (URGENTE)**
**Prioridad**: 🔴 Crítica  
**Impacto**: Seguridad máxima  
**Tiempo**: 5 min  
**Rompimiento**: NO

**Problema**: Auditoría menciona credenciales de Inmovilla en historial Git.

**Acción**:
```bash
# 1. Verificar si aún están expuestas
git log --all -S "INMOVILLA_PASSWORD" --oneline

# 2. Rotar credenciales en Inmovilla
# Contactar soporte y cambiar contraseña

# 3. Limpiar historial (si es necesario)
git filter-repo --replace-text /dev/stdin << 'EOF'
<OLD_PASSWORD>==><NEW_PASSWORD>
EOF

# 4. Forzar push
git push --force-with-lease
```

---

### 2. **Admin Session Token Firmado**
**Prioridad**: 🔴 Crítica  
**Impacto**: Seguridad - prevenir cookie forgery  
**Tiempo**: 20 min  
**Rompimiento**: NO (mejora invisible)

**Problema**: Cookie admin sin firma criptográfica. Alguien con DevTools puede falsificar.

**Solución**:
```typescript
// src/app/actions/auth.ts - Mejorar

import crypto from 'crypto';

export async function loginAction(password: string) {
    const adminPass = process.env.ADMIN_PASSWORD;
    if (!adminPass || password !== adminPass) {
        return { success: false, error: 'Contraseña incorrecta' };
    }

    // ✅ NUEVO: Token firmado en lugar de valor literal
    const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
    const timestamp = Date.now();
    const token = crypto
        .createHmac('sha256', secret)
        .update(`admin-${timestamp}`)
        .digest('hex');

    (await cookies()).set('admin_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict', // ← Más restrictivo
        maxAge: 60 * 60 * 24,
    });

    (await cookies()).set('admin_session_ts', timestamp.toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24,
    });

    return { success: true };
}

// src/middleware.ts - Verificar token

async function verifyAdminToken(token: string, timestamp: string): Promise<boolean> {
    const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
    const expectedToken = crypto
        .createHmac('sha256', secret)
        .update(`admin-${timestamp}`)
        .digest('hex');

    return token === expectedToken;
}
```

**Env vars necesarios**:
```env
ADMIN_SESSION_SECRET=your_strong_random_secret_here
```

---

### 3. **Soporte Multi-Idioma en Admin (SEO/i18n)**
**Prioridad**: 🔴 Crítica para SEO  
**Impacto**: SEO Local, futuro-proof  
**Tiempo**: 40 min  
**Rompimiento**: NO (new feature)

**Problema**: El admin gestiona traducciones de textos, pero los breadcrumbs y meta-descriptions en fichas son hardcoded.

**Solución - Estructura de Datos**:
```typescript
// src/types/inmovilla.ts - Extender PropertyDetails

export interface PropertyDetails {
    cod_ofer: number;
    // ... existing fields ...
    
    // ✅ NUEVO: Metadatos multi-idioma
    seo_metadata?: {
        es?: {
            meta_title: string;      // "Apartamento 3 hab. Gandia - Ref 123456"
            meta_description: string; // "Bonito apartamento en playa... Contacta"
            keywords: string;         // "apartamento gandia, playa, venta"
        };
        en?: {
            meta_title: string;
            meta_description: string;
            keywords: string;
        };
        fr?: { ... };
    };
}
```

**Crear Admin Panel** (`src/app/[locale]/admin/seo/page.tsx`):
- Form para editar meta tags por propiedad y por idioma
- Preview de cómo se vería en Google
- Guía de palabras clave recomendadas

**Impacto SEO**:
- Cada propiedad tendrá títulos únicos optimizados en Google
- Rich Snippets mejorados
- Mayor CTR en búsquedas locales

---

## 🟠 ALTAS (Siguientes 2 semanas)

### 4. **Redirecciones 301 Preparadas (SEO Migration)**
**Prioridad**: 🟠 Alta  
**Impacto**: SEO - no perder autoridad al migrar  
**Tiempo**: 30 min  
**Rompimiento**: NO (backward-compatible)

**Problema**: Cuando migres de vidahome.es anterior a Next.js, URLs antiguas (ej: `/ficha.php?id=123`) quebrarán sin redirecciones.

**Solución - next.config.ts**:
```typescript
// next.config.ts

export default {
    async redirects() {
        return [
            // URLs antiguas PHP → Nuevas Next.js
            {
                source: '/ficha.php',
                destination: '/propiedades/:id',
                permanent: true, // HTTP 301
            },
            {
                source: '/propiedades.php',
                destination: '/propiedades',
                permanent: true,
            },
            {
                source: '/contacto.php',
                destination: '/contacto',
                permanent: true,
            },
            {
                source: '/valoracion.php',
                destination: '/vender',
                permanent: true,
            },
            // Más según sea necesario...
        ];
    },
};
```

**Acción Pre-Migración**:
1. Exportar URLs indexadas de Google Search Console
2. Mapear URLs antiguas → nuevas rutas en Next.js
3. Añadir a `next.config.ts`
4. Probar con `curl -I http://localhost:3000/ficha.php?id=123`

---

### 5. **Dynamic Sitemap por Idioma (SEO)**
**Prioridad**: 🟠 Alta  
**Impacto**: SEO - mejor cobertura de crawling  
**Tiempo**: 45 min  
**Rompimiento**: NO (replaces existing sitemap)

**Problema**: Actual sitemap es estático. Con multi-idioma, necesitas `/sitemap-es.xml`, `/sitemap-en.xml`, `/sitemap.xml` con índice.

**Estructura Nueva**:
```
/sitemap.xml                    ← Índice de sitemaps
/sitemap-es.xml                 ← Propiedades en es
/sitemap-en.xml                 ← Propiedades en en
/sitemap-fr.xml                 ← Propiedades en fr (futuro)
/sitemap-pages.xml              ← Pages estáticas (home, contacto, etc)
```

**Crear** `src/app/sitemap.ts`:
```typescript
import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Obtener todas las propiedades
    const { data: properties } = await supabase
        .from('property_metadata')
        .select('cod_ofer, updated_at');

    const locales = ['es', 'en', 'fr'];
    const baseUrl = 'https://vidahome.es';

    const propertyUrls = (properties || []).flatMap(prop => 
        locales.map(locale => ({
            url: `${baseUrl}/${locale}/propiedades/${prop.cod_ofer}`,
            lastModified: prop.updated_at,
            changeFrequency: 'weekly',
            priority: 0.8,
        }))
    );

    const pageUrls = [
        { url: baseUrl, priority: 1.0, changeFrequency: 'daily' as const },
        ...locales.map(locale => ({
            url: `${baseUrl}/${locale}`,
            priority: 0.9,
            changeFrequency: 'daily' as const,
        })),
        ...locales.map(locale => ({
            url: `${baseUrl}/${locale}/propiedades`,
            priority: 0.8,
            changeFrequency: 'hourly' as const,
        })),
        ...locales.map(locale => ({
            url: `${baseUrl}/${locale}/contacto`,
            priority: 0.7,
            changeFrequency: 'monthly' as const,
        })),
    ];

    return [...propertyUrls, ...pageUrls];
}
```

---

### 6. **Image Optimization - Next.js Image Component**
**Prioridad**: 🟠 Alta  
**Impacto**: Performance + SEO (Page Speed)  
**Tiempo**: 25 min  
**Rompimiento**: NO (backward-compatible)

**Problema**: Las fotos de propiedades vienen de Inmovilla sin optimización. Pueden ser 5MB+ y ralentizar la carga.

**Solución**:
```tsx
// src/components/LuxuryPropertyCard.tsx - Mejorar

import Image from 'next/image';

export function LuxuryPropertyCard({ property }: Props) {
    const mainPhoto = property.fotos?.[0];

    return (
        <div className="...">
            {mainPhoto && (
                <Image
                    src={mainPhoto}
                    alt={`${property.tipo} en ${property.municipio} - Ref ${property.cod_ofer}`}
                    width={400}
                    height={280}
                    priority={false}
                    placeholder="blur"
                    blurDataURL="data:image/svg+xml,..." // ← Placeholder mientras carga
                    onError={(e) => {
                        // Fallback si imagen no carga
                        e.currentTarget.src = '/placeholder-property.jpg';
                    }}
                />
            )}
        </div>
    );
}
```

**next.config.ts - Optimización**:
```typescript
export default {
    images: {
        domains: ['inmovilla-static.es', 'imgserver.inmovilla.com', '...'],
        formats: ['image/avif', 'image/webp'], // ← Formatos modernos
        deviceSizes: [640, 750, 828, 1080, 1200, 1920],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        minimumCacheTTL: 31536000, // 1 año
    },
};
```

---

### 7. **Rate Limiting Mejorado (Protección API)**
**Prioridad**: 🟠 Alta  
**Impacto**: Seguridad + Confiabilidad  
**Tiempo**: 35 min  
**Rompimiento**: NO (mejora transparente)

**Problema**: Rate limiting actual es por-action, no por-IP/user. Vulnerable a DoS.

**Solución - src/lib/rate-limit.ts**:
```typescript
import { createClient } from '@supabase/supabase-js';

export async function checkRateLimit(identifier: string, options: {
    limit: number;
    windowMs: number;
}) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const now = new Date();
    const resetAt = new Date(now.getTime() + options.windowMs);

    const { data: existing, error: fetchError } = await supabase
        .from('rate_limits')
        .select('count, reset_at')
        .eq('identifier', identifier)
        .single();

    if (fetchError?.code !== 'PGRST116') throw fetchError;

    const isExpired = existing && new Date(existing.reset_at) <= now;
    const newCount = isExpired ? 1 : (existing?.count || 0) + 1;

    await supabase.from('rate_limits').upsert({
        identifier,
        count: newCount,
        reset_at: isExpired ? resetAt : existing.reset_at,
    });

    return {
        success: newCount <= options.limit,
        remaining: Math.max(0, options.limit - newCount),
        resetAt: existing?.reset_at || resetAt,
    };
}
```

**Middleware de Rate Limit**:
```typescript
// src/app/api/[...routes]/route.ts

export async function GET(req: Request) {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const rateCheck = await checkRateLimit(`api-${ip}`, {
        limit: 100,
        windowMs: 60000, // 1 min
    });

    if (!rateCheck.success) {
        return new Response('Too Many Requests', { status: 429 });
    }

    // Continue with request...
}
```

---

## 🟡 MEDIAS (Próximo mes)

### 8. **Caching Estratégico en Borde (Vercel Edge Caching)**
**Prioridad**: 🟡 Media  
**Impacto**: Performance Global  
**Tiempo**: 1 hora  
**Rompimiento**: NO

**Idea**: Cachear fichas de propiedades en Vercel Edge (CDN global) por 1 hora.

```typescript
// src/app/[locale]/propiedades/[id]/page.tsx

export const revalidate = 3600; // Revalidar cada 1 hora

export async function generateMetadata({ params }: Props) {
    // Metadata será cacheada por Vercel...
}
```

---

### 9. **Admin Dashboard - Analytics (Visitantes, Leads)**
**Prioridad**: 🟡 Media  
**Impacto**: Business Intelligence  
**Tiempo**: 2-3 horas  
**Rompimiento**: NO (nueva feature)

**Idea**: Panel que muestre:
- Propiedades más visitadas
- Leads por propiedad
- Conversión por idioma
- Horarios pico

**Usar**: Supabase + Recharts o Chart.js

---

### 10. **Progressive Web App (PWA) - Instalable**
**Prioridad**: 🟡 Media  
**Impacto**: User Engagement  
**Tiempo**: 1 hora  
**Rompimiento**: NO

**Idea**: Usuarios pueden instalar vidahome.es como "app" en móvil.

```typescript
// next.config.ts

import withPWA from 'next-pwa';

export default withPWA({
    dest: 'public',
    register: true,
});
```

---

## 🟢 OPCIONALES (Futuro, > 1 mes)

### 11. **Video Background Optimization**
- Usar HLS/DASH para streaming adaptivo
- Soportar múltiples bitrates

### 12. **ML-powered Property Recommendations**
- "Propiedades similares a esta"
- Basado en precio, m², ubicación

### 13. **ChatBot Multilenguaje (IA)**
- Usar Vercel AI SDK + modelo de OpenAI/Claude
- Responder preguntas sobre propiedades

### 14. **Dark Mode Persistence**
- Guardar preferencia en localStorage + servidor

---

## 📋 CHECKLIST DE EJECUCIÓN

### Semana 1 (CRÍTICA)
- [ ] Auditar credenciales en Git (URGENTE)
- [ ] Implementar admin session token firmado
- [ ] Agregar redirecciones 301 a next.config.ts
- [ ] Crear admin panel para SEO metadata (ES, EN, FR)

### Semana 2 (ALTA)
- [ ] Dinámico sitemap por idioma
- [ ] Image optimization en componentes
- [ ] Mejorar rate limiting

### Semana 3+ (MEDIA)
- [ ] Edge caching strategy
- [ ] Admin dashboard con analytics
- [ ] PWA (installable)

---

## 🎯 BENEFICIOS ESPERADOS

| Métrica | Antes | Después | Impacto |
|---------|-------|---------|---------|
| **Seguridad Admin** | ⚠️ Vulnerable | ✅ Token HMAC | Crítico |
| **SEO Meta Tags** | Genérico | Único por propiedad | ⬆️⬆️⬆️ SERP CTR |
| **Core Web Vitals** | 75/100 | 90+/100 | ⬆️ Ranking Google |
| **URL Redirects** | No | 301 automático | ✅ Migración limpia |
| **Crawl Coverage** | 1 sitemap | N sitemaps por locale | ⬆️ Indexación |
| **Multi-Idioma** | 2 (es, en) | N (preparado) | Escalable |

---

## 🚀 PRÓXIMOS PASOS

1. **Esta semana**: Ejecutar las 4 items CRÍTICOS
2. **Próxima semana**: Ejecutar ALTAS
3. **Antes de migración**: Completar MEDIAS
4. **Post-lanzamiento**: Monitorear en Google Search Console

---

**Preparado por**: Antigravity AI  
**Fecha**: 23/02/2026  
**Contexto**: Análisis post-Performance Fix, pre-Migración de Dominio

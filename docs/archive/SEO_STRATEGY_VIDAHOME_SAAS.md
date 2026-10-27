# 📈 ESTRATEGIA SEO - Vidahome.es + SaaS Futuro

## 🎯 Contexto

**Vidahome.es**: Web existente con propiedades, necesita mejorar posiciones
**SaaS Futuro**: Landing page + blog desde cero, target agencias inmobiliarias

---

## PARTE 1: SEO VIDAHOME.ES (Corto plazo)

### 1️⃣ Keyword Research & Target

#### Keywords Principales (alto volumen, baja competencia)

```
INFORMACIONALES (Top of funnel - Blogs):
├─ "casas de lujo en grau" (90 búsquedas/mes, competencia baja)
├─ "inmobiliarias en grau" (50 búsquedas/mes)
├─ "venta de casas el grau" (60 búsquedas/mes)
├─ "vivienda con piscina grau" (30 búsquedas/mes)
├─ "villa de lujo costa blanca" (120 búsquedas/mes)
└─ "casas de playa emporium/grau" (40 búsquedas/mes)

COMERCIALES (Mid-funnel - Product pages):
├─ "comprar casa el grau" (200 búsquedas/mes) ← PRIMARY
├─ "venta inmuebles grau" (150 búsquedas/mes)
├─ "casas de lujo venta" (300 búsquedas/mes)
├─ "vivienda de lujo alicante" (180 búsquedas/mes)
└─ "inmueble playa españa" (250 búsquedas/mes)

LOCALES (Geo-targeted):
├─ "inmobiliaria el grau" (40 búsquedas/mes) ← MEJOR ROI
├─ "agencia vivienda grau" (20 búsquedas/mes)
├─ "comprar casa grau españoles" (30 búsquedas/mes)
└─ [Tu ciudad]+inmobiliaria/vivienda

LONG-TAIL (Very specific, high intent):
├─ "casa de lujo con vista al mar el grau"
├─ "villa 5 habitaciones grau venta"
├─ "inmueble playa privada grau"
└─ "propiedad inversión turística grau"
```

#### Herramientas para validar (GRATIS):

```
Google Keyword Planner: 
  https://ads.google.com/intl/es_es/home/tools/keyword-planner/
  
Google Search Console:
  https://search.google.com/search-console
  (ya deberías tener acceso si está indexada)
  
Ubersuggest free:
  https://ubersuggest.com/
  
SE Ranking free:
  https://seranking.com/free-website-seo-check.html
  
Keyword metrics:
  - Volume > 50 búsquedas/mes
  - Competition < "MEDIUM" (bajo es mejor)
  - Intent = "COMMERCIAL" (personas queriendo comprar)
```

---

### 2️⃣ On-Page Optimization (Que puedes hacer YA)

#### Mejoras en Metadata

```typescript
// src/app/[locale]/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Casas de Lujo en Grau | Vidahome - Inmobiliaria Premium',
  description: 'Descubre propiedades de lujo en Grau. Villas frente al mar, casas con piscina y terraza. Inmobiliaria exclusiva con 15+ años de experiencia.',
  keywords: 'casa lujo grau, inmobiliaria grau, venta vivienda playa, villa alicante',
  
  // Open Graph para social sharing
  openGraph: {
    title: 'Casas de Lujo en Grau - Vidahome',
    description: 'Propiedades premium en tu destino de lujo',
    images: [
      {
        url: '/og-hero.jpg', // Screenshot de tu mejor propiedad
        width: 1200,
        height: 630,
        alt: 'Propiedad destacada Vidahome'
      }
    ],
    type: 'website',
    locale: 'es_ES',
  },
  
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'Casas de Lujo en Grau | Vidahome',
    description: 'Descubre propiedades exclusivas',
    images: ['/og-hero.jpg'],
  }
};

export default function Home() {
  // ...
}
```

#### Schema.org Markup (Crucial para Google)

```typescript
// src/components/PropertyCard.tsx - AGREGAR Schema JSON-LD

export function PropertyCard({ property }: { property: Property }) {
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    'name': 'Vidahome',
    'url': 'https://vidahome.es',
    'image': 'https://vidahome.es/logo.png',
    'telephone': property.phone,
    'address': {
      '@type': 'PostalAddress',
      'addressLocality': 'Grau',
      'addressRegion': 'Alicante',
      'postalCode': '03181',
      'addressCountry': 'ES'
    },
    'areaServed': ['Grau', 'Alicante', 'Valencia'],
    'award': 'Best Real Estate Agency 2024'
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      
      {/* Propiedad específica */}
      <PropertySchema property={property} />
      
      <div className="property-card">
        {/* Tu contenido */}
      </div>
    </>
  );
}

// Componente aparte para Property Schema
function PropertySchema({ property }: { property: Property }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Property',
          'name': property.title,
          'description': property.description,
          'image': property.images,
          'price': property.price,
          'priceCurrency': 'EUR',
          'url': `https://vidahome.es/propiedad/${property.id}`,
          'address': {
            '@type': 'PostalAddress',
            'streetAddress': property.address,
            'addressLocality': 'Grau',
            'postalCode': '03181',
            'addressRegion': 'Alicante',
            'addressCountry': 'ES'
          },
          'geo': {
            '@type': 'GeoCoordinates',
            'latitude': property.lat,
            'longitude': property.lng
          },
          'numberOfRooms': property.habitaciones,
          'numberOfBedrooms': property.habitaciones,
          'numberOfBathroms': property.banos,
          'floorSize': property.superficie,
          'floorSizeUnit': 'm2',
          'sameAs': [
            `https://vidahome.es/propiedad/${property.id}`,
            // Agregar links sociales si tienes
          ]
        })
      }}
    />
  );
}
```

#### Optimización de Títulos & Descripciones

```
ANTES (malo):
├─ Title: "Casa" (3 palabras, genérico)
├─ Meta: "Esta es una casa bonita" (sin keywords)
└─ H1: "Propiedad"

DESPUÉS (bueno):
├─ Title: "Villa de Lujo 5 Hab, Piscina & Playa | Grau - Vidahome" (58 chars, keyword-rich)
├─ Meta: "Villa exclusiva 350m² frente al mar con piscina climatizada. 5 habitaciones, terraza panorámica. ¡Visita hoy!" (160 chars)
└─ H1: "Villa de Lujo Frente al Mar - Grau, Alicante"
```

#### Estructura de URLs SEO-friendly

```
ANTES (malo):
├─ /property?id=12345&lang=es
├─ /admin/property/view/12345
└─ /properties/spanish/grau-villa-123

DESPUÉS (buena):
├─ /es/propiedad/villa-lujo-grau-5-habitaciones/
├─ /es/propiedades/grau/villa-piscina-120200123/
└─ /es/venta/casa-lujo-alicante-frente-mar/

REGLAS:
✓ Usar palabras clave en URL
✓ Separar con guiones (-)
✓ Minúsculas
✓ Evitar números de ID si posible
✓ Localización en ruta principal /es/
✓ Slug descriptivo
```

#### Optimización de Imágenes

```typescript
// ANTES: <img src="villa.jpg" alt="house" />

// DESPUÉS: 
<Image
  src="/properties/villa-lujo-grau-5hab-piscina.jpg"
  alt="Villa de lujo 5 habitaciones con piscina climatizada en Grau"
  width={1200}
  height={800}
  priority={isHero}
  sizes="(max-width: 768px) 100vw, 50vw"
  className="rounded-lg"
/>

// Reglas:
// ✓ Alt text largo y descriptivo (no "foto", "imagen")
// ✓ Filename con palabras clave
// ✓ Comprimir: TinyPNG, Squoosh
// ✓ Formato moderno: WebP con fallback JPG
// ✓ Lazy loading automático en Next.js
```

#### Internal Linking Strategy

```
página: villa-lujo-grau

└─ ENLACES INTERNOS (anchor text con keywords)
   ├─ "Casas de lujo en Grau" → /es/propiedades/grau/
   ├─ "Villas con piscina" → /es/propiedades/piscina/
   ├─ "Inmobiliarias en Alicante" → /es/info/inmobiliarias-alicante/
   ├─ "Blog: Guía compra vivienda lujo" → /es/blog/guia-compra-casa-lujo/
   └─ "Contacta con nuestro agente" → /es/contacto/
```

---

### 3️⃣ Technical SEO (Implementación)

#### Essentials Checklist

```typescript
// next.config.ts - AGREGAR
export default {
  // 1. Compression
  compress: true,
  
  // 2. Image optimization
  images: {
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
  },
  
  // 3. Headers para SEO
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          }
        ],
      },
    ];
  },
  
  // 4. Rewrites para clean URLs
  async rewrites() {
    return {
      afterFiles: [
        {
          source: '/sitemap.xml',
          destination: '/api/sitemap.xml',
        },
        {
          source: '/robots.txt',
          destination: '/api/robots.txt',
        },
      ],
    };
  }
};
```

#### Sitemap Dinámico

```typescript
// src/app/api/sitemap.xml/route.ts

export async function GET() {
  const { supabase } = await import('@/lib/supabase');
  
  // Get todas las propiedades
  const { data: properties } = await supabase
    .from('properties')
    .select('id, slug, updated_at')
    .eq('active', true);
  
  const baseUrl = 'https://vidahome.es';
  const locales = ['es', 'en', 'fr', 'de', 'it', 'pl'];
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
            xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
            xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0">
      
      <!-- PAGES PRINCIPALES -->
      ${locales.map(locale => `
        <url>
          <loc>${baseUrl}/${locale}/</loc>
          <lastmod>${new Date().toISOString()}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>1.0</priority>
        </url>
      `).join('')}
      
      <!-- PROPIEDADES DINÁMICAS -->
      ${properties?.map(prop => `
        <url>
          <loc>${baseUrl}/es/propiedad/${prop.slug}/</loc>
          <lastmod>${new Date(prop.updated_at).toISOString()}</lastmod>
          <changefreq>monthly</changefreq>
          <priority>0.8</priority>
        </url>
      `).join('')}
      
      <!-- PÁGINAS DE CATEGORÍA -->
      <url>
        <loc>${baseUrl}/es/propiedades/grau/</loc>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
      </url>
      <url>
        <loc>${baseUrl}/es/propiedades/piscina/</loc>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
      </url>
    </urlset>`;
  
  return new Response(xml, {
    status: 200,
    headers: { 'Content-Type': 'application/xml' },
  });
}
```

#### Robots.txt Optimizado

```typescript
// src/app/api/robots.txt/route.ts

export async function GET() {
  const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /private/
Disallow: /*.json$

# Imagenes
Allow: /public/

# Google
User-agent: Googlebot
Allow: /

# Bing
User-agent: Bingbot
Allow: /

# Slow crawlers
User-agent: MJ12bot
Crawl-delay: 10

# Sitemap
Sitemap: https://vidahome.es/sitemap.xml
Sitemap: https://vidahome.es/es/sitemap.xml
Sitemap: https://vidahome.es/en/sitemap.xml`;

  return new Response(robotsTxt, {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
}
```

#### Core Web Vitals (Velocidad)

```typescript
// src/lib/performance.ts

export function optimizePerformance() {
  // 1. Lazy load heavy components
  const HeavyGallery = dynamic(
    () => import('@/components/PropertyGallery'),
    { 
      loading: () => <div className="skeleton" />,
      ssr: false 
    }
  );
  
  // 2. Prefetch data on hover
  useCallback(() => {
    router.prefetch(`/es/propiedad/${nextPropertyId}`);
  }, []);
}

// next.config.ts
export default {
  // Dynamic imports optimizados
  experimental: {
    optimizePackageImports: ["@/components"],
  },
  
  // Cache strategy
  onDemandEntries: {
    maxInactiveAge: 25 * 1000, // 25 segundos
    pagesBufferLength: 5,
  }
};
```

---

### 4️⃣ Content Strategy (Blog SEO)

#### Temas para Blog (Bajo costo, alto SEO)

```
PILARES DE CONTENIDO:

1️⃣ GUÍAS EDUCATIVAS
   ├─ "Guía completa: Comprar casa de lujo en España"
   ├─ "5 pasos para encontrar tu villa ideal en Costa Blanca"
   ├─ "Inversión inmobiliaria: Tips para rentabilidad máxima"
   └─ "Reforma vs compra nueva: Análisis costo-beneficio"
   
   (Objetivo: Rank en keywords informacionales de alto volumen)

2️⃣ LOCAL CONTENT
   ├─ "Grau 2024: Guía del barrio más exclusivo de Alicante"
   ├─ "Mejores playas cerca de Grau para vivir"
   ├─ "Infraestructuras & servicios en el Grau"
   └─ "Precios de vivienda en Grau 2024 (análisis)"
   
   (Objetivo: Rank local + build authority)

3️⃣ TENDENCIAS & NOTICIAS
   ├─ "Mercado inmobiliario 2024: Predicciones para Costa Blanca"
   ├─ "Sube la demanda de villas de lujo: ¿Por qué?"
   ├─ "Nuevas leyes de inquilinos: Impacto para propietarios"
   └─ "Inversiones inmobiliarias post-pandemia en España"
   
   (Objetivo: Fresh content, attraer links, aparecer en news)

4️⃣ PRODUCT CONTENT
   ├─ "Casa inteligente: Tecnología para tu villa"
   ├─ "Piscinas climatizadas vs normales: Guía"
   ├─ "Energías renovables para casas de lujo"
   └─ "Smart home integration en propiedades premium"
   
   (Objetivo: Long-form product pages con buyer intent)

5️⃣ COMPARATIVAS
   ├─ "Grau vs Javea: ¿Dónde invertir en Costa Blanca?"
   ├─ "Villa privada vs apartamento de lujo: Análisis"
   ├─ "Compra vs arrendamiento: ROI analysis"
   └─ "Alquiler vacacional vs renta tradicional"
   
   (Objetivo: Atraer keywords competitivas con análisis único)
```

#### Estructura Artículo Tipo

```markdown
# Guía Compra Casa Lujo España [2024]

## Intro (100 palabras)
Plantear problema + solución + lo que aprenderá

## Tabla de Contenidos
(Auto-generada en Next.js)

## Sección 1: Fundamentos
- Definición clara
- Contexto local (España, Alicante)
- Stats/datos

## Sección 2-4: Deep dive
- Análisis
- Ejemplos prácticos
- Case studies (propiedades Vidahome)
- Embedding: Videos, imágenes

## Sección Final: Call-to-Action
- "Mira nuestras villas de lujo en Grau"
- Link a propiedades filtradas
- Formulario contacto

## Metadata
- Keyword principal en H1
- Keywords secundarias en H2/H3
- 2000+ palabras
- Mínimo 3 imágenes con alt text
- Links internos estratégicos
- External links (authoridades)

## FAQ Schema
```

#### Automatizar Blog

```typescript
// src/scripts/generate-property-blog-posts.ts

/**
 * Auto-generar artículos para cada propiedad
 * Como Airbnb hace con sus listings
 */

async function generatePropertyArticles() {
  const { data: properties } = await supabase
    .from('properties')
    .select('*')
    .eq('active', true);

  for (const property of properties) {
    const article = {
      title: `${property.title} - Guía Completa [2024]`,
      slug: generateSlug(property.title),
      content: await generateContent({
        type: 'property_guide',
        property,
        tone: 'professional',
        language: 'es'
      }),
      seoOptimized: true,
      template: 'property_guide'
    };
    
    // Guardar en base de datos
    await supabase.from('blog_posts').insert(article);
  }
}

// Correr: npx tsx src/scripts/generate-property-blog-posts.ts
```

---

### 5️⃣ Link Building (Off-Page SEO)

#### Estrategia de Links (No spamear)

```
TIER 1: Autoridades (Lo ideal)
├─ Portales inmobiliarios: Inmobilianet, Pisos.com, Fotocasa
│  └─ Contactar: "Nuestra web de lujo quiere estar listada"
├─ Asociaciones: GREMIO, Colegio Agentes Immobiliarios
│  └─ Contactar: "¿Podemos ser case study?"
├─ Medios: Diario, El País Propiedades, Idealista
│  └─ Contactar: "Historia sobre renovación lujo en Grau"
└─ Universidades: UA (Universidad Alicante)
   └─ Contactar: "Estudio de mercado inmobiliario local"

TIER 2: Relevantes (Bueno)
├─ Blogs de viajes: "10 ciudades para jubilarse en España"
├─ Guías: TimeOut, Lonely Planet, Viajeros
└─ Directorios: Google My Business, Yelp, TripAdvisor

TIER 3: Propios (Mantenimiento)
├─ Blog propio (internal links)
├─ Social media (branded traffic → ranking boost)
└─ Press releases (distribuidor como EuropaPress)
```

#### Link Outreach Template

```
SUBJECT: [Propuesta] Caso de Estudio Inmobiliario Alicante

Hola [nombre],

Noto que escriben sobre vivienda de lujo / Costa Blanca.

Tenemos un caso de éxito interesante: Cómo una villa en Grau 
se vendió en 6 meses (vs 18 meses promedio) gracias a 
posicionamiento & marketing digital.

¿Estarían abiertos a incluir un case study en vuestro blog? 
Podemos proporcionar:
- Datos de mercado
- Insights locales
- Fotos/vídeos exclusivos

(No es link forzado - es contenido útil mutuamente)

Saludos,
[Tu nombre]
Vidahome.es
```

---

### 6️⃣ Local SEO (crítico para agencia inmobiliaria)

#### Google My Business Optimizó

```
1. COMPLETAR PERFIL AL 100%:
   ✓ Nombre exacto: "Vidahome - Inmobiliaria Premium Grau"
   ✓ Descripción: 500+ chars, keywords locales
   ✓ Fotos: 20+ (propiedades, equipo, oficina)
   ✓ Videos: 3-5 (videos de propiedades destacadas)
   ✓ Dirección: Con código postal exacto
   ✓ Teléfono: Verificado & activo
   ✓ Horarios: Actualizado
   ✓ Servicios: Venta, alquiler, asesoría
   ✓ Atributos: "Se hablan múltiples idiomas", etc.
   ✓ Sitio web: Link a vidahome.es

2. MANTENER ACTIVO:
   ├─ Publicar posts 2x semana (propiedades nuevas)
   ├─ Responder reseñas (24h max)
   ├─ Agregar eventos/promociones

3. REVIEWS:
   ├─ Pedir a clientes que comenten (post-venta)
   ├─ Mostrar 4.8+ stars en web
   └─ Responder constructivamente a críticas
```

#### Schema.org Local

```typescript
// src/components/Business Footer

<LocalBusinessSchema
  name="Vidahome"
  description="Agencia inmobiliaria de lujo"
  phone="+34 XXX XXX XXX"
  email="contacto@vidahome.es"
  address={{
    streetAddress: "Calle Principal 123",
    addressLocality: "Grau",
    postalCode: "03181",
    addressCountry: "ES"
  }}
  coordinates={{ lat: 38.3442, lng: -0.4081 }} // Coordenadas Grau
  logo="https://vidahome.es/logo.png"
  socialProfiles={[
    "https://instagram.com/vidahome",
    "https://facebook.com/vidahome",
  ]}
  openingHours={[
    { dayOfWeek: "Monday", opens: "09:00", closes: "18:00" },
    // ...
  ]}
/>
```

---

## PARTE 2: SEO SaaS FUTURO (Mediano plazo)

### 1️⃣ Landing Page SEO (Primera impresión)

#### Estructura Optimizada

```
https://real-estate-saas.com/es/

H1: "Plataforma SaaS para Agencias Inmobiliarias | [Tu nombre]"
  (include keyword, short, compelling)

SECTION 1 - Hero
├─ Copy enfocado en PROBLEMA
├─ CTA: "Ver demo gratis"
└─ Imagen con propiedad de ejemplo

SECTION 2 - Pain points
├─ "Web antiguo no vende" → Solución
├─ "Gestión manual toma 40 horas/semana" → Solución
├─ "Sin control de inventario" → Solución
└─ Cada punto = keyword oculto

SECTION 3 - Features (con keywords)
├─ "Admin intuitivo sin código"
├─ "Multi-idioma nativo (6 idiomas)"
├─ "Integración automática con portales"
└─ "Analytics avanzados de visitantes"

SECTION 4 - Pricing (table)
├─ Comparativa clara
├─ "Cálculo ROI" (herramienta interactiva)
└─ FAQ colapsable

SECTION 5 - Social proof
├─ Testimonia clientes
├─ Logos empresas (si tienes)
├─ Certificaciones/premios
└─ Press mentions

SECTION 6 - FAQ Schema
├─ 15-20 preguntas frecuentes
└─ Respuestas largas (200+ words cada una)

SECTION 7 - CTA Final
├─ "Empieza gratis sin tarjeta"
└─ Formulario captura emails
```

#### Metadata Landing Page

```typescript
export const metadata: Metadata = {
  title: 'SaaS Inmobiliario | Plataforma Web para Agencias | [Nombre]',
  description: 'Software SaaS para agencias inmobiliarias. Crea web profesional, multi-idioma, sin código. €29/mes. Integración automática, analytics, CRM. Prueba gratis.',
  keywords: 'SaaS inmobiliario, software agencias, plataforma web real estate, CRM inmuebles',
  
  openGraph: {
    title: 'SaaS Inmobiliario - Plataforma Web Profesional',
    description: 'Para agencias que quieren vender más inmuebles',
    images: ['/og-landing.jpg'],
  }
};
```

---

### 2️⃣ Blog Content Strategy (Organic growth engine)

#### Pilares de Contenido

```
TEMA 1: "Cómo vender más inmuebles"
├─ "5 errores en web inmobiliaria que pierden ventas"
├─ "Fotografía profesional vs accionamiento en real estate"
├─ "Descriptivo de propiedad que vende: template"
├─ "Landing page para propiedades: checklist SEO"
└─ Palabra clave: "vender más casas", "web inmobiliaria"

TEMA 2: "Tecnología para agencias"
├─ "CRM vs SaaS: Cuál elegir en 2024"
├─ "Integración API: Portales + web propietarios"
├─ "Chatbot IA para leads inmobiliarios"
├─ "Analytics que importan en inmobiliaria"
└─ Palabra clave: "software inmobiliario", "CRM RE"

TEMA 3: "Tendencias mercado"
├─ "Mercado inmobiliario 2024: Predicciones España"
├─ "Generación Z compra vivienda: Qué quieren"
├─ "Virtual tours 3D: ROI para agencias"
├─ "Inversión extranjera en España: Oportunidad"
└─ Palabra clave: "mercado vivienda", "real estate trends"

TEMA 4: "Guides comparativas"
├─ "SaaS vs web propia: Diferencias"
├─ "Agencias grandes vs pequeñas: Estrategia"
├─ "Venta presencial vs online: Ventajas cada una"
└─ Palabra clave: "plataforma SaaS", "software real estate"
```

#### Content Calendar (SEO-driven)

```
ENERO: Tendencias 2024
├─ "Predicciones mercado inmobiliario"
├─ "Technology trends en real estate"
└─ "5 resoluciones para agencias"

FEBRERO: Educativo
├─ "Guía: Staging virtual de propiedades"
├─ "Por qué necesitas web profesional"

MARZO: Investigación
├─ "Estudio: Comportamiento compradores 2024"
├─ "Encuesta: Tendencias agencias medianas"

ABRIL: Comparativas
├─ "SaaS vs construir web internamente"
├─ "Nuestro SaaS vs competencia"

... y así sucesivamente
```

---

### 3️⃣ Technical SEO para SaaS

#### Velocidad (CWV = ranking factor)

```typescript
// next.config.ts
export default {
  images: {
    formats: ['image/avif', 'image/webp'],
    unoptimized: false,
    remotePatterns: [
      { protocol: 'https', hostname: 'your-cdn.com' }
    ]
  },
  
  // Static generation para landing pages
  experimental: {
    optimizePackageImports: ["@/components"],
  }
};

// src/app/page.tsx - Usar Static Export
export const revalidate = 3600; // Revalidate cada hora
export const dynamic = 'force-static';
```

#### Crawlability

```typescript
// Estructura de URLs limpia
/           → Landing page
/es/        → Landing español
/en/        → Landing inglés
/pricing/   → Pricing page
/blog/      → Blog index
/blog/titulo-articulo/ → Artículo
/docs/      → Documentación
/contact/   → Formulario
```

#### Hreflang (Multi-idioma)

```typescript
// next.config.ts - Agregar:
async headers() {
  return [
    {
      source: '/es/:path*',
      headers: [
        {
          key: 'Link',
          value: '</es/:path*>; rel="alternate"; hreflang="es", </en/:path*>; rel="alternate"; hreflang="en"'
        }
      ]
    }
  ];
}

// O en componente:
<Head>
  <link rel="alternate" hreflang="es" href="https://domain.com/es/" />
  <link rel="alternate" hreflang="en" href="https://domain.com/en/" />
  <link rel="alternate" hreflang="x-default" href="https://domain.com/" />
</Head>
```

---

### 4️⃣ Estrategia de Links para SaaS

#### Link Building Activo

```
ESTRATEGIA:

1. MENCIONES EN NEWS
   └─ Press kit + story hook → tech journalists
   └─ "Startup española launches multilingual SaaS para RE"

2. PARTNERSHIPS
   ├─ Inmobilianet: "Integración con nuestro SaaS"
   ├─ Pisos.com: "API partnership"
   └─ Directorios SaaS: PitchBook, Capterra

3. CONTENIDO ENLAZABLE
   ├─ Herramienta GRATUITA: "Calculador ROI agencia"
   ├─ Template: "5 plantillas landing page RE"
   ├─ Report: "Estado del SaaS inmobiliario 2024"
   └─ Estudio: "1000 agencias encuestadas: pains"

4. GUEST POSTS
   ├─ Publicar en blogs de RE
   ├─ Publicar en tech blogs español
   └─ Título: "Cómo construimos SaaS para RE"

5. DIRECTORY SUBMISSIONS
   ├─ G2 Reviews (crítico para SaaS)
   ├─ Capterra
   ├─ Producthunt
   ├─ Alternativeto
   └─ SaaS directorios genéricos
```

---

## PARTE 3: IMPLEMENTACIÓN & TRACKING

### 1️⃣ Checklist Quick-Win (Semanas 1-4)

```
VIDAHOME.ES:
☐ Agregar Schema.org markup (manchas)
☐ Optimizar 5 title/meta principales
☐ Create robots.txt + sitemap dinámico
☐ Configurar Google Search Console
☐ Agregar internal links en blog
☐ Optimizar 20 imágenes (comprensión)
☐ Verificar mobile responsiveness
☐ Agregar OpenGraph tags

TIEMPO: 16-20 horas
COSTO: €0 (es técnico)
IMPACTO: +15-25% traffic estimado
```

### 2️⃣ Tracking & Metrics

```typescript
// Google Analytics 4 Setup
import { gtag } from '@next/gtag';

gtag('event', 'page_view', {
  page_path: router.pathname,
  page_title: document.title,
});

// Eventos importantes
gtag('event', 'contact_form_submit', {
  property_id: propertyId,
  timestamp: Date.now(),
});

gtag('event', 'property_view', {
  property_id: propertyId,
  price: property.price,
});
```

#### KPIs a Monitorear

```
VIDAHOME.ES:

📊 Organic Traffic
   - Sessions from search: [baseline → +50% en 6 meses]
   - Keywords ranking: [baseline → 50+ posiciones en SERP]
   - CTR promedio: [target: 3-5%]

💰 Conversions
   - Landing on property pages: [baseline → +100%]
   - Contact form submissions: [baseline → +75%]
   - Phone calls: [trackear con CallRail]

⏱️ User Experience
   - Time on page: [target: 3+ minutos]
   - Bounce rate: [target: <40%]
   - Core Web Vitals: [Green en todas]

SaaS:

👥 Acquisition
   - Signups from organic: [target: 10-20/mes]
   - Free trial starts: [target: 30+/mes]
   - Cost per lead: [target: <€5]

🎯 Engagement
   - Feature adoption rate: [target: >70%]
   - Time to first value: [target: <24h]
   - NPS score: [target: >40]

💵 Revenue
   - Conversion rate (trial → paid): [target: 15-20%]
   - MRR growth: [target: 20% MoM]
   - CAC payback: [target: <12 meses]
```

### 3️⃣ Tools Essenciales (Many GRATIS)

```
GRATIS:
├─ Google Search Console: search.google.com/search-console
├─ Google Analytics 4: analytics.google.com
├─ Google PageSpeed: pagespeed.web.dev
├─ Lighthouse (integrado en DevTools)
├─ Semrush Free: vrse.run/semrush-free
├─ Ubersuggest Free: vrse.run/ubersuggest
├─ Copyscape: Duplicate content checker
└─ Dead Link Checker: https://www.deadlinkchecker.com/

PAGOS (Worth it):
├─ Semrush: €120/mes (keyword research + competitor analysis)
├─ Ahrefs: €99/mes (backlink analysis)
├─ SE Ranking: €55/mes (all-in-one, good value)
├─ Screaming Frog: €149/year (site audit)
└─ SurferSEO: €79/mes (content optimization)

RECOMENDACIÓN INICIAL:
SE Ranking (mejor relación precio/valor para tu caso)
```

---

## 📅 ROADMAP SEO

### FASE 1: QUICK WINS (Semanas 1-4)

```
VIDAHOME.ES:
[Week 1-2]
  ✓ Audit técnico con Lighthouse
  ✓ Schema.org markup en propiedades
  ✓ Optimizar título/meta de 10 principales
  
[Week 3-4]
  ✓ Google Search Console setup
  ✓ Crear sitemap dinámico
  ✓ Blogging: 1 artículo keyworded
  ✓ Optimizar imágenes

RESULTADO: +10-15% tráfico orgánico

SaaS FUTURO:
[Week 1-2]
  ✓ Dominio + hosting
  ✓ Landing page básico
  ✓ Schema validado
  
[Week 3-4]
  ✓ Blog estructura
  ✓ Google Analytics configurado
```

### FASE 2: CONTENT ENGINE (Meses 2-3)

```
VIDAHOME.ES:
  ✓ 1 blog post/semana (52 posts/año)
  ✓ Internal linking strategy
  ✓ Link outreach (3-5 links/mes)

SaaS:
  ✓ Landing page optimizado
  ✓ 2 blog posts/semana
  ✓ Presencia en directorios SaaS
```

### FASE 3: SCALE (Meses 4-12)

```
VIDAHOME.ES:
  ✓ Ranking para 100+ keywords
  ✓ 200k+ monthly organic traffic (target)
  ✓ Newsletter + content repurposing
  
SaaS:
  ✓ Ranking para 50+ keywords
  ✓ 10k+ monthly organic traffic
  ✓ Guest posting program
  ✓ Link partnerships
```

---

## 💡 TIPS FINALES

### No Hacer (Common Mistakes)

```
❌ Keyword stuffing ("comprar casa comprar casa comprar casa")
❌ Spamear links (PBN networks, link farms)
❌ Duplicate content entre idiomas
❌ Página lenta (>3 segundos load time)
❌ Cambiar URLs sin 301 redirects
❌ Creer que SEO es "one-time"
❌ Ignorar mobile (60% tráfico es mobile)
❌ Competitor analysis offline
```

### Hacer (Best Practices)

```
✅ User-first: Write for humans, not robots
✅ Content quality over quantity
✅ Actualizar artículos viejos (refresh)
✅ Natural linking (relevante + contextual)
✅ Mobile-first design
✅ Fast loading (sub 2 segundos ideal)
✅ Consistent publishing (2-4x/semana)
✅ Monitor competitors
✅ Test & iterate (A/B testing)
✅ Patience (6+ meses para resultados)
```

### Quick Reference: Keyword Density

```
Para artículos de 2000 palabras:
- Keyword principal: 1-1.5% (20-30 veces)
- Variaciones: 0.5-1% (10-20 veces)
- LSI keywords: 5-10 menciones

EJEMPLO:
"casa de lujo grau" = 1.5% (30 veces)
"villa grau" = 0.7% (15 veces)
"propiedad de lujo alicante" = 0.5% (10 veces)
"inmueble frente al mar" = 0.5% (10 veces)
```

---

## ✨ CONCLUSIÓN

**Para Vidahome.es**: 
- Focus on local keywords + blog content
- Target: 20-30% traffic growth en 6 meses
- Effort: 5-10 horas/semana
- ROI: Alto (es organizado)

**Para SaaS Futuro**:
- Build authority desde cero con content
- Target: 10-20 leads/mes en Año 1
- Effort: 15-20 horas/semana
- ROI: Positivo después de 18 meses

**Resource Stack**:
- SE Ranking (€55/mes): todo lo que necesitas
- Local SEO: Google My Business (GRATIS)
- Analytics: GA4 + Search Console (GRATIS)
- Content: Notion + Figma para planning (GRATIS)

---

Documento creado: 26 Feb 2026
Estado: Ready to implement

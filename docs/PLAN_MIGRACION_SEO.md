# Plan de Migración SEO: Vidahome.es → Next.js (Vercel)

Este documento es una hoja de ruta crítica para migrar la web actual a la nueva plataforma sin perder el posicionamiento ganado en Google, especialmente enfocado en **SEO Local (Gandia/La Safor)**.

## 1. Mapeo de URLs y Redirecciones 301 (Crítico)
Google ha indexado URLs específicas de la web actual. Si estas URLs desaparecen o devuelven 404, el SEO se desplomará.

### Estrategia de Redirección
Debemos configurar un mapa de redirecciones en `next.config.ts` o mediante un middleware que capture las URLs antiguas y las envíe a las nuevas:

| Tipo | URL Antigua (Ejemplo) | Nueva Ruta en Next.js |
| :--- | :--- | :--- |
| **Ficha Propiedad** | `/ficha.php?id=123456` | `/propiedades/123456` |
| **Catálogo** | `/propiedades.php` | `/propiedades` |
| **Contacto** | `/contacto.php` | `/contacto` |
| **Vender** | `/valoracion.php` | `/vender` |

### Tareas:
- [ ] Exportar lista completa de URLs indexadas de Google Search Console.
- [ ] Implementar `redirects()` en `next.config.ts`.
- [ ] Probar que los enlaces antiguos desde redes sociales sigan funcionando.

---

## 2. Metadatos Dinámicos y Server Components
Actualmente, las páginas interiores son Client Components (`'use client'`), lo que dificulta la indexación profunda de cada propiedad.

### Acciones Técnicas:
- [ ] **Convertir `propiedades/[id]` a Server Component**: Esto permite usar `generateMetadata` para que cada propiedad tenga su propio `<title>` y `<meta description>` con palabras clave como:
  *   *“Apartamento en Playa de Gandia - Ref: 123456 | Vidahome”*
- [ ] **OpenGraph Dinámico**: Generar imágenes de previsualización (OG Images) automáticamente para que al compartir por WhatsApp aparezca la foto de la casa.

---

## 3. SEO Local y Geo-Targeting (Gandia y La Safor)
Para dominar el mercado local, la web debe hablarle a Google específicamente sobre Gandia.

- [ ] **Palabras Clave en Home**: Integrar "Inmobiliaria en Gandia", "Vender piso en La Safor", "Casas de lujo en Oliva".
- [ ] **Google Business Profile**: Vincular la nueva web y usar etiquetas UTM para rastrear el tráfico.
- [ ] **Páginas de Localidad**: Crear landings específicas si es necesario (ej: `/propiedades/gandia`, `/propiedades/oliva`).

---

## 4. Datos Estructurados (Schema.org)
Implementar JSON-LD para que los resultados en Google sean más ricos (Rich Snippets).

- [ ] **RealEstateListing**: Añadir a la ficha de propiedad para que Google identifique precio, m², habitaciones y fotos directamente en la búsqueda.
- [ ] **LocalBusiness**: Añadir a la home y contacto con coordenadas y horario de la oficina.

---

## 5. Herramientas de Indexación
- [ ] **Sitemap.xml Dinámico**: Crear un generador que lea de la API de Inmovilla para que Google sepa siempre qué casas nuevas hay.
- [ ] **Robots.txt**: Configurar correctamente para guiar a los rastreadores.
- [ ] **Google Search Console**: Notificar el cambio de sitio si el dominio cambia (aunque sea solo de servidor).

---

## 6. Checklist Pre-Lanzamiento
1. [ ] Verificar que no existan enlaces rotos.
2. [ ] Comprobar que todas las imágenes tengan atributos `alt` descriptivos.
3. [ ] Medir **Core Web Vitals** (PageSpeed Insights) para asegurar que la web cargue en <1s.
4. [ ] Verificar que todos los formularios (Contacto/Tasación) funcionan en el dominio final.

---
*Documento preparado por Vidahome SEO Team (AI Support).*

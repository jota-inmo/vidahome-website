# Vidahome - Estado del Proyecto y Contexto Actual

Este documento es una bitácora para mantener el contexto de desarrollo entre sesiones. Úsalo para que Antigravity (o cualquier desarrollador) entienda rápidamente qué se ha hecho y qué falta.

---

## 🚀 Logros Recientes (Completado)

### 1. Integración de API Inmovilla (Web API)
- **Cambio de Estrategia**: Se migró de la REST API (v1) a la **Web API** (`apiweb.inmovilla.com`).
- **Razón**: La REST API tiene límites de frecuencia (rate limits) y es menos flexible para el catálogo. La Web API es más estable y permite peticiones por procesos.
- **Seguridad**: Implementación de validación de tipos y sanitización de entradas para evitar inyecciones SQL en los parámetros de búsqueda.

### 2. Infraestructura de Proxy (Arsys)
- **Static IP**: Configuración de un proxy en PHP alojado en Arsys (`api.vidahome.es`).
- **Problema Solucionado**: Vercel usa IPs dinámicas que Inmovilla bloquea. El proxy usa la IP fija de Arsys que ya está autorizada.
- **Seguridad**: Comunicación Vercel -> Arsys protegida con `X-Proxy-Secret`.

### 3. Caché Inteligente de Descripciones (Supabase)
- **Desafío**: El proceso `paginacion` de Inmovilla no devuelve las descripciones de los anuncios (solo datos básicos). El proceso `ficha` sí las trae pero es lento (1 por 1).
- **Solución**: Supabase actúa como "memoria rápida". 
    - Se han sincronizado **50 propiedades** manualmente.
    - El sistema tiene un motor de **auto-aprendizaje**: cuando alguien visita una ficha por primera vez, el sistema guarda el texto en Supabase para que aparezca en el catálogo general.

### 4. Visualización y UX Premium
- **Google Maps**: Integrado en la ficha de cada propiedad. Usa coordenadas exactas o dirección.
    - *Corrección técnica*: Se ajustó la **Content Security Policy (CSP)** en `next.config.ts` para permitir el cargue de frames de Google Maps.
    - *Diseño*: Se mantienen los **colores originales** del mapa para facilitar la identificación de puntos de interés (playas, zonas verdes) por parte del usuario.
- **Limpieza de Textos**: Motor que elimina etiquetas HTML, emoticonos excesivos y asteriscos de portales que vienen del CRM.
- **Selector de Idioma**: Soporte para Español (`es`) e Inglés (`en`).

---

### 5. Soporte Multi-idioma Inteligente (Caché JSONB)
- **Problema**: El catálogo solo cargaba descripciones en español desde Supabase.
- **Solución**: Se implementó una columna `descriptions` (JSONB) que almacena un mapa de idiomas (`es`, `en`, `fr`, etc.).
- **Auto-Aprendizaje**: Al visitar una ficha, el sistema extrae automáticamente todos los idiomas disponibles de Inmovilla y los guarda en la "bóveda" de Supabase.
- **Autotraducción con IA (Gratis)**: Integración con **Hugging Face** (Helsinki-NLP/MarianMT y NLLB) para traducir automáticamente descripciones faltantes desde el español. Las traducciones se guardan en Supabase para futuras consultas.
- **Panel de Control de Traducciones**: Nueva sección en `/admin/translations` que permite revisar, corregir y guardar manualmente las descripciones en todos los idiomas (ES, EN, FR, DE).
- **Corrección de Build**: Solucionado error de tipado en `revalidateTag` para compatibilidad con Next.js 16.

---

## �️ En Curso (In Progress)

- **Monitoreo de Sincronización**: Verificando la correcta captura de idiomas en nuevas propiedades.

---

## 📅 Próximos Pasos (Pendiente)

1.  **Mejoras SEO**: Refinar los metadatos de las fichas individuales.
2.  **Dashboard Admin**: Vista para forzar sincronización de idiomas.
3.  **Refactor de Limpieza**: Aplicar el motor de limpieza de textos de forma recursiva a todos los idiomas guardados.

---
*Última actualización: 23/02/2026 por Antigravity AI.*

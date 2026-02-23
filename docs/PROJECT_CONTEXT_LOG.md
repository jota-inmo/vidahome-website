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
- **Google Maps**: Integrado en la ficha de cada propiedad. Usa coordenadas exactas si existen; si no, hace geocodificación por dirección + población.
- **Limpieza de Textos**: Motor que elimina etiquetas HTML, emoticonos excesivos y asteriscos de portales que vienen del CRM.
- **Selector de Idioma**: Soporte para Español (`es`) e Inglés (`en`).

---

## 🛠️ En Curso (In Progress)

- **Optimización de Metadatos**: Actualmente, el enriquecimiento con Supabase solo se aplica a `locale: 'es'`. Estamos evaluando si extenderlo a otros idiomas o confiar en las traducciones directas de Inmovilla.
- **Monitoreo de Sincronización**: Verificando que las nuevas propiedades captadas en el CRM se guarden correctamente en la caché al ser visitadas.

---

## 📅 Próximos Pasos (Pendiente)

1.  **Mejoras SEO**: Refinar los metadatos de las fichas individuales para que Google indexe mejor las descripciones "limpias" que generamos.
2.  **Dashboard Admin**: Una vista simple para ver cuántas propiedades están "cacheada" y forzar una sincronización si fuera necesario.
3.  **Filtrado Avanzado**: Añadir más filtros al catálogo (piscina, vistas al mar, rango de precios más preciso).

---
*Última actualización: 23/02/2026 por Antigravity AI.*

# Guía Maestra de Integración y Configuración - Vidahome Premium

Este documento detalla toda la arquitectura y los pasos técnicos realizados para integrar la Inmovilla Web API, el sistema de Catastro y la persistencia en Supabase. Úsalo como referencia si necesitas reconstruir el sistema o entender su funcionamiento.

## 1. El Desafío: El Filtro de Seguridad de Inmovilla
Inmovilla requiere que las llamadas a su API provengan de una **IP estática autorizada**.
*   **Problema**: Vercel (donde está alojada la web) utiliza una infraestructura de nube con IPs dinámicas que cambian constantemente. Inmovilla bloqueaba estas peticiones con el error `IP NO VALIDADA`.
*   **Solución**: Implementar un **Proxy Intermedio** en un servidor con IP estática.

---

## 2. Infraestructura del Proxy (Arsys)
Hemos utilizado el hosting existente de la agencia en Arsys para actuar como puente seguro.

### Configuración DNS
*   **Subdominio**: `api.vidahome.es`
*   **Tipo**: Registro A
*   **Destino**: `217.76.132.196` (IP estática del servidor de Arsys).
*   **Nota**: En Arsys se activó la opción "Atender a todos los encabezados" para que el servidor responda correctamente a este subdominio.

### Script de Proxy (`arsys-proxy/inmovilla-proxy.php`)
Ubicado en el servidor de Arsys en `/api/inmovilla-proxy.php`.
*   **Función**: Recibe la petición de Vercel, valida una clave secreta (`X-Proxy-Secret`) y reenvía los datos a Inmovilla usando la IP estática del servidor.
*   **Seguridad**: Solo Vercel conoce la clave secreta, impidiendo que terceros usen tu proxy.

---

## 3. Integración Inmovilla Web API
Se ha implementado un cliente profesional (`src/lib/api/web-client.ts`) que maneja:
*   **Credenciales**: 
    *   Agencia: `13031`
    *   Sucursal: `_244_ext`
    *   Dominio registrado: `vidahome.es`
*   **Seguridad**: Validación de tipos de datos y saneamiento de entradas para evitar inyecciones.
*   **Ordenación**: Configurado para mostrar siempre lo más reciente primero (`cod_ofer DESC`). Esto es un requisito de negocio crítico para garantizar que las últimas captaciones encabecen el catálogo.
*   **Estructura del Header**: La API Web es extremadamente sensible. El header **DEBE** incluir `;lostipos` al final de la cadena de autenticación inicial: `$agencia$sucursal;$password;$idioma;lostipos`. Sin este campo fijo, Inmovilla devuelve errores de PHP (`Error tipo consulta`).
*   **Estrategia "Dual-Fetch" (Ficha + Paginación)**: Para maximizar la fiabilidad, la web solicita simultáneamente el proceso `ficha` (para descripciones ricas) y `paginacion` (para campos básicos y fotos). Los datos se fusionan para asegurar que nunca falten imágenes o precios si un proceso falla.
*   **Mapeo de Descripciones**: Se ha descubierto que Inmovilla envía las descripciones en un array paralelo de nivel raíz `$descripciones[id][idioma]['descrip']`. El adaptador de la web está programado para localizar estos datos dinámicamente, solucionando el problema de los textos genéricos.

---

## 4. Base de Datos (Supabase)
Utilizamos Supabase para la persistencia de datos que la API de Inmovilla no gestiona o para copias de seguridad de seguridad.

### Tablas Creadas (Ejecutar en SQL Editor de Supabase)

```sql
-- 1. Propiedades Destacadas (Homepage)
CREATE TABLE IF NOT EXISTS featured_properties (
  id SERIAL PRIMARY KEY,
  cod_ofer INTEGER UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Leads de Contacto (Propiedades de compra/alquiler)
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT,
  apellidos TEXT,
  email TEXT,
  telefono TEXT,
  mensaje TEXT,
  cod_ofer INTEGER, -- ID de la propiedad por la que preguntan
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Solicitudes de Valoración (Vender)
CREATE TABLE IF NOT EXISTS valuation_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT,
  email TEXT,
  telefono TEXT,
  direccion TEXT,
  municipio TEXT,
  provincia TEXT,
  referencia_catastral TEXT,
  datos_catastro JSONB, -- Información técnica extraída de la API de Catastro
  mensaje TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Control de Frecuencia (Rate Limiting)
CREATE TABLE IF NOT EXISTS rate_limits (
    identifier TEXT PRIMARY KEY, -- Identificador único (ej: "submit_lead:IP")
    count INTEGER DEFAULT 0,
    last_attempt TIMESTAMPTZ DEFAULT now(),
    reset_at TIMESTAMPTZ NOT NULL
);
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
-- Solo acceso desde el servidor (service role)
```

---

## 5. Variables de Entorno (Vercel)
Para que el sistema funcione, estas variables deben estar configuradas en el panel de Vercel:

| Variable | Descripción |
| :--- | :--- |
| `INMOVILLA_AGENCIA` | Número de agencia Inmovilla (ver panel de Inmovilla) |
| `INMOVILLA_ADDAGENCIA` | Sufijo de sucursal Inmovilla (ej: `_244_ext`) |
| `INMOVILLA_PASSWORD` | Contraseña de la API de Inmovilla (ver panel de Inmovilla) |
| `INMOVILLA_DOMAIN` | Dominio autorizado en Inmovilla (ej: `vidahome.es`) |
| `ARSYS_PROXY_URL` | URL completa del script PHP en Arsys (ej: `https://api.tudominio.es/api/inmovilla-proxy.php`) |
| `ARSYS_PROXY_SECRET` | Clave secreta aleatoria (debe coincidir con `PROXY_SECRET` en el PHP de Arsys) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase (panel de Supabase → Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima de Supabase (panel de Supabase → Settings → API) |
| `ADMIN_PASSWORD` | Contraseña elegida para acceder a `/admin/login` (mínimo 12 caracteres) |

---

## 6. Seguridad y Protección Anti-Spam
1.  **Validación de IPs**: Inmovilla solo responde a Arsys.
2.  **Secretos**: La comunicación Vercel -> Arsys está protegida por un secreto.
3.  **Sanitización**: Todas las búsquedas pasan por filtros anti-inyección SQL.
4.  **Caché (Next.js Data Cache)**: Implementamos una caché de 20 minutos usando `unstable_cache` para persistencia en Vercel.
5.  **Rate Limiting Persistente**: Control de intentos por IP guardado en Supabase para evitar abusos en formularios:
    *   **Contacto**: 3 envíos/hora.
    *   **Tasaciones**: 5 consultas/hora.
6.  **Honeypot Mechanism**: Campos ocultos en formularios que detectan bots automáticamente y bloquean el procesamiento de forma silenciosa.

---

## 7. Identidad Visual y Multimedia

### Logotipo Oficial
*   **Archivo**: `public/MARCA OK.png`
*   **Implementación**: El componente `src/components/Logo.tsx` utiliza esta imagen directamente en lugar de SVG generados, garantizando la fidelidad de la marca. Posee filtros automáticos para adaptarse a fondos oscuros (Hero) y claros (Navbar).

### Hero Banner (Carrusel de Vídeos)
*   **Archivos**: Ubicados en `public/videos/` (`cocina.mp4`, `gato.mp4`, etc.).
*   **Comportamiento**:
    *   Autorrotación cada 10 segundos.
    *   Carga diferida (solo carga el vídeo activo para ahorrar datos).
    *   **Posters**: Utiliza imágenes de alta resolución de Unsplash mientras el vídeo se descarga.
    *   **Loop**: Activado para evitar que el banner se detenga.

### Optimización de Galería (Visual)
*   **Modo de Visualización**: Se utiliza `object-contain` en lugar de `cover` para garantizar que el 100% de la fotografía inmobiliaria sea visible sin cortes ni zooms automáticos que alteren la percepción del espacio.
*   **Estabilidad**: Se han eliminado los efectos de zoom y escalado en la galería para ofrecer una experiencia de usuario más premium y fiel a la realidad.

### Identidad y Terminología
*   **Adaptación Lingüística**: El proyecto está enfocado exclusivamente en la versión española. Se ha estandarizado el uso de términos como "Ascensor" en lugar de "Elevador" para mayor naturalidad.
*   **Branding Sidebar**: Se ha simplificado la marca en la ficha de detalle, eliminando el sufijo "Expert" para mantener la consistencia con la marca principal "Vidahome", pero manteniendo el sello de "Especialista en La Safor".

### Refinamiento y Compartir
*   **Limpieza de Terminología**: Se ha eliminado el adjetivo "Exclusiva" de los botones y textos para un tono más profesional y menos redundante.
*   **Minimalismo en Ficha**: Eliminación del encabezado "Acerca de esta propiedad" para que la descripción fluya naturalmente sin etiquetas innecesarias, mejorando la estética editorial.
*   **Lógica de Precio**: Se ha ocultado el texto "Precio bajo consulta" cuando la propiedad tiene un precio definido.
*   **Función Compartir**: Implementación del botón de compartición nativa (Web Share API) con fallback a WhatsApp para facilitar la difusión de las propiedades.
*   **WhatsApp Minimal**: El botón de contacto se ha rediseñado como un icono flotante sin fondo circular sólido, integrándose de forma más sutil y premium en la esquina de la pantalla.

### Expansión de Layout (Efecto de Vista Panorámica)
*   **Contenedores Ampliados**: Se ha aumentado el ancho máximo de los contenedores de `1280px` (7xl) a **`1600px`**. Esto simula el efecto visual de un zoom al 80%, permitiendo que el usuario vea más información y más propiedades simultáneamente sin perder impacto visual.
*   **Reestructuración de Grid**: La página de propiedades ha pasado de 2 a **3 columnas** en pantallas grandes, optimizando el espacio y ofreciendo una sensación más premium y de catálogo completo.
*   **Conservación de Impacto**: El banner de vídeo (Hero) se mantiene a pantalla completa (`h-screen`) para conservar su fuerza visual original mientras el resto de la web se adapta a una vista más informativa.

### Visibilidad de Marca (Logo OK)
*   **Protección de Identidad**: El logotipo oficial (PNG con transparencia) ahora se presenta dentro de una "cápsula" con fondo blanco y bordes suavizados. Esto garantiza que los colores originales de la marca sean siempre visibles y legibles, independientemente de si el usuario utiliza el modo claro, el modo oscuro o si el logo se encuentra sobre una imagen compleja.
*   **Eliminación de Filtros**: Se han eliminado los filtros de inversión de color (`invert`) para respetar la paleta cromática original de Vidahome en todo momento.

### Perfeccionamiento del Banner (Hero)
*   **Transiciones Fluida**: Se ha corregido el error de parpadeo (flicker) entre vídeos. Ahora, el vídeo saliente permanece renderizado durante la transición de opacidad, logrando un fundido cruzado perfecto sin que se vean fotos estáticas o huecos negros entre clips.
*   **Simplificación de UI**: Se han eliminado los elementos "Comprar" del buscador y "Descubre" del pie de página del banner para una estética más minimalista y centrada en la marca Vidahome.

### Gestión Dinámica de Banner (Hero Engine PRO)
*   **Independencia Total**: Sistema optimizado con Swiper.js y Realtime de Supabase.
*   **Almacenamiento**: Los vídeos se alojan en el bucket **`videos`** (público).
*   **Smart Links**: 
    *   **Vacío**: Redirige automáticamente al catálogo (`/propiedades`).
    *   **Sólo número**: Detecta IDs de propiedades (ej: `13031`) y genera el enlace `/propiedades/13031`.

#### Configuración Técnica (Supabase):
Ejecuta este SQL revisado para compatibilidad total con el nuevo motor:
```sql
CREATE TABLE hero_slides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'video', -- 'video' | 'image'
  video_path TEXT NOT NULL,         -- Ruta en el storage
  link_url TEXT,                    -- URL de destino o ID de propiedad
  title TEXT,                       -- Título principal
  order INTEGER DEFAULT 0,          -- Posición
  active BOOLEAN DEFAULT true,      -- Visibilidad
  poster TEXT,                      -- Imagen pre-carga
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS y Políticas
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura pública" ON hero_slides FOR SELECT USING (true);
CREATE POLICY "Gestión Admin" ON hero_slides FOR ALL USING (true); 
```
**Requisito de Storage**: Crear bucket público llamado **`videos`**.

### Panel de Control Centralizado (Admin Hub)
*   **Gestión Unificada**: Se ha creado un centro de mando en `/admin` que permite gestionar el **Banner Principal** (`/admin-hero`) o las **Propiedades Destacadas**.
*   **Hero Admin PRO**: Panel avanzado con previsualización de vídeo en tiempo real, subida directa al storage y gestión de orden/visibilidad.

### 8. Arquitectura Modular (Refactorización 2026)
Para mejorar la mantenibilidad, el proyecto ha sido desacoplado:
1.  **Modular Server Actions**: Las acciones ya no viven en un archivo central. Se dividen en `src/app/actions/`: `auth`, `catastro`, `hero`, `inmovilla`, `media`.
2.  **Componentización de Páginas**: Las páginas complejas (como `/vender`) se han fragmentado en componentes especializados dentro de sus directorios locales (`/components`).
3.  **Barrel Files**: Uso de `actions.ts` como punto de exportación límpio para facilitar las importaciones en el frontend.

### Próximos Pasos (Roadmap)
1.  **Cumplimiento Legal (Cookies & GDPR)**:
    *   Implementar banner de consentimiento granular (LSSI-CE / RGPD).
    *   Configurar Consent Mode para scripts analíticos y de marketing.
2.  **Estrategia SEO & GEO (Posicionamiento Local)**:
    *   **GEO-SEO**: Optimización profunda para Gandia y La Safor.
    *   **Rich Snippets**: Marcado Schema.org (JSON-LD) para propiedades (precio, fotos, estrellas en Google).
    *   **Social Graph**: Optimización de OpenGraph para compartición enriquecida en WhatsApp/Redes.

---
---
*Documento actualizado el 19/02/2026 por Antigravity AI (Refinamientos Visuales).*


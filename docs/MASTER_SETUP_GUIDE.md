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
```

---

## 5. Variables de Entorno (Vercel)
Para que el sistema funcione, estas variables deben estar configuradas en el panel de Vercel:

| Variable | Descripción |
| :--- | :--- |
| `INMOVILLA_AGENCIA` | `13031` |
| `INMOVILLA_ADDAGENCIA` | `_244_ext` |
| `INMOVILLA_PASSWORD` | `HQYn5#Gg8` |
| `INMOVILLA_DOMAIN` | `vidahome.es` |
| `ARSYS_PROXY_URL` | `http://api.vidahome.es/api/inmovilla-proxy.php` |
| `ARSYS_PROXY_SECRET` | Clave aleatoria de seguridad (debe coincidir con la del PHP) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima de tu proyecto Supabase |
| `ADMIN_PASSWORD` | Contraseña para acceder a `/admin/login` |

---

## 6. Seguridad y Buenas Prácticas
1.  **Validación de IPs**: Inmovilla solo responde a Arsys.
2.  **Secretos**: La comunicación Vercel -> Arsys está protegida por un secreto que cambia si es necesario.
3.  **Sanitización**: Todas las búsquedas de texto pasan por un filtro que bloquea comandos SQL sospechosos.
4.  **Caché**: Implementamos una caché de 20 minutos para no saturar la API y que la web vuele.

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
*   **Lógica de Precio**: Se ha ocultado el texto "Precio bajo consulta" cuando la propiedad tiene un precio definido.
*   **Función Compartir**: Implementación del botón de compartición nativa (Web Share API) con fallback a WhatsApp para facilitar la difusión de las propiedades.

### Expansión de Layout (Efecto de Vista Panorámica)
*   **Contenedores Ampliados**: Se ha aumentado el ancho máximo de los contenedores de `1280px` (7xl) a **`1600px`**. Esto simula el efecto visual de un zoom al 80%, permitiendo que el usuario vea más información y más propiedades simultáneamente sin perder impacto visual.
*   **Reestructuración de Grid**: La página de propiedades ha pasado de 2 a **3 columnas** en pantallas grandes, optimizando el espacio y ofreciendo una sensación más premium y de catálogo completo.
*   **Conservación de Impacto**: El banner de vídeo (Hero) se mantiene a pantalla completa (`h-screen`) para conservar su fuerza visual original mientras el resto de la web se adapta a una vista más informativa.

### Visibilidad de Marca (Logo OK)
*   **Protección de Identidad**: El logotipo oficial (PNG con transparencia) ahora se presenta dentro de una "cápsula" con fondo blanco y bordes suavizados. Esto garantiza que los colores originales de la marca sean siempre visibles y legibles, independientemente de si el usuario utiliza el modo claro, el modo oscuro o si el logo se encuentra sobre una imagen compleja.
*   **Eliminación de Filtros**: Se han eliminado los filtros de inversión de color (`invert`) para respetar la paleta cromática original de Vidahome en todo momento.

---
---
*Documento actualizado el 18/02/2026 por Antigravity AI (Protección de identidad visual y logo).*

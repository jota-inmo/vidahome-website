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
    *   Agencia: `ID_AGENCIA`
    *   Sucursal: `ID_SUCURSAL`
    *   Dominio registrado: `vidahome.es`
*   **Seguridad**: Validación de tipos de datos y saneamiento de entradas para evitar inyecciones.
*   **Ordenación**: Configurado para mostrar siempre lo más reciente primero (`cod_ofer DESC`). Esto es un requisito de negocio crítico para garantizar que las últimas captaciones encabecen el catálogo.
*   **Estructura del Header**: La API Web es extremadamente sensible. El header **DEBE** incluir `;lostipos` al final de la cadena de autenticación inicial: `$agencia$sucursal;$password;$idioma;lostipos`. Sin este campo fijo, Inmovilla devuelve errores de PHP (`Error tipo consulta`).
*   **Estrategia "Dual-Fetch" (Ficha + Paginación)**: Para maximizar la fiabilidad, la web solicita simultáneamente el proceso `ficha` (para descripciones ricas) y `paginacion` (para campos básicos y fotos). Los datos se fusionan para asegurar que nunca falten imágenes o precios si un proceso falla.
*   **Mapeo de Descripciones PRO**: Se ha descubierto que Inmovilla envía las descripciones en un array paralelo de nivel raíz `$descripciones`. El motor ahora utiliza una estrategia de búsqueda por `cod_ofer` dentro de este array.
*   **Limpieza de Textos (Sanitización)**: Se ha implementado un motor de limpieza (`src/lib/utils/text-cleaner.ts`) que elimina automáticamente etiquetas HTML (como `<br>`), emoticonos excesivos, asteriscos de portales inmobiliarios y normaliza saltos de línea para mantener una estética de lujo y minimalismo.

---

### 4. Base de Datos (Supabase)
Utilizamos Supabase para la persistencia de datos que la API de Inmovilla no gestiona o para copias de seguridad de seguridad y enriquecimiento de datos.

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
  datos_catastro JSONB, 
  mensaje TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Caché de Metadatos de Propiedad (Enriquecimiento de Catálogo)
-- Se ha implementado un sistema de "bóveda" multi-idioma usando JSONB.
CREATE TABLE IF NOT EXISTS property_metadata (
    cod_ofer INTEGER PRIMARY KEY,
    ref TEXT,
    description TEXT, -- Legacy (español)
    descriptions JSONB DEFAULT '{}'::jsonb, -- Almacena ES, EN, FR, DE, etc.
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Control de Frecuencia (Rate Limiting)
CREATE TABLE IF NOT EXISTS rate_limits (
    identifier TEXT PRIMARY KEY,
    count INTEGER DEFAULT 0,
    last_attempt TIMESTAMPTZ DEFAULT now(),
    reset_at TIMESTAMPTZ NOT NULL
);

-- 6. Datos de la Agencia y Horarios (Gestión Dinámica)
CREATE TABLE IF NOT EXISTS company_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. Diapositivas del Banner Hero (Vídeo/Imagen)
CREATE TABLE IF NOT EXISTS hero_slides (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_path TEXT NOT NULL,
    link_url TEXT,
    title TEXT, -- Título legado (ES)
    titles JSONB DEFAULT '{}'::jsonb, -- Mapa de traducciones {es, en, fr...}
    "order" INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    type TEXT DEFAULT 'video',
    poster TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS y Políticas
ALTER TABLE property_metadata ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read metadata" ON property_metadata FOR SELECT USING (true);
CREATE POLICY "Allow all for system" ON property_metadata FOR ALL USING (true);

ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read hero" ON hero_slides FOR SELECT USING (true);
CREATE POLICY "Allow all management hero" ON hero_slides FOR ALL USING (true);
```

### Motor de Auto-Aprendizaje e Inteligencia Artificial
Para superar la restricción de Inmovilla que omite descripciones en el catálogo y facilitar la expansión internacional:
1.  **Captura**: Cuando un usuario visita la ficha individual, el sistema extrae todos los idiomas disponibles de Inmovilla y los guarda en Supabase.
2.  **Optimización de Consulta**: Antes de cualquier acción de IA, el sistema comprueba la "bóveda" de Supabase. Si existe la traducción para el locale actual, se sirve instantáneamente (latencia zero).
3.  **Autotraducción (Hugging Face)**: Si falta un idioma en Supabase, el sistema utiliza la API de Hugging Face. Se ha implementado un **timeout de 8 segundos** y un `AbortController` para evitar que la carga de la página se bloquee si el modelo de IA está inactivo.
4.  **Panel de Control**: Los agentes pueden supervisar y editar manualmente estas traducciones desde `/admin/translations`.
5.  **Entrega**: Cuando se carga el catálogo general, el sistema inyecta las descripciones reales guardadas, priorizando el idioma del usuario.

---

## 5. Variables de Entorno (Vercel)
| Variable | Descripción |
| :--- | :--- |
| `INMOVILLA_AGENCIA` | Número de agencia Inmovilla |
| `INMOVILLA_ADDAGENCIA` | Sufijo de sucursal Inmovilla |
| `INMOVILLA_PASSWORD` | Contraseña de la API de Inmovilla |
| `INMOVILLA_DOMAIN` | Dominio autorizado en Inmovilla |
| `ARSYS_PROXY_URL` | URL del script PHP en Arsys |
| `ARSYS_PROXY_SECRET` | Clave secreta para el proxy |
| `NEXT_PUBLIC_SUPABASE_URL` | URL de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio de Supabase |
| `HUGGINGFACE_TOKEN` | Token de acceso para la API de IA de Hugging Face |

---

## 6. Seguridad y Protección Anti-Spam
1.  **Validación de IPs**: Inmovilla solo responde a Arsys.
2.  **Secretos**: Comunicación Vercel -> Arsys protegida.
3.  **Sanitización**: Filtros anti-inyección SQL y limpieza de HTML (`text-cleaner.ts`).
4.  **Rate Limiting**: Control de intentos por IP en Supabase.

---

## 7. UX y Navegación Premium
*   **Scroll Restoration**: El botón "Volver" en la ficha técnica utiliza `router.back()` para asegurar que el usuario regrese exactamente al mismo punto del catálogo donde estaba, evitando scrolls innecesarios.
*   **Identidad Visual**: Logotipo oficial en cápsula de protección para máxima legibilidad.
*   **Expansión de Layout**: Vista panorámica a 1600px para una experiencia más inmersiva.

---

## 8. Soporte Multi-idioma (i18n)

La aplicación utiliza `next-intl` para la internacionalización, soportando Español (`es`) como idioma por defecto e Inglés (`en`).

### Arquitectura
- **Enrutamiento**: Los locales se gestionan mediante rutas localizadas (`/[locale]/...`). Un middleware personalizado maneja la detección de idioma y la redirección de rutas.
- **Mensajes**: Las traducciones se almacenan en `messages/{locale}.json`.
- **Infraestructura**:
  - `src/i18n/routing.ts`: Configuración de locales soportados y estrategia de rutas.
  - `src/i18n/request.ts`: Configuración de servidor para cargar los mensajes.
  - `next.config.ts`: Integrado con el plugin de `next-intl`.

### Componentes y Hooks
- **Client Components**: Utilizan `useTranslations('Namespace')` y `useLocale()`.
- **Server Components**: Utilizan `await getTranslations('Namespace')` de `next-intl/server`.
- **Navegación**: Se utiliza el `Link`, `usePathname` y `useRouter` localizados desde `@/i18n/routing` para preservar el idioma actual.

### Gestión de Traducciones
Para añadir o modificar textos:
1. Actualizar `messages/es.json` con la nueva clave.
2. Actualizar `messages/en.json` con la traducción correspondiente.
3. Acceder al texto en el código usando el namespace (ej. `t('key')`).

### Integración API Inmovilla
Las peticiones a la API de Inmovilla dependen del idioma detectado. El parámetro `inmoLang` se mapea automáticamente:
- `es` -> `1` (Español)
- `en` -> `2` (Inglés)

### Traducción de Tipos de Propiedad y Horarios
1. **Tipos de Propiedad**: `src/lib/utils/property-types.ts` mapea términos de Inmovilla (Piso → Apartment).
2. **Horarios Dinámicos**: `src/lib/utils/schedule-translator.ts` traduce cadenas de texto libre guardadas en Supabase (Lunes → Monday), permitiendo que la oficina cambie su horario sin romper la traducción.
3. **Banner Multilingüe**: El componente `LuxuryHero` prioriza el campo `titles[locale]` de la base de datos, permitiendo transcreaciones manuales de los eslóganes en lugar de traducciones literales.

---

*Documento actualizado el 23/02/2026 (17:40) por Antigravity AI.*

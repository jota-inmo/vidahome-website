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

-- 4. Nueva Tabla de Propiedades y Traducciones PRO (Perplexity Engine)
-- Reemplaza a property_metadata para mayor rendimiento y soporte IT.
CREATE TABLE IF NOT EXISTS properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id INTEGER UNIQUE, -- original cod_ofer
    ref TEXT,
    description_es TEXT,
    description_en TEXT,
    description_fr TEXT,
    description_de TEXT,
    description_it TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Log de Traducciones y Control de Costes
CREATE TABLE IF NOT EXISTS translation_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id INTEGER REFERENCES properties(property_id) ON DELETE CASCADE,
    language TEXT NOT NULL,
    tokens_used INTEGER,
    cost_estimate NUMERIC(10, 5),
    status TEXT DEFAULT 'success',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
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

### Motor de Auto-Aprendizaje y Traducción Inteligente (Perplexity AI)
Para superar la restricción de Inmovilla que omite descripciones en el catálogo y facilitar la expansión internacional:
1.  **Captura**: El sistema sincroniza los anuncios de Inmovilla con la tabla `properties` de Supabase.
2.  **Traducción Masiva (Perplexity Engine)**: Se utiliza el modelo `sonar-small-online` via Supabase Edge Functions para traducir anuncios de ES a EN, FR, DE e IT en un solo paso, manteniendo coherencia técnica inmobiliaria.
3.  **Bóveda de Alta Velocidad**: El catálogo consulta directamente la tabla `properties`. Si el anuncio ya está traducido, se sirve con latencia 0ms sin consultar la API de Inmovilla.
4.  **Panel de Control Inteligente**: Ubicado en `/admin/translations`, permite lanzar traducciones masivas, ver el progreso y controlar el coste estimado en tiempo real.
5.  **Control de Calidad**: Se registran todos los tokens y costes en `translation_log`.

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
| `SUPABASE_PERPLEXITY_API_KEY` | Clave de API de Perplexity para traducciones |

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
   - **Títulos individuales por slide**: Cada uno de los 5 slides del hero tiene su propio título y traducciones independientes (6 idiomas), gestionados en la columna JSONB `titles` de `hero_slides` indexada por `order`.
   - Actualizar con: `npx tsx scripts/populate-hero-translations.ts` (editar `HERO_TITLES_BY_ORDER` en el script)
   - Slide 0 (traveling lateral): *Hogares excepcionales, experiencia inigualable*
   - Slide 1 (piscina): *Vive el Mediterráneo desde tu propia piscina*
   - Slide 2 (techo): *Espacios donde cada detalle cuenta*
   - Slide 3 (cocina): *El lugar donde los sueños se convierten en hogar*
   - Slide 4 (gato/cama): *Comodidad y estilo en cada rincón*

---

---

## 9. Panel de Administración

La ruta `/admin` está organizada en **dos secciones** visuales más un acceso independiente al Blog:

### Sección 1 — Gestión de la Web (3 cards)
| Ruta | Función |
| :--- | :--- |
| `/admin/hero` | Gestión de vídeos y textos del banner principal |
| `/admin/featured` | Selección de las 6 propiedades destacadas en home |
| `/admin/settings` | Datos de agencia: teléfono, horarios, contacto |

### Sección 2 — Trabajo Inmobiliario (3 cards)
| Ruta | Función |
| :--- | :--- |
| `/admin/properties` | **Portfolio completo**: ver y editar todas las propiedades |
| `/admin/sync` | Sincronización manual con el CRM Inmovilla |
| `/admin/translations-hub` | Traducciones automáticas (Perplexity) y manuales |

### Standalone — Blog
| Ruta | Función |
| :--- | :--- |
| `/admin/blog` | Crear y editar artículos, gestionar categorías y traducir contenido |

> **Planificado**: botón "Generar con IA" en `/admin/blog` que usa Perplexity para generar el HTML completo del artículo (con placeholders `[FOTO_1]`, `[FOTO_2]`). El admin sube sus propias fotos desde Supabase Storage y se insertan en los huecos. El sistema auto-traduce a los 6 idiomas en el mismo flujo. Ver spec en `BLOG_SYSTEM_COMPLETE.md § Generación IA con Perplexity`.

### `/admin/properties` — Ficha de Propiedades
Muestra en tabla todas las propiedades del portfolio con los datos consolidados de `property_metadata` + `property_features`:
- **Columnas visibles**: Ref, Tipo, Población, Superficie m², Hab. simples, Hab. dobles, Baños, cobertura de textos (6 idiomas)
- **Indicador de textos**: puntos de colores (verde = traducción disponible, gris = vacío) con ratio x/6
- **Edición inline**: al hacer clic en una fila se despliega un panel de edición con:
  - Características físicas (superficie, habitaciones simples/dobles, baños)
  - Textos en los 6 idiomas mediante pestañas (ES, EN, FR, DE, IT, PL)
- **Búsqueda**: filtro en tiempo real por referencia, tipo o población
- **Acciones de servidor**: `getPropertiesSummaryAction`, `updatePropertyDescriptionsAction`, `updatePropertyFeaturesAction` en `src/app/actions/properties-admin.ts`

### Buscador de Propiedades — Categorías

El buscador público (`src/components/PropertySearch.tsx`) tiene **tres tabs**:

| Tab | `keyacci` / lógica | Badge en card |
| :--- | :--- | :--- |
| **Comprar** | `keyacci === 1`, refs que NO empiezan por `T` | `COMPRAR` |
| **Alquilar** | `keyacci === 2`, refs que NO empiezan por `T` | `ALQUILAR` |
| **Traspasos** | Refs que empiezan por `T` (ej: `T1234`) | `TRASPASO` |

La detección de traspasos es exclusivamente por prefijo de referencia (`ref.toUpperCase().startsWith('T')`), sin depender de `keyacci`. Los traspasos quedan excluidos automáticamente de los tabs Comprar y Alquilar.

Para consultar los datos en bruto puedes usar la VIEW de Supabase definida en `sql/property_summary_view.sql`:
```sql
SELECT * FROM property_summary;
```

### `/admin/properties` — Sistema de Discrepancias con Encargos
La tabla `encargos` (gestionada desde la webapp interna de la agencia) almacena datos contractuales. El panel compara automáticamente estos datos contra lo publicado en la web.

- **Señal visual**: Triángulo ⚠️ ámbar en cada fila con discrepancias
- **Badge global**: Contador en el header ("X propiedades con discrepancias vs encargos")
- **Popup de detalle**: Click en ⚠️ → modal con cada diferencia:
  - Campos comparados: precio, tipo, habitaciones, baños
  - Valores lado a lado: Encargo vs Web
- **Descartar**: Botón para ignorar una discrepancia (no vuelve a aparecer salvo que los valores cambien)
- **Persistencia**: Tabla `discrepancias_dismissed` con UNIQUE(ref, campo, valor_encargo, valor_web)

**Server Actions** (`src/app/actions/discrepancias.ts`):
- `getDiscrepanciasAction()` — cruza encargos vs web, excluye descartadas
- `dismissDiscrepanciaAction()` — guarda dismiss en Supabase

**Script CLI** (`scripts/compare-encargos-web.ts`):
```bash
npx tsx scripts/compare-encargos-web.ts          # solo activas
npx tsx scripts/compare-encargos-web.ts --all     # incluir retiradas
npx tsx scripts/compare-encargos-web.ts --ref 2922 # una sola referencia
```

### Tablas de Soporte

```sql
-- Discrepancias descartadas (ya creada)
CREATE TABLE discrepancias_dismissed (
  id SERIAL PRIMARY KEY,
  ref TEXT NOT NULL,
  campo TEXT NOT NULL,
  valor_encargo TEXT NOT NULL,
  valor_web TEXT NOT NULL,
  dismissed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ref, campo, valor_encargo, valor_web)
);
```

---

## 10. Scripts de Mantenimiento y Auditoría

| Script | Función |
| :--- | :--- |
| `scripts/audit-vs-inmovilla.ts` | Auditoría: DB columns vs full_data (Modo A) o vs API live (Modo B) |
| `scripts/compare-encargos-web.ts` | Comparación encargos vs datos publicados en web |
| `scripts/fix-habitaciones.ts` | Corrige hab. simples/dobles y total en property_features |
| `scripts/build-localidades-map.ts` | Genera `localidades_map.json` desde CPs y actualiza poblaciones |
| `scripts/inspect-full-data.ts` | Inspecciona estructura de full_data en property_metadata |
| `scripts/inspect-encargos.ts` | Inspecciona estructura de tabla encargos |
| `scripts/translate-direct.ts` | Traducciones con Perplexity AI |
| `scripts/fix-and-translate.ts` | Traduce propiedades con `--refs=A,B,C` y/o `--force` |
| `scripts/populate-hero-translations.ts` | Actualiza títulos por slide (editar `HERO_TITLES_BY_ORDER`) |
| `scripts/restore-from-properties.mjs` | Restaura `property_metadata.descriptions` desde tabla backup `properties` |

---

*Documento actualizado el 27/02/2026 por Antigravity AI.*

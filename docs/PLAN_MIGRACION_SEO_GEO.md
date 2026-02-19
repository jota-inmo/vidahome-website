# 🔄 Hoja de Ruta: Migración Vidahome.es → Next.js (Vercel)

Este documento detalla los pasos técnicos necesarios para migrar el tráfico del dominio principal `vidahome.es` a la nueva infraestructura sin perder autoridad SEO y optimizando para el nuevo estándar **GEO (Generative Engine Optimization)**.

## Fase 1: Configuración en Vercel
1.  **Dashboard de Vercel**: Ir a *Settings > Domains*.
2.  **Añadir Domino**: Introducir `vidahome.es`.
3.  **Configuración DNS**: El panel de Vercel proporcionará registros (A, CNAME o TXT). Debes añadirlos en tu panel de control de dominio (Arsys/Godaddy/DonDominio).
4.  **Verificación**: Esperar a que el estado cambie a "Valid".

## Fase 2: El "Switch" Temporal (Redirección .htaccess)
Para que el cambio sea instantáneo en el servidor actual mientras se propagan las DNS:
1.  Acceder por FTP/SFTP a la raíz de la web antigua.
2.  Editar o crear un archivo `.htaccess`.
3.  Añadir este código al inicio del archivo:
    ```apache
    RewriteEngine On
    # Redirigir todo el tráfico al nuevo subdominio de Vercel temporalmente
    RewriteRule ^(.*)$ https://vidahome-website.vercel.app/$1 [R=301,L]
    ```

## Fase 3: Cambio Global de Referencias
Una vez las DNS apunten a Vercel, realizaremos un reemplazo global en el código:
1.  **Buscar**: `vidahome-website.vercel.app`
2.  **Reemplazar**: `vidahome.es`
*Esto actualizará todos los esquemas JSON-LD, sitemaps y metadatos de redes sociales.*

## Fase 4: Google Search Console (Mantenimiento SEO)
1.  **Nueva Propiedad**: Verificar la propiedad `https://vidahome.es` en Search Console (si no está ya).
2.  **Submit Sitemap**: Enviar la URL `/sitemap.xml` para que Google empiece a rastrear las nuevas rutas inmediatamente.
3.  **Monitor de Errores**: Revisar diariamente la sección de "Páginas" para detectar errores 404 de URLs antiguas que no hayamos mapeado.

## Fase 5: Inversión Final
Cuando el dominio estalle 100% en Vercel, se debe eliminar la redirección en la web antigua (que ya no recibirá tráfico) y confirmar que el certificado SSL de Vercel está activo.

---

# 🚀 GEO: Estrategia de Visibilidad en IAs (Implementada)

Hemos aplicado las siguientes técnicas para aparecer como "La mejor inmobiliaria en Gandia" en Perplexity, Gemini y Claude:

### 1. Marcado Estructurado Premium
- **RealEstateAgent**: Implementado en la Home con coordenadas exactas, horario de 20h y datos de contacto.
- **FAQPage (Página /gandia-playa)**: Contenido diseñado para ser citado por IAs, respondiendo a "¿Cuál es la mejor?", "¿Precios medios?" y "¿Rapidez?".

### 2. Contenido de Autoridad Local
Hemos creado la landing `/gandia-playa` con métricas reales que las IAs valoran positivamente:
- **Pruebas Sociales**: "+116 propiedades activas", "50 ventas en 2025".
- **Eficiencia**: "Cierres en 15-30 días promedio".

### 3. Robots.txt "IA-Friendly"
Hemos abierto las puertas a los rastreadores específicos de modelos de lenguaje:
- `GPTBot` (OpenAI/ChatGPT)
- `Google-Extended` (Google Gemini)
- `OAI-SearchBot`
- `anthropic-ai` (Claude)

---
*Plan de acción preparado por el equipo de AI de Vidahome. Listo para ejecución manual por el cliente.*

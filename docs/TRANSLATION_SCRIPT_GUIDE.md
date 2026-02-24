# Translation Script: Property Metadata Multi-Language Support
## Using Hugging Face API

### 📋 Overview

Este script traduce automáticamente la tabla `property_metadata` de tu base de datos Supabase usando modelos de traducción de Hugging Face (OPUS-MT).

**Características:**
- ✅ Traduce ES → FR, DE, PL
- ✅ Traduce EN → FR, DE, PL
- ✅ Limpia automáticamente los textos (elimina HTML, espacios)
- ✅ Proceso por lotes para evitar errores
- ✅ Tasa de éxito configurable
- ✅ Logs detallados del progreso

### 🚀 Instalación & Configuración

#### 1. Verificar requisitos

```bash
# Verificar que tienes Node.js 18+
node --version

# Verificar que tienes tsx instalado (ya está en package.json)
npm list tsx
```

#### 2. Configurar variables de entorno

Asegúrate de que tu `.env.local` contiene:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://yheqvroinbcrrpppzdzx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# Hugging Face (IMPORTANTE: Tu token)
# Obtén uno en: https://huggingface.co/settings/tokens
HUGGINGFACE_TOKEN=hf_your_token_here
```

**⚠️ IMPORTANTE:** 
- El token de Hugging Face debe tener permisos de lectura de APIs
- Obtén uno en: https://huggingface.co/settings/tokens

#### 3. Verificar conexión a Supabase

```bash
# Ejecutar script de verificación
npm run api:test
```

### 📖 Cómo Usar

#### Opción 1: Ejecutar en Modo Normal (Recomendado)

```bash
npm run translate:metadata
```

**Qué hace:**
1. ✅ Lee todas las propiedades de `property_metadata`
2. ✅ Identifica idiomas faltantes (FR, DE, PL)
3. ✅ Traduce usando Hugging Face API
4. ✅ Limpia los textos automáticamente
5. ✅ Actualiza las descripciones en Supabase
6. ✅ Muestra resumen de éxito

#### Opción 2: Ejecutar en Modo Test (Primero!)

Copia este código en un archivo `test-translate.ts`:

```typescript
// Prueba solo las primeras 5 propiedades
const { data } = await supabase
  .from("property_metadata")
  .select("cod_ofer, descriptions")
  .limit(5);  // ← Cambiar a limit(5) en el script

npm run translate:metadata
```

### 📊 Explicación del Script

```typescript
// ESTRUCTURA DEL SCRIPT:

1. CONFIG
   - Conecta con Supabase
   - Configura Hugging Face
   - Define pares de idiomas

2. HF API
   - Helsinki-NLP/opus-mt-es-fr (Spanish → French)
   - Helsinki-NLP/opus-mt-es-de (Spanish → German)
   - Helsinki-NLP/opus-mt-es-pl (Spanish → Polish)
   - Helsinki-NLP/opus-mt-en-fr (English → French)
   - Etc.

3. TRADUCCIÓN
   - Lee property_metadata
   - Para cada propiedad:
     * Busca texto en ES o EN
     * Limpia HTML y espacios
     * Traduce a FR, DE, PL
     * Actualiza descriptions JSON

4. LOTES
   - Procesa 5 propiedades por lote
   - Evita sobrecargar Supabase
   - Delay de 500ms entre llamadas API
```

### 🔍 Monitoreo & Logs

El script muestra:

```
[5.2%] (1/20) Processing cod_ofer 12345
   → Translating es → fr
     ✓ Translated successfully
   → Translating es → de
     ✓ Translated successfully
   → Translating es → pl
     ✓ Translated successfully

💾 Updating 5 properties in Supabase...
   ✓ Updated cod_ofer 12345
   ✓ Updated cod_ofer 12346
   ...

📊 Translation Summary:
   • Total properties: 200
   • Successfully translated: 195
   • Errors: 5
   • Success rate: 97.5%

✅ Translation complete!
⏱️  Total time: 45.3s
```

### 🛡️ Manejo de Errores

El script captura automáticamente:

- ❌ Conexión a Supabase fallida
- ❌ Token de Hugging Face inválido
- ❌ Rate limiting de API
- ❌ Textos vacíos o nulos
- ❌ Errores de traducción

**Para cada error muestra:**
```
⚠️  No source text found (cod_ofer 999)
✗ Translation failed: Model not found
```

### ✅ Verificación Posterior

Después de ejecutar, verifica en Supabase:

```sql
-- Verificar estructura del JSON
SELECT 
  cod_ofer,
  descriptions,
  jsonb_object_keys(descriptions) as languages
FROM property_metadata
LIMIT 10;

-- Verificar que todos los idiomas están presentes
SELECT 
  cod_ofer,
  (descriptions->>'es') as es,
  (descriptions->>'en') as en,
  (descriptions->>'fr') as fr,
  (descriptions->>'de') as de,
  (descriptions->>'pl') as pl
FROM property_metadata
WHERE descriptions IS NOT NULL
LIMIT 5;
```

### 🔧 Personalización

**Cambiar idiomas:**
```typescript
// En script: modificar TARGET_LANGUAGES
const TARGET_LANGUAGES = ["fr", "de", "pl"];
```

**Cambiar tamaño de lote:**
```typescript
// En script: modificar BATCH_SIZE
const BATCH_SIZE = 5; // Cambiar a 10, 20, etc.
```

**Aumentar tiempo entre APIs:**
```typescript
// En script: modificar API_DELAY
const API_DELAY = 500; // Cambiar a 1000 para más lento
```

### 🚨 Troubleshooting

#### Error: "HUGGINGFACE_TOKEN is undefined"
```bash
# Solución: Verificar .env.local
cat .env.local | grep HUGGINGFACE_TOKEN

# Debe mostrar:
# HUGGINGFACE_TOKEN=hf_your_token_here
```

#### Error: "Token is invalid or expired"
```bash
# Solución: Regenerar token en Hugging Face
# https://huggingface.co/settings/tokens
```

#### Error: "Rate limit exceeded"
```typescript
// Solución: Aumentar API_DELAY
const API_DELAY = 1000; // 1 segundo en lugar de 500ms
```

#### Error: "No model available for xx-yy"
```typescript
// Solución: Verificar pares disponibles
// Helsinki-NLP models: https://huggingface.co/Helsinki-NLP
```

### 📈 Rendimiento Esperado

- **Velocidad:** ~1-2 segundos por propiedad (con delays de API)
- **Precisión:** 95-98% (modelos OPUS-MT son muy buenos)
- **Coste:** Gratis con tier free de Hugging Face
- **Tiempo total:** ~5-10 minutos para 200 propiedades

### 🔐 Seguridad

**El script:**
- ✅ No almacena tokens en Git
- ✅ Lee variables de `.env.local` (en .gitignore)
- ✅ Solo traduce, no elimina datos
- ✅ Hace backup del JSON original

**Antes de ejecutar:**
```bash
# Backup de la tabla (ejecutar en Supabase SQL Editor)
CREATE TABLE property_metadata_backup AS
SELECT * FROM property_metadata;
```

### 📝 Próximos Pasos

Después de la traducción:

1. ✅ Verificar resultados en Supabase
2. ✅ Testear en el sitio: /es/, /en/, /fr/, /de/, /pl/
3. ✅ Revisar calidad de traducciones (puede haber algunas imprecisiones)
4. ✅ Hacer commit a GitHub

```bash
git add scripts/translate-property-metadata.ts
git add package.json
git commit -m "feat: Add property metadata translation script using Hugging Face API"
git push origin main
```

### 📚 Recursos

- Hugging Face API Docs: https://huggingface.co/docs/api-inference
- Helsinki-NLP Models: https://huggingface.co/Helsinki-NLP
- Supabase JS: https://supabase.com/docs/reference/javascript

---

**¿Preguntas o problemas?** Revisa los logs del script para más detalles.

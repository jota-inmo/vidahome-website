# Property Metadata Translation with Google Gemini API
## High-Quality Automated Translation

### 📋 Overview

Este script traduce automáticamente la tabla `property_metadata` de tu base de datos Supabase usando **Google Generative AI (Gemini)**.

**¿Por qué Gemini?**
- ✅ **Alta calidad**: Entiende contexto de inmuebles
- ✅ **Rápido**: ~300ms por traducción
- ✅ **Económico**: Tier free incluye 60 requests/min
- ✅ **Confiable**: API estable de Google
- ✅ **Mejor que APIs libres**: Supera a Hugging Face y LibreTranslate

**Características:**
- Traduce ES → FR, DE, PL
- Traduce EN → FR, DE, PL
- Limpia automáticamente textos (HTML, espacios)
- Procesa por lotes para evitar errores
- Logs detallados del progreso
- Verificación automática post-traducción

### 🔑 Requisito: Google Generative AI API Key

#### Paso 1: Obtener API Key (2 minutos)

1. **Ve a**: https://makersuite.google.com/app/apikey
2. **Click**: "Create API Key" → "Create API key in new Google Cloud project"
3. **Copiar**: El API key generado
4. **Guardar** en `.env.local`:

```env
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSyDx...your_key_here...
```

#### Paso 2: Verificar que funciona

```bash
# Listar variables de entorno cargadas
cat .env.local | grep GOOGLE
```

Debe mostrar:
```
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSyDx...
```

**⚠️ IMPORTANTE**: 
- No compartir el API key en GitHub
- Está en `.gitignore` automáticamente
- Si lo compartes, regenerar en https://makersuite.google.com/app/apikey

### 🚀 Usar el Script

#### Opción 1: Traducir todas las propiedades

```bash
npm run translate:gemini
```

**Qué hace:**
1. ✅ Lee todas las propiedades de `property_metadata`
2. ✅ Identifica idiomas faltantes (FR, DE, PL)
3. ✅ Traduce con Gemini usando contexto de inmuebles
4. ✅ Limpia textos automáticamente
5. ✅ Actualiza Supabase por lotes
6. ✅ Muestra resumen de éxito

#### Opción 2: Test primero (5 propiedades)

Edita `scripts/translate-with-gemini.ts` línea ~165:

```typescript
const { data: allProperties, error: fetchError } = await supabase
  .from("property_metadata")
  .select("cod_ofer, descriptions")
  .limit(5)  // ← Cambiar a 5 para test
  .not("descriptions", "is", null);
```

Luego ejecuta:
```bash
npm run translate:gemini
```

### 📊 Ejemplo de Ejecución

```
🚀 Starting Property Metadata Translation with Google Gemini
📋 Configuration:
   - Supabase: https://yheqvroinbcrrpppzdzx.supabase.co
   - Gemini API: generativelanguage.googleapis.com
   - Target Languages: fr, de, pl
   - Source Languages: es, en
   - Batch Size: 5
   - API Delay: 300ms
---
📥 Fetching property metadata from Supabase...
✅ Fetched 50 properties
---
[2.0%] (1/50) Processing cod_ofer 27270311
   → Translating es→fr (French)
     ✓ Success (245 chars → 268 chars)
   → Translating es→de (German)
     ✓ Success (245 chars → 278 chars)
   → Translating es→pl (Polish)
     ✓ Success (245 chars → 285 chars)
[4.0%] (2/50) Processing cod_ofer 27269353
   → Translating es→fr (French)
     ✓ Success (312 chars → 334 chars)
   ...

💾 Updating 5 properties in Supabase...
   ✓ cod_ofer 27270311
   ✓ cod_ofer 27269353
   ...

---
📊 Translation Summary:
   • Total properties: 50
   • Successfully translated: 48
   • Errors: 2
   • Success rate: 96.0%
---
✅ Translation complete!

🔍 Verifying translations...

Sample translations:

📍 Cod Ofer: 27270311
  [DE]: Entdecken Sie dieses charmante Apartment im lebendigen...
  [EN]: Discover this charming apartment located in the vibrant...
  [ES]: Descubre este encantador apartamento ubicado en la vi...
  [FR]: Découvrez cet appartement charmant situé dans la vib...
  [PL]: Odkryj ten urocze mieszkanie położone w tętniącym ży...

⏱️  Total time: 125.4s
```

### 🎯 Gemini Prompt Engineering

El script usa este prompt para asegurar calidad:

```
Translate this real estate property description from Spanish to French. 
Keep the same tone, format and structure. 
Only provide the translated text, no explanations.

Text to translate:
"[Original description]"

Translated text:
```

**Parámetros de Generación:**
- `temperature: 0.3` - Baja variabilidad, traducciones consistentes
- `topK: 40` - Diversidad controlada
- `topP: 0.95` - Nucleus sampling para mejor calidad
- `maxOutputTokens: 2048` - Descripción completa permitida

### ✅ Verificación Posterior

Después de ejecutar, verifica en Supabase:

```sql
-- Ver estructura actualizada
SELECT 
  cod_ofer,
  (descriptions->>'es')::text as es,
  (descriptions->>'en')::text as en,
  (descriptions->>'fr')::text as fr,
  (descriptions->>'de')::text as de,
  (descriptions->>'pl')::text as pl
FROM property_metadata
LIMIT 5;

-- Contar propiedades con todos los idiomas
SELECT COUNT(*) as complete_translations
FROM property_metadata
WHERE 
  descriptions->>'es' IS NOT NULL
  AND descriptions->>'en' IS NOT NULL
  AND descriptions->>'fr' IS NOT NULL
  AND descriptions->>'de' IS NOT NULL
  AND descriptions->>'pl' IS NOT NULL;
```

### 🔧 Personalización

**Cambiar idiomas objetivo:**
```typescript
// En script: modificar TARGET_LANGUAGES
const TARGET_LANGUAGES: Record<string, string> = {
  fr: "French",
  de: "German",
  pl: "Polish",
  it: "Italian",  // Agregar italiano
};
```

**Cambiar tamaño de lote:**
```typescript
const BATCH_SIZE = 10; // Cambiar a 10 para más rápido
```

**Cambiar temperatura (calidad vs variedad):**
```typescript
generationConfig: {
  temperature: 0.5,  // Más alto = más creativo/variable
  // ...
}
```

### 🚨 Troubleshooting

#### Error: "GOOGLE_GENERATIVE_AI_API_KEY not found"

```bash
# Verificar que está en .env.local
cat .env.local | grep GOOGLE

# Debe mostrar:
# GOOGLE_GENERATIVE_AI_API_KEY=AIzaSyDx...
```

**Solución:**
1. Ve a https://makersuite.google.com/app/apikey
2. Copia el API key
3. Agrega a `.env.local`:
   ```env
   GOOGLE_GENERATIVE_AI_API_KEY=tu_key_aqui
   ```

#### Error: "API key invalid or expired"

```bash
# Regenerar key en:
# https://makersuite.google.com/app/apikey

# Actualizar .env.local con el nuevo key
```

#### Error: "Quota exceeded"

Estás usando demasiadas requests. Opciones:

1. **Esperar**: Quota reseteea cada hora
2. **Reducir batch size**:
   ```typescript
   const BATCH_SIZE = 1; // Más lento pero menos requests
   ```
3. **Aumentar delay entre requests**:
   ```typescript
   const API_DELAY = 1000; // 1 segundo
   ```

#### Error: "Conexión a Supabase fallida"

```bash
# Verificar credenciales de Supabase
cat .env.local | grep SUPABASE

# Debe mostrar:
# NEXT_PUBLIC_SUPABASE_URL=https://...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### 📈 Rendimiento Esperado

| Métrica | Valor |
|---------|-------|
| **Velocidad** | ~2 sec/propiedad (con delays) |
| **Precisión** | 95-98% |
| **Tiempo total** | ~50 min para 1,000 propiedades |
| **Coste** | Gratis (tier free) o ~$0.01/1000 requests |

### 🔐 Seguridad

**El script:**
- ✅ No almacena tokens en Git
- ✅ Lee de `.env.local` (en .gitignore)
- ✅ Solo traduce, no modifica otros campos
- ✅ Mantiene estructura JSON original

**Backup recomendado:**

```sql
-- Ejecutar en Supabase ANTES de traducir
CREATE TABLE property_metadata_backup_pre_translation AS
SELECT * FROM property_metadata;

-- Después, si algo sale mal:
-- RESTORE FROM BACKUP IF NEEDED
```

### 📝 Próximos Pasos

1. ✅ Obtener API Key de Gemini
2. ✅ Agregar a `.env.local`
3. ✅ Test con 5 propiedades
4. ✅ Ejecutar en todas las propiedades
5. ✅ Verificar calidad en Supabase
6. ✅ Commit a GitHub

```bash
# Test
npm run translate:gemini

# Si sale bien, commit:
git add scripts/ .env.translation.example docs/
git commit -m "feat: Add property metadata translation script using Google Gemini API"
git push origin main
```

### 🎓 Documentación Oficial

- **Google Generative AI**: https://ai.google.dev
- **Gemini API Docs**: https://ai.google.dev/docs
- **API Pricing**: https://ai.google.dev/pricing
- **Model Card**: https://ai.google.dev/models/gemini-pro

---

**¿Preguntas o problemas?** Revisa los logs del script para más detalles.

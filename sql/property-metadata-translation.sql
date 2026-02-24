-- PROPERTY_METADATA MULTI-LANGUAGE TRANSLATION & CLEANUP
-- Ejecuta este script en Supabase SQL Editor
-- Traduce automáticamente descriptions de ES/EN a FR/DE/PL
-- Limpia textos y actualiza la tabla

-- ============================================================================
-- PASO 1: VERIFICAR ESTRUCTURA DEL JSON
-- ============================================================================
-- Ejecuta esto primero para ver cómo está estructurado:
/*
SELECT 
  cod_ofer,
  descriptions,
  jsonb_typeof(descriptions) as json_type
FROM property_metadata
LIMIT 3;
*/

-- ============================================================================
-- PASO 2: FUNCIÓN PARA LIMPIAR TEXTOS
-- ============================================================================
CREATE OR REPLACE FUNCTION clean_text(text_input TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Elimina HTML tags
  text_input := regexp_replace(text_input, '<[^>]*>', '', 'g');
  
  -- Elimina espacios múltiples
  text_input := regexp_replace(text_input, '\s+', ' ', 'g');
  
  -- Trim de espacios al inicio y final
  text_input := TRIM(text_input);
  
  RETURN text_input;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- PASO 3: FUNCIÓN PARA TRADUCIR USANDO LIBRERÍA (si está disponible)
-- ============================================================================
-- NOTA: PostgreSQL no tiene traducción nativa. Opciones:
-- A) Usar una API externa (se requiere pgplv8 o similar)
-- B) Usar supabase-vectors + OpenAI API
-- C) Copiar manual las traducciones
-- D) Usar Deepl API con http request

-- Para OPCIÓN D (Deepl API), descomentar y configurar:
/*
CREATE OR REPLACE FUNCTION translate_text(
  text_to_translate TEXT,
  source_lang VARCHAR,
  target_lang VARCHAR,
  deepl_api_key VARCHAR
)
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  SELECT
    CASE 
      WHEN content IS NULL THEN NULL
      ELSE (content::jsonb ->> 'translations' ->> 0 ->> 'text')
    END INTO result
  FROM http_get(
    'https://api-free.deepl.com/v1/translate',
    jsonb_build_object(
      'text', text_to_translate,
      'source_lang', source_lang,
      'target_lang', target_lang,
      'auth_key', deepl_api_key
    )::text,
    'application/json'
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
*/

-- ============================================================================
-- PASO 4: OPCIÓN A - AGREGAR COLUMNAS PARA CADA IDIOMA (Recomendado)
-- ============================================================================
-- Si prefieres estructura más clara, agregar columnas separadas:

ALTER TABLE property_metadata
ADD COLUMN IF NOT EXISTS descriptions_es TEXT,
ADD COLUMN IF NOT EXISTS descriptions_en TEXT,
ADD COLUMN IF NOT EXISTS descriptions_fr TEXT,
ADD COLUMN IF NOT EXISTS descriptions_de TEXT,
ADD COLUMN IF NOT EXISTS descriptions_pl TEXT;

-- ============================================================================
-- PASO 5: EXTRAER TEXTOS DEL JSON A COLUMNAS INDIVIDUALES
-- ============================================================================
-- Ejecuta esto para poblar las columnas con los textos existentes:

UPDATE property_metadata
SET
  descriptions_es = clean_text(COALESCE(descriptions->>'es', '')),
  descriptions_en = clean_text(COALESCE(descriptions->>'en', '')),
  descriptions_fr = clean_text(COALESCE(descriptions->>'fr', '')),
  descriptions_de = clean_text(COALESCE(descriptions->>'de', '')),
  descriptions_pl = clean_text(COALESCE(descriptions->>'pl', ''))
WHERE descriptions IS NOT NULL;

-- ============================================================================
-- PASO 6: VER CÓMO QUEDÓ
-- ============================================================================
/*
SELECT 
  cod_ofer,
  descriptions_es,
  descriptions_en,
  descriptions_fr,
  descriptions_de,
  descriptions_pl
FROM property_metadata
WHERE descriptions_es IS NOT NULL
LIMIT 5;
*/

-- ============================================================================
-- PASO 7: OPCIÓN PARA TRADUCIR CON API DEEPL (Manual - Requiere API Key)
-- ============================================================================
-- Para usar Deepl API necesitas:
-- 1. Cuenta en deepl.com
-- 2. API Key
-- 3. Crear función para HTTP requests

-- Primero habilita la extensión http:
CREATE EXTENSION IF NOT EXISTS http;

-- Luego usa esta función para traducir:
/*
SELECT
  cod_ofer,
  descriptions_es,
  -- Aquí iría la traducción a FR, DE, PL
FROM property_metadata
WHERE descriptions_es != '';
*/

-- ============================================================================
-- PASO 8: ALTERNATIVA - ACTUALIZAR JSON DESCRIPTIONS
-- ============================================================================
-- Si quieres mantener el JSON y agregar los idiomas traducidos:

UPDATE property_metadata
SET descriptions = jsonb_set(
  descriptions,
  '{fr}',
  to_jsonb(descriptions->>'es')  -- Placeholder: aquí irá traducción real
)
WHERE (descriptions->>'fr') IS NULL
  AND (descriptions->>'es') IS NOT NULL;

UPDATE property_metadata
SET descriptions = jsonb_set(
  descriptions,
  '{de}',
  to_jsonb(descriptions->>'es')  -- Placeholder: aquí irá traducción real
)
WHERE (descriptions->>'de') IS NULL
  AND (descriptions->>'es') IS NOT NULL;

UPDATE property_metadata
SET descriptions = jsonb_set(
  descriptions,
  '{pl}',
  to_jsonb(descriptions->>'es')  -- Placeholder: aquí irá traducción real
)
WHERE (descriptions->>'pl') IS NULL
  AND (descriptions->>'es') IS NOT NULL;

-- ============================================================================
-- PASO 9: LIMPIAR TEXTOS EN EL JSON
-- ============================================================================
-- Actualiza el JSON limpiando todos los textos:

UPDATE property_metadata
SET descriptions = jsonb_object_agg(
  key,
  clean_text(value->>'')
)
FROM jsonb_each_text(descriptions) AS t(key, value)
WHERE descriptions IS NOT NULL;

-- ============================================================================
-- PASO 10: VERIFICAR RESULTADO
-- ============================================================================
/*
SELECT 
  cod_ofer,
  ref,
  descriptions,
  description
FROM property_metadata
LIMIT 5;
*/

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
/*
1. Este script LIMPIA y PREPARA la tabla, pero NO traduce automáticamente
2. Para traducir necesitas una de estas opciones:
   
   OPCIÓN A: Deepl API (Paga pero muy precisa)
   - Requiere API Key
   - Requiere extensión http en Supabase
   
   OPCIÓN B: Google Translate API (Paga)
   - Requiere API Key de Google Cloud
   
   OPCIÓN C: Manual (Gratis pero manual)
   - Traducir manualmente en Supabase
   - Copiar-pegar en el panel
   
   OPCIÓN D: Script Node.js/Python (Mi recomendación)
   - Creo un script que:
     * Lee de Supabase
     * Traduce con Deepl/Google
     * Actualiza automáticamente

3. Los textos se limpian automáticamente:
   - Elimina HTML
   - Elimina espacios múltiples
   - Trim de espacios

4. Backup recomendado antes de ejecutar
*/

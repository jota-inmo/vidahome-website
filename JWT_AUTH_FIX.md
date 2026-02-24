# 🔐 JWT Authentication Fix - Edge Function

## 🔴 Problema

Cuando intentabas traducir, obtenías error:
```
Invalid JWT
```

---

## 🔍 Causa

La Edge Function requiere autenticación Supabase, pero el cliente **no estaba enviando el token de autenticación**.

### ¿Por qué?

La Edge Function valida las solicitudes mediante JWT (JSON Web Token):

```typescript
// En la Edge Function (Supabase)
const token = req.headers.get('authorization')?.split(' ')[1];
if (!token) {
  return new Response('Unauthorized', { status: 401 });
}
// Valida el token... si es inválido → "Invalid JWT"
```

### ¿Qué faltaba?

El cliente no incluía el header `Authorization` con el token:

```typescript
// ANTES (sin token)
fetch(edgeFunctionUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    // ❌ Falta: "Authorization": "Bearer TOKEN"
  },
  body: JSON.stringify(payload),
})
```

---

## ✅ Solución

Ahora el cliente envía el token de Supabase:

```typescript
// DESPUÉS (con token)
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

fetch(edgeFunctionUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${supabaseAnonKey}`, // ✅ Agregado
  },
  body: JSON.stringify(payload),
})
```

### ¿Qué es `NEXT_PUBLIC_SUPABASE_ANON_KEY`?

Es una **clave pública** de Supabase que:
- ✅ Es segura compartir (es pública)
- ✅ Identifica tu proyecto Supabase
- ✅ Actúa como "token anónimo" para la Edge Function
- ✅ Ya está en tu `.env.local`

---

## 📝 Commit

```
739448a - fix: add authorization header to edge function calls (bearer token)
```

**Cambio**:
- Archivo: `src/lib/supabase/translate-client.ts`
- Agregado: Header `Authorization` con token Supabase

---

## 🚀 Ahora Funciona

Cuando llamas a traducir, se envía:

```
POST https://yheqvroinbcrrpppzdzx.supabase.co/functions/v1/translate-properties
Headers:
  Content-Type: application/json
  Authorization: Bearer eyJh... (tu SUPABASE_ANON_KEY)
Body:
  { "property_ids": [...] }
```

La Edge Function valida el token y **acepta la solicitud** ✅

---

## 🔒 ¿Es seguro?

**Sí**, porque:

1. **SUPABASE_ANON_KEY es pública** (la necesita el cliente para funcionar)
2. **Edge Function valida el token** (rechaza tokens inválidos)
3. **Supabase RLS protege los datos** (row-level security en tablas)
4. **No expone API keys sensibles** (Perplexity key está en Supabase Secrets)

---

## ✅ Próximo Paso

Ahora intenta traducir de nuevo. Debería funcionar sin error de JWT.

Si aún hay error, podría ser:
- PERPLEXITY_API_KEY no está configurada en Supabase Secrets
- SUPABASE_ANON_KEY no está en `.env.local`
- Datos de propiedades incompletos en BD

---

## 📋 Verificación

Para confirmar que el token se envía correctamente:

1. Abre DevTools (F12) → Network tab
2. Click en traducir
3. Busca la solicitud a `/functions/v1/translate-properties`
4. Verifica que en Headers aparezca:
   ```
   Authorization: Bearer eyJh...
   ```

Si ves el header, la autenticación está funcionando ✅

# 📋 INSTRUCCIONES EXACTAS - Edge Function Deploy

## ⚠️ **IMPORTANTE**

**NO copies el archivo `EDGE_FUNCTION_CORRECTED_CODE.md`** (ese tiene Markdown)

**COPIA el contenido de `EDGE_FUNCTION_PURE_CODE.ts`** (ese es solo código TypeScript)

---

## 📝 Pasos Exactos

### 1️⃣ Abre el Archivo Correcto

En tu editor, abre:
```
EDGE_FUNCTION_PURE_CODE.ts
```

### 2️⃣ Selecciona TODO el Código

```
Ctrl+A
```

### 3️⃣ Copia

```
Ctrl+C
```

### 4️⃣ Abre Supabase Console

https://supabase.com/dashboard

### 5️⃣ Navega a la Edge Function

1. Click en tu proyecto
2. Izquierda → **Functions**
3. Click en **translate-properties**
4. Click en **index.ts**

### 6️⃣ Selecciona TODO el Código Actual

Supabase editor:
```
Ctrl+A
```

### 7️⃣ BORRA TODO

```
Delete o Backspace
```

### 8️⃣ PEGA el Código Nuevo

```
Ctrl+V
```

Debería verse así (sin emojis al inicio):

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";
...
```

### 9️⃣ GUARDA/DESPLIEGA

Click en botón **"Deploy"** (o similar, depende de la versión de Supabase)

### 🔟 Espera Confirmación

Supabase debería mostrar: ✅ **"Function deployed successfully"**

---

## ✅ Resultado Esperado

Si todo va bien:
- ✅ Sin errores de "Unexpected character"
- ✅ Dice "Function deployed successfully"
- ✅ Puedes cerrar y volver a intentar traducir

---

## 🆘 Si Falla Otra Vez

Copia EXACTAMENTE lo que ves:

```
EDGE_FUNCTION_PURE_CODE.ts
↓
Ctrl+A (selecciona todo)
↓
Ctrl+C (copia)
↓
Supabase → Functions → translate-properties → index.ts
↓
Ctrl+A (borra todo lo actual)
↓
Ctrl+V (pega código nuevo)
↓
Deploy
```

---

## 🎯 Resumen

| Paso | Acción |
|------|--------|
| **Archivo a copiar** | `EDGE_FUNCTION_PURE_CODE.ts` |
| **Donde pegar** | Supabase Console → translate-properties → index.ts |
| **Qué hacer después** | Click "Deploy" |
| **Señal de éxito** | "Function deployed successfully" ✅ |

---

**¡Intenta de nuevo! Avísame cuando hagas deploy.** 🚀

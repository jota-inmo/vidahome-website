# 📌 Solución Implementada: Problema de IP con Inmovilla API

## 🎯 Problema Original

Al intentar conectar con la API de Inmovilla desde Vercel, obtenías:
```
IP NO VALIDADA - IP_RECIVED: 3.208.86.127
```

**Causa**: Vercel usa IPs dinámicas que cambian frecuentemente. Inmovilla requiere autorizar IPs específicas.

---

## ✅ Solución Implementada

### Opción 1: Proxy con Arsys (Recomendada) ⭐

Usar tu servidor Arsys (que tiene IP estática) como intermediario:

```
Usuario → Vercel → Arsys (IP fija) → Inmovilla
```

**Ventajas:**
- ✅ IP estática garantizada
- ✅ Sin costes adicionales (ya tienes Arsys)
- ✅ Fácil de configurar
- ✅ Mantienes Vercel para el frontend

**Archivos creados:**
- `arsys-proxy/inmovilla-proxy.php` - Script PHP para subir a Arsys
- `SOLUCION_IP_ARSYS.md` - Guía rápida con checklist
- `docs/ARSYS_PROXY_SETUP.md` - Documentación completa

**Pasos siguientes:**
1. Sube el archivo PHP a Arsys
2. Obtén la IP de tu servidor Arsys
3. Pide a Inmovilla que autorice esa IP
4. Configura las variables en Vercel:
   - `ARSYS_PROXY_URL`
   - `ARSYS_PROXY_SECRET`

---

### Opción 2: Desplegar Todo en Arsys

Si prefieres simplicidad, despliega toda la app Next.js en Arsys:

**Ventajas:**
- ✅ Todo en un solo sitio
- ✅ No necesitas proxy
- ✅ IP estática directa

**Desventajas:**
- ⚠️ Arsys no está optimizado para Next.js como Vercel
- ⚠️ Menos rendimiento global

---

## 📁 Archivos Creados/Modificados

### Nuevos Archivos

| Archivo | Propósito |
|---------|-----------|
| `arsys-proxy/inmovilla-proxy.php` | Proxy PHP para Arsys |
| `SOLUCION_IP_ARSYS.md` | Guía rápida de implementación |
| `docs/ARSYS_PROXY_SETUP.md` | Documentación completa del setup |
| `docs/INMOVILLA_IP_ISSUE.md` | Explicación del problema |
| `src/app/api/debug/ip/route.ts` | Endpoint para ver tu IP actual |

### Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `src/lib/api/web-client.ts` | Añadido soporte para proxy de Arsys |
| `.env.example` | Documentadas nuevas variables de entorno |

---

## 🔧 Configuración Necesaria

### Variables de Entorno en Vercel

```env
# Credenciales de Inmovilla
INMOVILLA_AGENCIA=tu_numero_agencia
INMOVILLA_PASSWORD=tu_password_api
INMOVILLA_DOMAIN=vidahome.es

# Proxy de Arsys (para IP estática)
ARSYS_PROXY_URL=https://tu-dominio.es/api/inmovilla-proxy.php
ARSYS_PROXY_SECRET=tu_secreto_aleatorio
```

---

## 🚀 Cómo Funciona

### Sin Proxy (Actual - No funciona)
```
Vercel (IP dinámica: 3.208.86.127) → ❌ Inmovilla (rechaza)
```

### Con Proxy de Arsys (Solución)
```
Vercel → Arsys (IP fija: X.X.X.X) → ✅ Inmovilla (acepta)
```

El código detecta automáticamente si las variables `ARSYS_PROXY_URL` y `ARSYS_PROXY_SECRET` están configuradas y enruta las peticiones a través del proxy.

---

## 📊 Estado de Implementación

- ✅ Código del proxy PHP creado
- ✅ Cliente de Inmovilla actualizado con soporte de proxy
- ✅ Documentación completa creada
- ✅ Variables de entorno documentadas
- ✅ Endpoint de debug para ver IP actual
- ⏳ **Pendiente**: Subir proxy a Arsys
- ⏳ **Pendiente**: Obtener IP de Arsys
- ⏳ **Pendiente**: Autorización de Inmovilla
- ⏳ **Pendiente**: Configurar variables en Vercel

---

## 📖 Documentación

### Para Implementar la Solución
1. **Inicio rápido**: Lee `SOLUCION_IP_ARSYS.md`
2. **Guía completa**: Lee `docs/ARSYS_PROXY_SETUP.md`

### Para Entender el Problema
- Lee `docs/INMOVILLA_IP_ISSUE.md`

### Para Debugging
- Visita `/api/debug/ip` en tu app para ver qué IP está usando

---

## 🔒 Seguridad Implementada

El código ya incluye todas las validaciones de seguridad requeridas por Inmovilla:

✅ **Validación numérica** - Campos como zona, ciudad, tipo
✅ **Prevención de SQL injection** - Sanitización de texto
✅ **Detección de patrones maliciosos** - Comandos SQL, caracteres peligrosos
✅ **Autenticación del proxy** - Secreto compartido
✅ **CORS restrictivo** - Solo tu dominio de Vercel

---

## ⏱️ Tiempo de Implementación

- **Configuración técnica**: 10-15 minutos
- **Espera de Inmovilla**: 1-2 días laborables
- **Total**: Funcionando en 2-3 días

---

## 💰 Costes

- Arsys: Ya lo tienes ✅
- Vercel: Plan gratuito ✅
- **Total: 0€ adicionales** 🎉

---

## 📞 Soporte

- **Inmovilla**: soporte@inmovilla.com
- **Arsys**: Panel de control → Tickets

---

## ✨ Próximos Pasos

1. Lee `SOLUCION_IP_ARSYS.md` para el checklist completo
2. Sube el proxy a Arsys
3. Obtén la IP de Arsys
4. Contacta con Inmovilla
5. Configura Vercel
6. ¡Disfruta de la integración funcionando! 🚀

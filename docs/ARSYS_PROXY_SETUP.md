# Configuración del Proxy de Arsys para Inmovilla API

## Problema Resuelto

Vercel usa IPs dinámicas que cambian frecuentemente. Inmovilla requiere autorizar IPs específicas, lo que hace imposible usar Vercel directamente.

**Solución**: Usar tu servidor Arsys (que tiene IP estática) como proxy para las llamadas a Inmovilla.

---

## Arquitectura

```
Usuario → Vercel (Next.js) → Arsys (Proxy PHP) → Inmovilla API
                                  ↑
                            IP Estática Autorizada
```

---

## Paso 1: Subir el Proxy a Arsys

1. Accede a tu hosting de Arsys vía FTP o cPanel
2. Crea una carpeta `api` en la raíz de tu dominio
3. Sube el archivo `arsys-proxy/inmovilla-proxy.php` a esa carpeta
4. La URL final será: `https://tu-dominio.es/api/inmovilla-proxy.php`

---

## Paso 2: Configurar el Proxy

Edita el archivo `inmovilla-proxy.php` en Arsys:

```php
// Cambia este secreto por uno aleatorio y seguro
define('PROXY_SECRET', 'TU_SECRETO_ALEATORIO_AQUI');

// Cambia el dominio de Vercel por el tuyo
header('Access-Control-Allow-Origin: https://tu-app.vercel.app');
```

**Generar un secreto seguro:**
```bash
# En tu terminal local:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Paso 3: Obtener la IP de Arsys

### Opción A: Desde el Panel de Arsys
1. Accede al panel de control de Arsys
2. Ve a "Información del servidor" o "Detalles del hosting"
3. Copia la IP del servidor

### Opción B: Crear un archivo PHP temporal
Sube este archivo a Arsys como `get-ip.php`:

```php
<?php
echo "IP del servidor: " . file_get_contents('https://api.ipify.org');
?>
```

Visita `https://tu-dominio.es/get-ip.php` y copia la IP.

---

## Paso 4: Autorizar la IP en Inmovilla

1. Contacta con soporte de Inmovilla: **soporte@inmovilla.com**
2. Proporciona:
   - Tu número de agencia
   - La IP de tu servidor Arsys
   - El dominio: `vidahome.es`

**Email sugerido:**
```
Asunto: Autorización de IP para API Web

Hola,

Necesito autorizar la siguiente IP para acceder a la API Web de Inmovilla:

IP del servidor: [TU_IP_DE_ARSYS]
Número de agencia: [TU_NUMERO_AGENCIA]
Dominio: vidahome.es

Esta IP es estática y pertenece a mi servidor de hosting en Arsys.

Gracias,
[Tu nombre]
```

---

## Paso 5: Configurar Variables de Entorno en Vercel

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Añade estas variables:

```env
ARSYS_PROXY_URL=https://tu-dominio.es/api/inmovilla-proxy.php
ARSYS_PROXY_SECRET=TU_SECRETO_ALEATORIO_AQUI
```

4. Redeploy tu aplicación

---

## Verificación

Una vez configurado todo:

1. Visita tu aplicación en Vercel
2. Las llamadas a Inmovilla deberían funcionar automáticamente
3. Revisa los logs de Vercel, deberías ver:
   ```
   [InmovillaWebClient] Using Arsys proxy with static IP
   ```

---

## Seguridad

✅ **Implementado:**
- Autenticación mediante secreto compartido
- CORS restringido a tu dominio de Vercel
- Solo acepta peticiones POST
- Validación de entrada

⚠️ **Recomendaciones adicionales:**
- Cambia `PROXY_SECRET` regularmente
- Monitorea los logs de Arsys para detectar usos anómalos
- Considera añadir rate limiting si es necesario

---

## Troubleshooting

### Error: "Unauthorized"
- Verifica que `ARSYS_PROXY_SECRET` en Vercel coincida con el del archivo PHP

### Error: "CORS"
- Actualiza el `Access-Control-Allow-Origin` en el PHP con tu dominio de Vercel

### Error: "IP NO VALIDADA" (sigue apareciendo)
- Verifica que Inmovilla haya autorizado la IP correcta
- Confirma que el archivo PHP esté en Arsys (no en Vercel)
- Comprueba que la IP no haya cambiado (poco probable en Arsys)

### No se usa el proxy
- Verifica que las variables de entorno estén configuradas en Vercel
- Haz un redeploy después de añadir las variables

---

## Costes

- **Arsys**: Ya lo tienes, sin coste adicional ✅
- **Vercel**: Plan gratuito funciona perfectamente ✅
- **Total**: 0€/mes adicionales 🎉

---

## Alternativa: Desplegar Todo en Arsys

Si prefieres no usar Vercel, puedes desplegar toda la aplicación Next.js en Arsys:

1. Build de producción: `npm run build`
2. Subir la carpeta `.next` y `node_modules` a Arsys
3. Configurar Node.js en el panel de Arsys
4. No necesitarías el proxy, llamarías directamente a Inmovilla

**Ventajas**: Más simple, todo en un sitio
**Desventajas**: Arsys no está optimizado para Next.js como Vercel

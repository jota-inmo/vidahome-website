# 🚀 Solución Rápida: IP Estática con Arsys

## ✅ Resumen de la Solución

**Problema**: Vercel tiene IP dinámica → Inmovilla la bloquea
**Solución**: Usar Arsys (que ya tienes) como proxy con IP estática

---

## 📋 Checklist de Implementación

### 1️⃣ Preparar el Proxy en Arsys (5 minutos)

- [ ] Accede a tu hosting de Arsys (FTP o cPanel)
- [ ] Crea la carpeta `/api` en la raíz
- [ ] Sube el archivo `arsys-proxy/inmovilla-proxy.php`
- [ ] Edita el archivo y cambia:
  - `PROXY_SECRET` → Genera uno aleatorio
  - `Access-Control-Allow-Origin` → Tu dominio de Vercel

**Generar secreto:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2️⃣ Obtener la IP de Arsys (2 minutos)

**Opción A - Panel de Arsys:**
- [ ] Panel de control → Información del servidor → Copiar IP

**Opción B - Crear archivo temporal:**
- [ ] Sube este archivo como `get-ip.php`:
```php
<?php echo file_get_contents('https://api.ipify.org'); ?>
```
- [ ] Visita `https://tu-dominio.es/get-ip.php`
- [ ] Copia la IP y borra el archivo

### 3️⃣ Autorizar IP en Inmovilla (1 email)

- [ ] Email a: `soporte@inmovilla.com`
- [ ] Asunto: "Autorización de IP para API Web"
- [ ] Contenido:
```
Hola,

Necesito autorizar esta IP para la API Web:
IP: [LA_IP_DE_ARSYS]
Agencia: [TU_NUMERO]
Dominio: vidahome.es

Esta IP es estática de mi servidor Arsys.

Gracias,
[Tu nombre]
```

### 4️⃣ Configurar Vercel (2 minutos)

- [ ] Ve a tu proyecto en Vercel
- [ ] Settings → Environment Variables
- [ ] Añade:

```
ARSYS_PROXY_URL=https://tu-dominio.es/api/inmovilla-proxy.php
ARSYS_PROXY_SECRET=[EL_SECRETO_QUE_GENERASTE]
```

- [ ] Redeploy la aplicación

### 5️⃣ Verificar que Funciona

- [ ] Visita tu app en Vercel
- [ ] Intenta cargar propiedades de Inmovilla
- [ ] Revisa los logs de Vercel → Deberías ver:
```
[InmovillaWebClient] Using Arsys proxy with static IP
```

---

## 🎯 URLs que Necesitas

| Qué | URL |
|-----|-----|
| Proxy PHP | `https://tu-dominio.es/api/inmovilla-proxy.php` |
| Archivo PHP local | `arsys-proxy/inmovilla-proxy.php` |
| Docs completas | `docs/ARSYS_PROXY_SETUP.md` |

---

## ⚡ Comandos Útiles

**Generar secreto seguro:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Probar el proxy localmente (después de configurar):**
```bash
curl -X POST https://tu-dominio.es/api/inmovilla-proxy.php \
  -H "Content-Type: application/json" \
  -H "X-Proxy-Secret: TU_SECRETO" \
  -d '{"body":"test"}'
```

---

## 🔧 Troubleshooting Rápido

| Error | Solución |
|-------|----------|
| "Unauthorized" | Verifica que el secreto coincida en Vercel y en el PHP |
| "CORS error" | Actualiza el dominio en `Access-Control-Allow-Origin` |
| "IP NO VALIDADA" | Espera respuesta de Inmovilla o verifica la IP |
| No usa el proxy | Redeploy en Vercel después de añadir las variables |

---

## 💰 Costes

- Arsys: Ya lo tienes ✅
- Vercel: Plan gratuito ✅
- **Total: 0€ adicionales** 🎉

---

## 📞 Contactos

- **Soporte Inmovilla**: soporte@inmovilla.com
- **Soporte Arsys**: Panel de control → Tickets

---

## ⏱️ Tiempo Total Estimado

- Configuración: **10-15 minutos**
- Espera de Inmovilla: **1-2 días laborables**
- **Total**: Funcionando en 2-3 días

---

## 🎓 Documentación Adicional

- **Setup completo**: `docs/ARSYS_PROXY_SETUP.md`
- **Problema original**: `docs/INMOVILLA_IP_ISSUE.md`
- **Archivo proxy**: `arsys-proxy/inmovilla-proxy.php`

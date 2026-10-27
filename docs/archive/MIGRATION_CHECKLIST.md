# 🚀 Checklist: Migración de Dominio (vidahome.es Antigua → Vercel)

**Duración Estimada**: 2 semanas  
**Risk Level**: BAJO (con redirecciones 301)  
**Ventana Ideal**: Fin de semana o martes-miércoles

---

## 📋 Pre-Migración (1 semana antes)

### SEO & Análisis
- [ ] **Exportar URLs indexadas** de Google Search Console
  - Ir a: Search Console → Cobertura
  - Descargar lista de URLs válidas
  
- [ ] **Crear mapeo de URLs antiguas → nuevas**
  ```
  /ficha.php?id=123456 → /propiedades/123456
  /propiedades.php → /propiedades
  /contacto.php → /contacto
  /valoracion.php → /vender
  /blog/articulo.html → /blog/articulo
  ```

- [ ] **Verificar backlinks** con Ahrefs/Semrush
  - Documentar URLs externas que apunten a tu web
  
- [ ] **Auditar analytics actual**
  - Anotar traffic actual (sesiones/mes, top pages)
  - Comparar post-migración

### Técnico
- [ ] **Implementar redirecciones 301** en `next.config.ts`
  ```typescript
  async redirects() {
    return [
      { source: '/ficha.php', destination: '/propiedades/:id', permanent: true },
      // ... más
    ];
  }
  ```

- [ ] **Configurar Vercel domain**
  - Vercel dashboard → Settings → Domains
  - Agregar `vidahome.es`
  - Copiar registros DNS

- [ ] **Generar Sitemap multi-idioma**
  - Crear `/sitemap.xml` (índice)
  - `/sitemap-es.xml`, `/sitemap-en.xml`, etc.

- [ ] **Testear en staging**
  ```bash
  # Simular con hosts local
  echo "123.45.67.89 vidahome.es" >> /etc/hosts
  
  # Verificar redirecciones
  curl -I https://vidahome.es/ficha.php?id=123
  # Debe retornar 301 → /propiedades/123
  ```

### Contenido
- [ ] **Revisar todas las fichas de propiedades**
  - Verificar que fotos se cargan correctamente
  - Comprobar meta descriptions en todos los idiomas
  
- [ ] **Validar formularios**
  - Contacto → debe enviar leads a Supabase
  - Tasación → debe funcionar en vidahome.es
  
- [ ] **Revisar página de contacto**
  - Dirección, teléfono, horarios
  - Mapas y enlace a Google Maps

- [ ] **SSL Certificate listo**
  - Vercel proporciona automáticamente (Let's Encrypt)
  - No requiere acción

---

## 🔄 Día de Migración (Timeline)

### T-0: 1 hora antes

**Comunicación**:
- [ ] Notificar a equipo interna (si aplica)
- [ ] Tener teléfono/email a mano por si hay issues

**Checklist técnico final**:
```bash
# En terminal (proyecto local)
git log --oneline -3
# Confirmar que los cambios están en main

npm run build
# Verificar que build completa sin errores

npm run lint
# Verificar no hay errores de tipo
```

- [ ] **Backup de web antigua** (si aún funciona)
  - Descargar via FTP: todo el directorio `/public`
  - Exportar base de datos (si la usa)

### T+0: El Cambio DNS

**En tu DNS provider** (Arsys/Godaddy/DonDominio):

1. **Cambiar TTL a 300 segundos** (5 min)
   - Esto permite rollback rápido si falla

2. **Obtener registros de Vercel**
   - En Vercel dashboard → vidahome.es → "Edit" → copiar registros DNS

3. **Reemplazar registros**:
   - **A Record** (si aplica): `vidahome.es` → Vercel IP
   - **CNAME Record**: `www.vidahome.es` → `cname.vercel-dns.com.`
   - **TXT Record**: (para verificación, si Vercel lo solicita)

4. **Esperar propagación**
   ```bash
   # Verificar status
   nslookup vidahome.es
   # Debe mostrar IPs de Vercel
   
   # O usar:
   dig vidahome.es
   ```
   - Típicamente: 5-30 minutos
   - En algunos ISPs: hasta 2 horas

### T+5 min: Verificaciones Post-DNS

```bash
# Test HTTPS
curl -I https://vidahome.es
# Debe retornar 200 OK

# Test redirección
curl -I https://vidahome.es/ficha.php?id=123
# Debe retornar 301 → /propiedades/123

# Test multi-idioma
curl https://vidahome.es/es/ | grep -i "html"
curl https://vidahome.es/en/ | grep -i "html"
```

- [ ] **Verificar homepage carga**
  - Abrir `https://vidahome.es` en navegador
  - Verificar que CSS/JS cargan (sin errores CORS)
  - Revisar que las 6 propiedades destacadas aparecen

- [ ] **Probar formularios**
  - Contacto → enviar mensaje test
  - Tasación → rellenar y enviar
  - Verificar que datos llegan a Supabase

- [ ] **Monitorear Vercel dashboard**
  - Ir a: Vercel → Project → Deployments
  - Ver que no hay errores de function invocation

### T+30 min: Notificar a Google

- [ ] **Google Search Console**
  - Ir a: Search Console → "Cambio de dominio" (si existe opción)
  - O manualmente: agregar propiedad `vidahome.es` y enviar sitemap
  
- [ ] **Submit sitemap**
  - URL: `https://vidahome.es/sitemap.xml`
  - Search Console → Sitemaps → agregar nuevo
  
- [ ] **Revisar errores de rastreo**
  - Search Console → Cobertura
  - Debe mostrar: "Válidas con advertencias" (normal)
  - No debe haber 404s masivos

### T+2 horas: Validación Completa

- [ ] **Verificar analytics**
  - Google Analytics → Real Time
  - Debe mostrar tráfico entrante
  
- [ ] **Test funcionalidad completa**
  - Navegación en ES/EN/FR
  - Búsqueda de propiedades
  - Ficha individual de propiedad
  - Compartir en redes (verificar OG images)

- [ ] **Performance**
  - Abrir PageSpeed Insights
  - URL: `https://vidahome.es`
  - Score debe ser 80+/100

- [ ] **SSL/TLS**
  - Verificar certificado
  - URL: https://vidahome.es
  - No debe haber advertencias de "sitio no seguro"

---

## 🚨 Rollback (Si algo falla)

Si en los primeros 30 minutos algo va mal:

### Opción A: Revert DNS (Rápido, 5 min)
```bash
# En tu DNS provider: restaurar registros anteriores
# Apuntar nuevamente al servidor antiguo (Arsys)
# TTL bajo ayuda con propagación rápida
```

### Opción B: Redirect temporal en Vercel
```typescript
// next.config.ts - Como último recurso
const isDisabled = process.env.DISABLE_SITE === 'true';
if (isDisabled) {
  redirects: async () => [
    { source: '/:path*', destination: 'https://old-vidahome.arsys.es/:path*', permanent: false },
  ],
}
```

---

## 📊 Post-Migración (Semanas 1-2)

### Monitoreo Diario
- [ ] **Google Search Console**
  - [ ] Revisar errores de rastreo
  - [ ] Esperar por "Enviados por el usuario" en Cobertura
  
- [ ] **Analytics**
  - [ ] Comparar sesiones/día vs semana anterior
  - [ ] Verificar no hay drop en conversiones
  
- [ ] **Uptime**
  - [ ] Monitorear Uptime Robot o similar
  - [ ] Verificar alertas de email

- [ ] **Performance**
  - [ ] Daily: PageSpeed Insights
  - [ ] Verificar Core Web Vitals

### Acciones SEO
- [ ] **Actualizar robots.txt**
  ```
  User-agent: *
  Disallow: /admin/
  Allow: /
  
  Sitemap: https://vidahome.es/sitemap.xml
  ```

- [ ] **Actualizar .htaccess antiguo**
  - Si aún tienes servidor Arsys activo:
  - Dejar solo: `RewriteRule ^(.*)$ https://vidahome.es/$1 [R=301,L]`
  - Esto captura cualquier acceso residual

- [ ] **Google Business Profile**
  - Actualizar dirección web a: `https://vidahome.es`
  - Esperar a que Google valide

- [ ] **Redes sociales**
  - Actualizar URL en bio de LinkedIn, Instagram, etc.
  - Cambiar enlaces en posts fijados

### Validación de Datos
- [ ] **Verificar que todas las propiedades existen**
  - Spot check: aleatorios 5 propiedades
  - Comprobar fotos, descripción, precio
  
- [ ] **Validar leads y formularios**
  - Test enviar contacto → verificar en Supabase
  - Test tasación → verificar en Supabase
  
- [ ] **Multi-idioma**
  - Navegación a `/en`, `/fr`, `/de`
  - Verificar que descripciones traducen correctamente

---

## ✅ Checklist de Lanzamiento (Día L+7)

- [ ] **Google indexó nueva URL**
  - Search Console → debe mostrar URLs de vidahome.es
  
- [ ] **Antiguas URLs devuelven 301**
  - `curl -I https://vidahome.es/ficha.php?id=xxx`
  - Retorna 301 a `/propiedades/xxx`
  
- [ ] **Ranking no bajó**
  - Comparar posiciones para keywords principales:
    - "inmobiliaria gandia"
    - "casas gandia"
    - "pisos gandia"
  
- [ ] **Certificado SSL válido**
  - https://vidahome.es
  - Verificar con: `ssl-labs.com`
  
- [ ] **No hay errores críticos**
  - Sentry/monitoring no reporta 500s
  - Vercel Functions ejecutan sin timeout

---

## 🎯 Post-Lanzamiento (Largo Plazo)

### Semana 2-4
- [ ] Monitorear que Google complete reindexación
- [ ] Verificar que antiguos backlinks llegan correctamente (vía 301)
- [ ] Optimizar velocidad si es necesario

### Mes 1-3
- [ ] Analizar patrones de tráfico en vidahome.es
- [ ] Comparar conversiones con web anterior
- [ ] Ajustar estrategia SEO según data real

### Antes de Remover Web Anterior
- [ ] ✅ Google ha reindexado completamente (Search Console: "Válidas")
- [ ] ✅ No hay errores 404 importantes (< 1% de tráfico)
- [ ] ✅ Analytics muestran tráfico estable en nueva URL
- [ ] ✅ Conversiones (leads/contactos) están activas

**Entonces**: Puedes dar de baja hosting anterior o dejar solo redirecciones de emergencia.

---

## 📞 Contactos Útiles

| Qué | Contacto | Nota |
|-----|----------|------|
| **Google Search Console Issues** | https://support.google.com/webmasters | Respuesta: 1-7 días |
| **Vercel Support** | support@vercel.com o dashboard | Plan Pro: respuesta rápida |
| **Supabase Issues** | https://github.com/supabase/supabase/issues | Comunidad activa |
| **DNS Issues** | Tu proveedor DNS (Arsys, etc) | Contactar con soporte |

---

## 📈 Métricas de Éxito

| Métrica | Objetivo | Target |
|---------|----------|--------|
| **Tiempo de carga homepage** | < 2s (ES), < 1.5s (EN) | 3G slow |
| **Core Web Vitals** | "Good" | Lighthouse 80+ |
| **Uptime** | 99.9%+ | Vercel SLA |
| **Errores 404** | < 1% de sesiones | Post-migración semana 1 |
| **Bounce rate** | No aumenta > 5% | vs semana anterior |
| **Leads/conversiones** | Mantener o aumentar | KPI principal |

---

## 🔐 Checklist de Seguridad

- [ ] **Certificado SSL válido**
  - HTTPS en todas las URLs
  - Sin warnings de navegador

- [ ] **Credenciales rotadas**
  - ADMIN_PASSWORD solo en Vercel Secrets
  - Nunca en git
  
- [ ] **Rate limiting activo**
  - Endpoints `/api/*` protegidos
  - Protección contra bots

- [ ] **Middleware de admin funcionando**
  - `/admin/*` requiere autenticación
  - Logout funciona

- [ ] **CORS configurado correctamente**
  - Solo vidahome.es (no localhost en prod)

---

## 📝 Documentación Post-Migración

- [ ] Actualizar README.md con "Deployed on Vercel"
- [ ] Documentar DNS records final en Notion/Wiki
- [ ] Guardar backup de configuración Vercel
- [ ] Actualizar referencias internas al dominio nuevo

---

**Preparado por**: Antigravity AI  
**Fecha**: 23/02/2026  
**Próxima revisión**: Antes de ejecutar migración

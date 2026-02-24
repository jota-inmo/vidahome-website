# 📱 Guía de Migración de URLs - CRM Inmovilla → Nueva Web Vercel

## Resumen Ejecutivo

**La buena noticia**: El CRM de Inmovilla **NO necesita cambios** en cómo genera enlaces.

**Cómo funciona**: Implementamos **redirecciones automáticas (301)** que convierten los enlaces antiguos al formato nuevo sin perder SEO.

---

## 🔄 Esquema de Redirecciones

### Enlaces de Propiedades (Property Details)

#### Formato Antiguo (Current vidahome.es)
```
https://vidahome.es/ficha.php?cod=12345
https://vidahome.es/ficha.php?id=67890
```

#### Formato Nuevo (Vercel)
```
https://vidahome.es/es/propiedades/12345
https://vidahome.es/en/propiedades/12345
```

#### ¿Qué sucede?
1. Usuario hace clic en enlace del CRM: `https://vidahome.es/ficha.php?cod=12345`
2. Web redirige automáticamente a: `https://vidahome.es/es/propiedades/12345`
3. Es una redirección **301 (permanente)** → Google mantiene SEO
4. El usuario no ve nada raro, simplemente carga la propiedad

---

### Otros Caminos

| Antiguo | Nuevo | Tipo |
|---------|-------|------|
| `/ficha.php?cod=123` | `/es/propiedades/123` | 301 Permanente |
| `/ficha.php?id=456` | `/es/propiedades/456` | 301 Permanente |
| `/listado.php` | `/es/propiedades` | 301 Permanente |
| `/contacto.php` | `/es/contacto` | 301 Permanente |
| `/index.php` | `/` (→ `/es`) | 301 Permanente |
| `/propiedades/789` | `/es/propiedades/789` | 301 Permanente |

---

## 🎯 Casos de Uso del CRM

### Caso 1: Email de Confirmación de Propiedad
El CRM envía:
```
"Mira tu propiedad aquí: https://vidahome.es/ficha.php?cod=12345"
```

**Resultado en web nueva**:
- Link funciona ✅
- Redirige automáticamente a `/es/propiedades/12345` ✅
- Usuario ve la propiedad ✅
- Analytics registra correctamente ✅

### Caso 2: Portal de Propiedades
El CRM enlaza:
```
"Ver todas las propiedades: https://vidahome.es/listado.php"
```

**Resultado en web nueva**:
- Link funciona ✅
- Redirige a `/es/propiedades` ✅
- Lista completa carga ✅

### Caso 3: Formulario de Contacto
El CRM envía:
```
"Contacta con nosotros: https://vidahome.es/contacto.php"
```

**Resultado en web nueva**:
- Link funciona ✅
- Redirige a `/es/contacto` ✅

---

## ⚙️ Detalles Técnicos

### Implementación en Next.js

```typescript
// next.config.ts
async redirects() {
    return [
      {
        source: '/ficha.php',
        has: [{ type: 'query', key: 'cod' }],
        destination: '/es/propiedades/:cod',
        permanent: true,  // ← 301 Redirect (SEO-friendly)
      },
      // ... más redirecciones
    ];
}
```

**Ventajas**:
- ✅ Redirecciones a nivel de Next.js (sin necesidad de .htaccess)
- ✅ Performance óptimo (edge-level en Vercel)
- ✅ SEO preservado con status 301
- ✅ Funciona incluso sin cambios en el CRM

---

## 🚀 Plan de Migración

### Fase 1: Pre-Migration (Antes de cambiar DNS)
- [x] Implementar redirecciones en `next.config.ts`
- [x] Desplegar en Vercel
- [x] Probar redirecciones manualmente

### Fase 2: Migration Day (Cambio de DNS)
1. Cambiar DNS de `vidahome.es` a Vercel nameservers
2. Esperar propagación DNS (1-24 horas)
3. El CRM **sigue generando links como siempre**
4. Los links funcionan gracias a nuestras redirecciones

### Fase 3: Post-Migration (Después)
- Monitorear Analytics
- Verificar que los emails del CRM llegan correctamente
- Opcional: Actualizar CRM para generar URLs nuevas directamente

---

## 📊 Impacto en Analytics

### Rastreo Mejorado
Con nuestras **redirecciones + UTM parameters**, sabremos:

```
Email del CRM: /ficha.php?cod=12345&utm_source=email&utm_campaign=property_confirmation
        ↓ (redirige automáticamente)
New URL: /es/propiedades/12345?utm_source=email&utm_campaign=property_confirmation
        ↓
Analytics registra: "Email - Property Confirmation"
```

---

## ❓ FAQs

### P: ¿El CRM necesita cambios?
**R**: No. Puede seguir generando enlaces exactamente igual. Las redirecciones funcionan automáticamente.

### P: ¿Se pierden usuarios?
**R**: No. Las redirecciones son transparentes. El usuario ni se entera.

### P: ¿Se pierde SEO?
**R**: No. Usamos redirecciones 301 (permanentes), Google reconoce los cambios de URL correctamente.

### P: ¿Cuándo debo actualizar el CRM?
**R**: No es urgente. Pero si quieres URLs más limpias, Inmovilla puede actualizar el CRM para generar directamente:
```
/es/propiedades/12345  (en lugar de /ficha.php?cod=12345)
```

### P: ¿Funciona con emails, redes sociales, etc?
**R**: Sí. Cualquier enlace antiguo redirige automáticamente.

---

## 🔐 Consideraciones de Seguridad

- ✅ Las redirecciones no introducen vulnerabilidades
- ✅ No hay exposure de parámetros internos
- ✅ Vercel maneja las redirecciones a nivel global (CDN)

---

## 📞 Contacto con Inmovilla

### Información a Proporcionar

Cuando contactes a Inmovilla para la migración:

```
"La nueva web está en Vercel con soporte automático para URLs antiguas.
Los enlaces del CRM seguirán funcionando sin cambios gracias a 
redirecciones permanentes (301):

- /ficha.php?cod=123 → /es/propiedades/123
- /listado.php → /es/propiedades
- /contacto.php → /es/contacto

No requiere cambios en el CRM. Las redirecciones son automáticas."
```

---

## ✅ Checklist de Migración

- [x] Redirecciones implementadas en `next.config.ts`
- [x] Verificar que local funciona (`npm run dev`)
- [x] Desplegar en Vercel
- [x] Probar redirecciones en producción
- [ ] Cambiar DNS (cuando estés listo)
- [ ] Verificar analytics después de migración
- [ ] Informar a Inmovilla sobre nuevas URLs (opcional)

---

## 📈 Monitoreo Post-Migración

### En Vercel
```bash
# Ver logs de redirecciones
vercel logs --follow
```

### En Analytics
1. Ver referrers que vienen de `ficha.php` → deberían desaparecer
2. Verificar que `/es/propiedades/:id` recibe tráfico
3. Confirmar que emails del CRM funcionan

---

**Última actualización**: Febrero 2026
**Status**: Implementado ✅
**Siguiente paso**: Migración de DNS cuando estés listo


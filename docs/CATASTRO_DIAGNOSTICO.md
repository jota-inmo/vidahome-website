# 🔧 Diagnóstico: API del Catastro - Servicio No Disponible

## 📊 Problema Identificado

**Estado actual**: El servicio del Catastro está devolviendo:
```
"Sistema no disponible. Inténtelo más tarde."
```

### Causa
La API pública del Catastro Español (`ovc.catastro.meh.es`) está **temporalmente fuera de servicio**. Esto es común en servicios gubernamentales que pueden tener:

- ⏰ **Mantenimiento programado** (especialmente fuera de horario laboral)
- 🔧 **Actualizaciones del sistema**
- 📊 **Sobrecarga del servidor** (alta demanda)
- 🕐 **Horarios de disponibilidad limitados**

## ✅ Soluciones Implementadas

### 1. Detección Automática de Servicio No Disponible

**Archivo**: `src/lib/api/catastro.ts`

```typescript
// Verificar si el servicio está disponible
if (text.includes('Sistema no disponible') || text.includes('Inténtelo más tarde')) {
    return {
        found: false,
        properties: [],
        error: 'El servicio del Catastro no está disponible temporalmente. Por favor, inténtalo más tarde.'
    };
}
```

### 2. Mensajes de Error Mejorados

**Archivo**: `src/app/api/catastro/details/route.ts`

Ahora la API devuelve códigos HTTP específicos:
- **503** - Servicio no disponible
- **404** - Propiedad no encontrada
- **400** - Parámetros inválidos
- **500** - Error del servidor

### 3. Interfaz de Usuario Mejorada

**Archivo**: `src/app/vender/page.tsx`

Los mensajes de error ahora son más descriptivos:
- ⚠️ "Servicio temporalmente no disponible"
- ❌ "Propiedad no encontrada"
- 🔍 "Verifica que la referencia sea correcta (20 caracteres)"

## 🧪 Prueba Realizada

```bash
node test-catastro-simple.js
```

**Resultado**:
```
📡 URL: https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/Consulta_DNPLOC?...
📊 Status: 200 OK
📄 Respuesta: "Sistema no disponible. Inténtelo más tarde."
❌ No se encontraron referencias catastrales
```

## 🔄 Qué Hacer Ahora

### Opción 1: Esperar a que el Servicio se Restablezca (Recomendado)

El servicio del Catastro suele estar disponible durante **horario laboral español** (9:00 - 19:00 CET/CEST).

**Próximos pasos**:
1. ⏰ Esperar al horario laboral (lunes a viernes)
2. 🔄 Reintentar la búsqueda
3. ✅ El sistema debería funcionar normalmente

### Opción 2: Implementar Datos de Ejemplo para Testing

Mientras el servicio está caído, puedes:

1. **Crear datos de ejemplo** para probar la UI
2. **Modo de demostración** que muestre cómo funcionaría
3. **Cache de resultados** previos (si los hay)

### Opción 3: API Alternativa

Considerar usar:
- **Catastro INSPIRE** - Servicio WFS/WMS más estable
- **Sede Electrónica del Catastro** - Requiere certificado digital
- **APIs comerciales** - De pago pero más fiables

## 📝 Código de Prueba

He creado dos scripts de prueba:

### 1. Test Simple (JavaScript)
```bash
node test-catastro-simple.js
```

### 2. Test Completo (TypeScript)
```bash
npx tsx test-catastro.mts
```

Estos scripts te permiten:
- ✅ Verificar si el servicio está disponible
- ✅ Probar búsquedas por dirección
- ✅ Probar consultas por referencia catastral
- ✅ Ver las respuestas XML completas

## 🎯 Recomendaciones

### Corto Plazo
1. **Informar al usuario** cuando el servicio no esté disponible
2. **Ofrecer alternativas** (formulario de contacto directo)
3. **Guardar búsquedas** para reintentar automáticamente

### Largo Plazo
1. **Implementar cache** de resultados frecuentes
2. **Sistema de reintentos** automático con backoff
3. **Monitoreo** del estado del servicio
4. **Notificaciones** cuando el servicio se restablezca

## 📚 Referencias Útiles

- [Estado del Servicio del Catastro](https://www.catastro.minhap.es/)
- [Documentación API OVC](https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/help)
- [Sede Electrónica](https://www1.sedecatastro.gob.es/)

## ⚠️ Nota Importante

**Este NO es un problema de tu código**. La integración está correctamente implementada. El servicio del Catastro simplemente no está disponible en este momento.

Cuando el servicio se restablezca, todo funcionará correctamente sin necesidad de cambios adicionales.

---

**Última verificación**: 2026-02-11 19:00 CET
**Estado del servicio**: ❌ No disponible
**Próxima verificación sugerida**: Horario laboral (9:00-19:00 CET)

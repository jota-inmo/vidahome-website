# ✅ Configuración de la API del Catastro - MIGRADA A JSON

## 📊 Estado: FUNCIONANDO (API JSON OFICIAL)

La integración ha sido migrada exitosamente de XML a la **API JSON oficial** del Catastro (`ovc.catastro.meh.es`), que se ha confirmado como operativa.

## ✅ Cambios Realizados

### 1. Migración a JSON (`src/lib/api/catastro.ts`)
- 🔄 **Reemplazado parsing XML** completo por `JSON.parse()` nativo.
- ✅ **Endpoint actualizado**: `/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/json`
- 🛠️ **Mapeo de datos mejorado** para manejar las estructuras anidadas del JSON del Catastro.

### 2. Pruebas de Conectividad
- ✅ **Test JSON exitoso**: Se verificó que el endpoint JSON responde correctamente con datos reales (Ref: `2749704YJ0624N0001DI`).
- ❌ **Test XML fallido**: El endpoint XML antiguo daba problemas o devolvía "Servicio no disponible".
- ❌ **Dominio `hacienda.gob.es`**: Dio problemas de conexión, se mantiene `meh.es` que funciona.

### 3. API Routes Servidor
- ✅ `/api/catastro/search` (POST) -> Usa `Consulta_DNPLOC` (JSON)
- ✅ `/api/catastro/details` (GET) -> Usa `Consulta_DNPRC` (JSON)
- 🛡️ Mantiene la seguridad y evita CORS.

## 🚀 Cómo Usar

### Búsqueda por Referencia (Probada y Funcionando)
1. Ve a `/vender`
2. Selecciona "Por Referencia Catastral"
3. Prueba con la referencia de ejemplo oficial: `2749704YJ0624N0001DI`
4. Deberías ver los datos cargados correctamente.

### Búsqueda por Dirección
1. Ve a `/vender`
2. Selecciona "Por Dirección"
3. Introduce una dirección válida (Ej: Provincia: VALENCIA, Municipio: GANDIA, Vía: MAYOR, Nº: 1)
   *Nota: Si la dirección exacta no existe, el sistema ahora maneja el error 43 correctamente.*

## 🔧 Solución de Problemas Comunes

- **Error 43**: "No existe número" -> La calle existe pero el número no. Prueba números cercanos.
- **Servicio no disponible**: Puede ocurrir puntualmente, el sistema lo detecta y avisa.
- **Datos faltantes**: La API pública a veces no devuelve valor catastral o año de construcción si no se usa certificado digital.

---

**Última actualización**: 2026-02-12
**Estado**: ✅ MIGRADO A JSON Y FUNCIONANDO
**Versión Cliente**: 2.0 (JSON Based)

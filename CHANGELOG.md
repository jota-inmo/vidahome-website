# Changelog - Catastro Integration Fixes

## [2026-02-25] - Inmovilla Sync Rate Limit Optimization

### 🚀 Optimización del Sistema de Sincronización
- **Reducción de Frecuencia de Cron**: Changed GitHub Actions workflow from every 1 minute (`*/1 * * * *`) to every 2 minutes (`*/2 * * * *`)
- **Ajuste del Batch Size**: Reduced batch size from 10 to 8 properties per sync in `/api/admin/sync-incremental`
- **Respeto de Límites de Tasa**: API calls per batch now: 1 + 8 = 9 calls per 2 minutes (~4.5 calls/min average) vs previous 11/min
- **Resultado**: Stays comfortably under Inmovilla API's 10 calls/minute rate limit while maintaining ~4 properties/minute throughput

### 📊 Impacto
- Elimina los errores de rate limiting que detenían la sincronización
- Permite sincronizar los 77 propiedades de inventario sin interrupciones
- Mantiene throughput óptimo: 8 propiedades cada 2 minutos (~16 min para completar sync de 77 propiedades)

---

## [2026-02-14] - Catastro Search and Selection Optimization

### 🚀 Mejoras en la Búsqueda y Selección
- **Búsqueda Automática**: Ahora la búsqueda se dispara automáticamente al seleccionar un número de calle de las sugerencias, eliminando un paso extra para el usuario.
- **Soporte de Parcelas (14 caracteres)**: Si se busca por una referencia de parcela (14 caracteres), el sistema ahora detecta automáticamente que es una parcela y despliega la lista de todos los inmuebles (pisos/puertas) disponibles en lugar de dar error.
- **Selección de Inmueble Mejorada**: Al elegir un piso de la lista, el sistema recupera automáticamente la referencia de 20 caracteres y carga los detalles técnicos completos.

### 🛠️ Correcciones Técnicas (Backend)
- **Eliminación de Prefijos Duplicados**: Corregido un error que enviaba el tipo de vía repetido (ej: "CL CL MAJOR") a la API, provocando que no se encontraran calles válidas.
- **Normalización Agresiva**: El backend ahora limpia automáticamente el nombre de la vía de cualquier prefijo de tipo (CL, AV, etc.) antes de consultar al Catastro.
- **Fallback de Error 43**: Refinada la lógica de recuperación cuando el Catastro dice que "el número no existe", probando combinaciones sin tipo de vía y con el número '1' como comodín para localizar la parcela.

---

## [Anterior] - Estabilización de la API

### ✨ Funcionalidades
- **Integración SOAP XML**: Migración de la consulta de detalles y parcelas al endpoint SOAP XML (`OVCCallejero.asmx`), mucho más estable que el endpoint JSON oficial para datos masivos.
- **Parsing de Ubicaciones Detalladas**: Implementada la extracción de Bloque, Escalera, Planta y Puerta desde las respuestas XML del Catastro.
- **Cálculo de Valoración**: Sistema de estimación de mercado basado en la superficie y antigüedad extraída directamente de los datos oficiales.

### 🐛 Bug Fixes
- Corregido error 500 al intentar parsear respuestas HTML de error del Catastro como JSON.
- Corregido el truncamiento de direcciones al usar comas para separar piso/puerta en la interfaz.
- Eliminada integración temporal con Supabase para priorizar la estabilidad de la búsqueda del Catastro.

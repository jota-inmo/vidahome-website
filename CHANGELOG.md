# Changelog - Catastro Integration Fixes

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

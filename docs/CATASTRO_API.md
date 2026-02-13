# Integración con la API del Catastro Español

## 📋 Descripción

Este proyecto incluye una integración completa con la API del Catastro Español para consultar datos de propiedades inmobiliarias.

## 🏗️ Arquitectura

### 1. Cliente del Catastro (`src/lib/api/catastro.ts`)

Clase `CatastroClient` que encapsula las llamadas a la API oficial del Catastro:

- **Base URL**: `https://ovc.catastro.meh.es`
- **Servicios utilizados**:
  - `Consulta_DNPLOC`: Búsqueda por dirección (Datos No Protegidos por Localización)
  - `Consulta_DNPRC`: Consulta por referencia catastral (Datos No Protegidos por Referencia Catastral)

#### Métodos principales:

```typescript
// Buscar por dirección
searchByAddress(address: CatastroAddress): Promise<CatastroSearchResult>

// Obtener detalles por referencia catastral
getPropertyDetails(referenciaCatastral: string): Promise<CatastroProperty | null>

// Estimar valor de mercado
estimateMarketValue(valorCatastral: number): { min: number; max: number }
```

### 2. API Routes (Servidor)

Para evitar problemas de CORS, las llamadas al Catastro se hacen desde el servidor mediante Next.js API Routes:

#### `/api/catastro/search` (POST)
Busca propiedades por dirección.

**Request body:**
```json
{
  "provincia": "Valencia",
  "municipio": "Gandia",
  "via": "Gran Vía",
  "numero": "42"
}
```

**Response:**
```json
{
  "found": true,
  "properties": [
    {
      "referenciaCatastral": "1234567VK1234N0001AB",
      "direccion": "CL Gran Vía 42",
      "superficie": 0,
      "uso": "Desconocido",
      "clase": "Urbano"
    }
  ]
}
```

#### `/api/catastro/details` (GET)
Obtiene detalles completos de una propiedad.

**Query params:**
- `ref`: Referencia catastral (20 caracteres)

**Response:**
```json
{
  "property": {
    "referenciaCatastral": "1234567VK1234N0001AB",
    "direccion": "CL Gran Vía 42",
    "superficie": 120.5,
    "anoConstruccion": 2005,
    "valorCatastral": 85000,
    "uso": "Residencial",
    "clase": "Urbano",
    "coordenadas": {
      "lat": 38.9667,
      "lon": -0.1833
    }
  },
  "estimation": {
    "min": 119000,
    "max": 170000
  }
}
```

### 3. Página de Vender (`src/app/vender/page.tsx`)

Interfaz de usuario que permite:

1. **Búsqueda por dirección** o **referencia catastral**
2. **Visualización de datos** de la propiedad
3. **Estimación de valor** de mercado
4. **Formulario de contacto** para tasación profesional

## 🔧 Configuración

### Requisitos

- Next.js 14+
- TypeScript
- No requiere API keys (la API del Catastro es pública)

### Instalación

No se requiere configuración adicional. La integración está lista para usar.

## 📝 Uso

### Desde el cliente (componentes React)

```typescript
// Buscar por dirección
const response = await fetch('/api/catastro/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    provincia: 'Valencia',
    municipio: 'Gandia',
    via: 'Gran Vía',
    numero: '42'
  })
});

const result = await response.json();

// Obtener detalles
const detailsResponse = await fetch(
  `/api/catastro/details?ref=${referenciaCatastral}`
);
const data = await detailsResponse.json();
```

### Desde el servidor (API Routes o Server Components)

```typescript
import { createCatastroClient } from '@/lib/api/catastro';

const client = createCatastroClient();

// Buscar
const result = await client.searchByAddress({
  provincia: 'Valencia',
  municipio: 'Gandia',
  via: 'Gran Vía',
  numero: '42'
});

// Detalles
const property = await client.getPropertyDetails('1234567VK1234N0001AB');

// Estimación
if (property?.valorCatastral) {
  const estimation = client.estimateMarketValue(property.valorCatastral);
}
```

## ⚠️ Limitaciones y Consideraciones

### 1. Formato de Datos

La API del Catastro devuelve XML, que parseamos manualmente. Los campos disponibles pueden variar según el tipo de inmueble.

### 2. Estimación de Valor

La estimación de valor de mercado es **aproximada** y se basa en:
- Valor catastral × 1.4 (mínimo)
- Valor catastral × 2.0 (máximo)

**Nota**: Esta es una estimación genérica. El valor real puede variar significativamente según:
- Ubicación exacta
- Estado de conservación
- Reformas realizadas
- Mercado local

### 3. Disponibilidad del Servicio

La API del Catastro es un servicio público que puede:
- Tener tiempos de respuesta variables
- Estar temporalmente no disponible
- Cambiar su estructura de datos

### 4. CORS

Las llamadas directas desde el navegador al Catastro fallan por CORS. Por eso usamos API Routes.

## 🧪 Testing

Para probar la integración:

1. **Navega a** `/vender`
2. **Prueba con datos reales**:
   - Provincia: Valencia
   - Municipio: Gandia
   - Vía: Gran Vía
   - Número: 1

O usa una referencia catastral real de 20 caracteres.

## 📚 Referencias

- [Catastro - Servicios Web](https://www.catastro.minhap.es/webinspire/index.html)
- [Sede Electrónica del Catastro](https://www1.sedecatastro.gob.es/)
- [Documentación API OVC](https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/help)

## 🔐 Seguridad

- ✅ No se exponen credenciales (API pública)
- ✅ Validación de parámetros en API Routes
- ✅ Sanitización de inputs
- ✅ Manejo de errores apropiado
- ✅ Rate limiting natural (servidor único)

## 🚀 Mejoras Futuras

- [ ] Cache de resultados para reducir llamadas
- [ ] Soporte para búsqueda por coordenadas
- [ ] Integración con mapas (Google Maps / OpenStreetMap)
- [ ] Histórico de valores catastrales
- [ ] Comparativa con precios de mercado reales

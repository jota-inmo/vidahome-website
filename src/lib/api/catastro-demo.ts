import { CatastroProperty, CatastroSearchResult } from './catastro';

/**
 * Datos de ejemplo del Catastro para testing y demostración
 * Estos datos simulan respuestas reales de la API cuando está disponible
 */

export const DEMO_PROPERTIES: CatastroProperty[] = [
    {
        referenciaCatastral: '4609302YJ3940N0001WX',
        direccion: 'CL GRAN VIA 1',
        superficie: 120.5,
        anoConstruccion: 2005,
        valorCatastral: 85000,
        uso: 'Residencial',
        clase: 'Urbano',
        coordenadas: {
            lat: 38.9667,
            lon: -0.1833
        }
    },
    {
        referenciaCatastral: '4609302YJ3940N0002AB',
        direccion: 'CL GRAN VIA 3',
        superficie: 95.0,
        anoConstruccion: 1998,
        valorCatastral: 72000,
        uso: 'Residencial',
        clase: 'Urbano',
        coordenadas: {
            lat: 38.9668,
            lon: -0.1834
        }
    },
    {
        referenciaCatastral: '4609302YJ3940N0003CD',
        direccion: 'CL PASEO MARITIMO 15',
        superficie: 150.0,
        anoConstruccion: 2010,
        valorCatastral: 125000,
        uso: 'Residencial',
        clase: 'Urbano',
        coordenadas: {
            lat: 38.9850,
            lon: -0.1650
        }
    },
    {
        referenciaCatastral: '4609302YJ3940N0004EF',
        direccion: 'AV VALENCIA 42',
        superficie: 180.0,
        anoConstruccion: 2015,
        valorCatastral: 145000,
        uso: 'Residencial',
        clase: 'Urbano',
        coordenadas: {
            lat: 38.9700,
            lon: -0.1800
        }
    }
];

/**
 * Buscar propiedad de demostración por dirección
 */
export function searchDemoProperty(via: string, numero: string): CatastroSearchResult {
    const normalizedVia = via.toLowerCase().trim();
    const normalizedNumero = numero.toLowerCase().trim();

    const found = DEMO_PROPERTIES.filter(prop => {
        const propAddress = prop.direccion.toLowerCase();
        return propAddress.includes(normalizedVia) ||
            (normalizedNumero && propAddress.includes(normalizedNumero));
    });

    if (found.length > 0) {
        return {
            found: true,
            properties: found
        };
    }

    // Si no se encuentra, devolver la primera como ejemplo
    return {
        found: true,
        properties: [DEMO_PROPERTIES[0]]
    };
}

/**
 * Obtener detalles de propiedad de demostración por referencia
 */
export function getDemoPropertyDetails(referenciaCatastral: string): CatastroProperty | null {
    const normalized = referenciaCatastral.replace(/\s/g, '').toUpperCase();

    const found = DEMO_PROPERTIES.find(prop =>
        prop.referenciaCatastral === normalized
    );

    // Si no se encuentra, devolver la primera como ejemplo
    return found || DEMO_PROPERTIES[0];
}

/**
 * Verificar si una referencia es de demostración
 */
export function isDemoReference(referenciaCatastral: string): boolean {
    const normalized = referenciaCatastral.replace(/\s/g, '').toUpperCase();
    return DEMO_PROPERTIES.some(prop => prop.referenciaCatastral === normalized);
}

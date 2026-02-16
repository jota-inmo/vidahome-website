/**
 * Adapter to convert Web API responses to the format expected by the app
 * This maintains compatibility with existing code while using the new Web API
 */

import { PropertyListEntry, PropertyDetails } from '@/types/inmovilla';
import { createInmovillaWebClient } from './web-client';

interface WebApiPropertyResponse {
    cod_ofer: string;
    ref: string;
    keyacci?: string;
    key_tipo?: string;
    key_loca?: string;
    precioinmo?: string;
    precioalq?: string;
    habitaciones?: string;
    habdobles?: string;
    banyos?: string;
    m_cons?: string;
    calle?: string;
    descripciones?: string;
    numagencia?: string;
    numfotos?: string;
    fotoletra?: string;
    nodisponible?: string;
    prospecto?: string;
    poblacion?: string;
    tipo_nombre?: string;
}

/**
 * Convert Web API property to PropertyListEntry format
 */
function convertToPropertyListEntry(webProp: any): PropertyListEntry {
    const codOfer = parseInt(webProp.cod_ofer);
    const numFotos = parseInt(webProp.numfotos || '0');

    let mainImage = '';
    if (webProp.numagencia && webProp.fotoletra && numFotos > 0) {
        mainImage = `https://fotos15.inmovilla.com/${webProp.numagencia}/${codOfer}/${webProp.fotoletra}-1.jpg`;
    }

    const totalHabitaciones = (Number(webProp.habitaciones) || 0) + (Number(webProp.habdobles) || 0);

    // Inmovilla Web API often returns descriptions as an object with language IDs
    let description = '';
    if (typeof webProp.descripciones === 'object' && webProp.descripciones !== null) {
        description = webProp.descripciones['1'] || webProp.descripciones[1] || '';
    } else if (typeof webProp.descripciones === 'string') {
        description = webProp.descripciones;
    }

    return {
        cod_ofer: codOfer,
        ref: webProp.ref || '',
        keyacci: webProp.keyacci ? parseInt(webProp.keyacci) : undefined,
        precioinmo: webProp.precioinmo ? parseFloat(webProp.precioinmo) : undefined,
        precioalq: webProp.precioalq ? parseFloat(webProp.precioalq) : undefined,
        habitaciones: totalHabitaciones || undefined,
        banyos: webProp.banyos ? parseFloat(webProp.banyos) : undefined,
        m_cons: webProp.m_cons ? parseFloat(webProp.m_cons) : undefined,
        calle: webProp.calle,
        descripciones: description,
        numagencia: webProp.numagencia,
        numfotos: webProp.numfotos,
        fotoletra: webProp.fotoletra,
        nodisponible: webProp.nodisponible === '1' || webProp.nodisponible === 1,
        prospecto: webProp.prospecto === '1' || webProp.prospecto === 1,
        fechaact: '', // Not provided by Web API
        poblacion: webProp.poblacion || '',
        tipo_nombre: webProp.tipo_nombre || '',
        mainImage
    };
}

/**
 * Convert Web API property to PropertyDetails format
 */
function convertToPropertyDetails(webProp: WebApiPropertyResponse): PropertyDetails {
    const codOfer = parseInt(webProp.cod_ofer);
    const numFotos = parseInt(webProp.numfotos || '0');

    // Generate all photo URLs
    const photos: string[] = [];
    if (numFotos > 0 && webProp.numagencia && webProp.fotoletra) {
        for (let i = 1; i <= numFotos; i++) {
            photos.push(`https://fotos15.inmovilla.com/${webProp.numagencia}/${codOfer}/${webProp.fotoletra}-${i}.jpg`);
        }
    }

    const totalHabitaciones = (Number(webProp.habitaciones) || 0) + (Number(webProp.habdobles) || 0);

    return {
        cod_ofer: codOfer,
        ref: webProp.ref,
        keyacci: webProp.keyacci ? parseInt(webProp.keyacci) : 0,
        key_tipo: webProp.key_tipo ? parseInt(webProp.key_tipo) : 0,
        key_loca: webProp.key_loca ? parseInt(webProp.key_loca) : 0,
        key_zona: 0, // Not provided by Web API
        keycli: 0, // Not provided by Web API
        keyori: 0, // Not provided by Web API
        fecha: '', // Not provided by Web API
        nodisponible: webProp.nodisponible === '1',
        precio: webProp.precioinmo ? parseFloat(webProp.precioinmo) : 0,
        precioinmo: webProp.precioinmo ? parseFloat(webProp.precioinmo) : 0,
        calle: webProp.calle || '',
        planta: 0, // Not provided by Web API
        numero: '', // Not provided by Web API
        banyos: webProp.banyos ? parseFloat(webProp.banyos) : 0,
        m_cons: webProp.m_cons ? parseFloat(webProp.m_cons) : undefined,
        m_utiles: undefined,
        terraza: undefined,
        ascensor: undefined,
        piscina_com: undefined,
        aire_con: undefined,
        calefaccion: undefined,
        garaje: undefined,
        vistasalmar: undefined,
        descripciones: webProp.descripciones,
        fotos_lista: photos,
        numagencia: webProp.numagencia,
        numfotos: webProp.numfotos,
        fotoletra: webProp.fotoletra,
        habitaciones: totalHabitaciones || undefined,
        poblacion: webProp.poblacion || '',
        tipo_nombre: webProp.tipo_nombre || ''
    };
}

/**
 * Web API Service - maintains same interface as REST API service
 */
export class InmovillaWebApiService {
    private client: ReturnType<typeof createInmovillaWebClient>;

    constructor(numagencia: string, password: string, addnumagencia: string = '', idioma: number = 1, ip: string = '', domain: string = '') {
        this.client = createInmovillaWebClient({
            numagencia,
            addnumagencia,
            password,
            idioma,
            ip,
            domain
        });
    }

    /**
     * Get all properties (paginated)
     */
    async getProperties(options: { page?: number } = {}): Promise<PropertyListEntry[]> {
        const page = options.page || 1;

        try {
            const response = await this.client.getProperties(page, 100, '', 'cod_ofer DESC');

            // The Web API returns data in a specific format
            // We need to parse it based on the actual response structure
            if (!response || !response.paginacion) {
                return [];
            }

            const properties = Array.isArray(response.paginacion)
                ? response.paginacion
                : [response.paginacion];

            return properties.map(convertToPropertyListEntry);
        } catch (error) {
            console.error('Error fetching properties from Web API:', error);
            throw error;
        }
    }

    /**
     * Get property details by ID
     */
    async getPropertyDetails(codOfer: number): Promise<PropertyDetails> {
        try {
            const response = await this.client.getPropertyDetails(codOfer);

            if (!response || !response.ficha) {
                throw new Error(`Property ${codOfer} not found`);
            }

            const propertyData = Array.isArray(response.ficha)
                ? response.ficha[0]
                : response.ficha;

            return convertToPropertyDetails(propertyData);
        } catch (error) {
            console.error(`Error fetching property ${codOfer} from Web API:`, error);
            throw error;
        }
    }

    /**
     * Get featured properties
     */
    async getFeaturedProperties(limit: number = 20): Promise<PropertyListEntry[]> {
        try {
            const response = await this.client.getFeaturedProperties(limit);

            if (!response || !response.destacados) {
                return [];
            }

            const properties = Array.isArray(response.destacados)
                ? response.destacados
                : [response.destacados];

            return properties.map(convertToPropertyListEntry);
        } catch (error) {
            console.error('Error fetching featured properties from Web API:', error);
            throw error;
        }
    }

    /**
     * Get property types
     */
    async getPropertyTypes() {
        try {
            const response = await this.client.getPropertyTypes();
            return response.tipos || [];
        } catch (error) {
            console.error('Error fetching property types from Web API:', error);
            throw error;
        }
    }

    /**
     * Get cities
     */
    async getCities() {
        try {
            const response = await this.client.getCities();
            return response.ciudades || [];
        } catch (error) {
            console.error('Error fetching cities from Web API:', error);
            throw error;
        }
    }

    /**
     * Get zones for a city
     */
    async getZones(cityKey: number) {
        try {
            const response = await this.client.getZones(cityKey);
            return response.zonas || [];
        } catch (error) {
            console.error(`Error fetching zones for city ${cityKey} from Web API:`, error);
            throw error;
        }
    }
}

/**
 * Factory function to create the appropriate API service based on config
 */
export function createInmovillaApiService(config: {
    useWebApi?: boolean;
    // Web API credentials
    numagencia?: string;
    addnumagencia?: string;
    webPassword?: string;
    idioma?: number;
    // REST API credentials (fallback)
    token?: string;
    authType?: 'Token' | 'Bearer';
}) {
    if (config.useWebApi && config.numagencia && config.webPassword) {
        return new InmovillaWebApiService(
            config.numagencia,
            config.webPassword,
            config.addnumagencia || '',
            config.idioma || 1
        );
    }

    // Fallback to REST API (current implementation)
    const { InmovillaApiService } = require('./properties');
    return new InmovillaApiService(config.token!, config.authType);
}

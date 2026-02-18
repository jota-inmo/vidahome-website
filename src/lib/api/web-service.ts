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
 * Supports parallel arrays like $descripciones[cod_ofer][idioma]
 */
function convertToPropertyListEntry(webProp: any, fullResponse?: any): PropertyListEntry {
    const codOfer = parseInt(webProp.cod_ofer);
    const numFotos = parseInt(webProp.numfotos || '0');

    let mainImage = '';
    if (webProp.numagencia && webProp.fotoletra && numFotos > 0) {
        mainImage = `https://fotos15.inmovilla.com/${webProp.numagencia}/${codOfer}/${webProp.fotoletra}-1.jpg`;
    }

    const totalHabitaciones = (Number(webProp.habitaciones) || 0) + (Number(webProp.habdobles) || 0);

    // Extract description: try parallel root-level array first ($descripciones[id][idioma]['descrip'])
    let description = '';
    const idStr = String(codOfer);

    // 1. Try parallel root-level array first
    const rootDesc = fullResponse?.descripciones || webProp?.descripciones;
    if (rootDesc && typeof rootDesc === 'object' && rootDesc[idStr]) {
        const langData = rootDesc[idStr]['1'] || rootDesc[idStr][1] || Object.values(rootDesc[idStr])[0];
        if (langData && typeof langData === 'object') {
            description = langData.descrip || langData.descripcion || langData.texto || '';
        }
    }

    // 2. Fallback to standard field
    if (!description) {
        if (typeof webProp.descripciones === 'object' && webProp.descripciones !== null) {
            description = webProp.descripciones['1'] || webProp.descripciones[1] || '';
        } else {
            description = String(webProp.descripciones || '');
        }
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
 * Supports parallel arrays like $descripciones[cod_ofer][idioma]
 */
function convertToPropertyDetails(webProp: any, fullResponse?: any): PropertyDetails {
    // Detect ID from multiple possible locations
    const codOfer = parseInt(webProp.cod_ofer || webProp.codofer || webProp.key || webProp.cod || '0');

    // Crucial for photos: ensure we have agency and letter identifiers
    const numAgencia = webProp.numagencia || webProp.num_agencia || '13031';
    const numFotosValue = webProp.numfotos || webProp.num_fotos || '0';
    const numFotos = parseInt(numFotosValue);
    const fotoLetra = webProp.fotoletra || webProp.foto_letra || '';

    // Generate photo URLs
    let photos: string[] = [];

    // Try to get structured photos first
    if (webProp.fotos && typeof webProp.fotos === 'object') {
        const sorted = Object.values(webProp.fotos)
            .filter((f: any) => f && (f.url || f.foto))
            .sort((a: any, b: any) => (a.posicion || 0) - (b.posicion || 0));

        if (sorted.length > 0) {
            photos = sorted.map((f: any) => f.url || f.foto);
        }
    }

    // 2. Fallback: Manual construction if no fotos object or it was empty
    if (photos.length === 0 && numFotos > 0 && numAgencia && fotoLetra) {
        for (let i = 1; i <= numFotos; i++) {
            photos.push(`https://fotos15.inmovilla.com/${numAgencia}/${codOfer}/${fotoLetra}-${i}.jpg`);
        }
    }

    const totalHabitaciones = (Number(webProp.habitaciones) || 0) + (Number(webProp.habdobles) || 0);

    // Extract description using the specific structure identified ($descripciones[id][idioma]['descrip'])
    let description = '';
    const idStr = String(codOfer);

    // 1. Try parallel root-level array first (most reliable for Ficha)
    const rootDesc = fullResponse?.descripciones || webProp?.descripciones;
    if (rootDesc && typeof rootDesc === 'object' && rootDesc[idStr]) {
        const langData = rootDesc[idStr]['1'] || rootDesc[idStr][1] || Object.values(rootDesc[idStr])[0];
        if (langData && typeof langData === 'object') {
            description = langData.descrip || langData.descripcion || langData.texto || '';
        }
    }

    // 2. Fallback to standard fields if root array lookup failed
    if (!description) {
        const descField = webProp.descripciones || webProp.descripcion || webProp.texto;
        if (typeof descField === 'object' && descField !== null) {
            description = descField['1'] || descField[1] || descField['es'] || '';
        } else {
            description = String(descField || '');
        }
    }

    // 3. Last resort fallback
    if (!description && webProp.web && webProp.web.descripcion) {
        description = webProp.web.descripcion;
    }

    return {
        cod_ofer: codOfer,
        ref: webProp.ref || '',
        keyacci: parseInt(webProp.keyacci || '1'),
        key_tipo: parseInt(webProp.key_tipo || '0'),
        key_loca: parseInt(webProp.key_loca || '0'),
        key_zona: 0,
        keycli: 0,
        keyori: 0,
        fecha: webProp.fecha || '',
        nodisponible: webProp.nodisponible === '1' || webProp.nodisponible === 1,
        precio: parseFloat(webProp.precioinmo || webProp.precio || '0'),
        precioinmo: parseFloat(webProp.precioinmo || webProp.precio || '0'),
        calle: webProp.calle || '',
        planta: parseInt(webProp.planta || '0'),
        numero: webProp.numero || '',
        banyos: parseFloat(webProp.banyos || '0'),
        m_cons: parseFloat(webProp.m_cons || '0'),
        m_utiles: parseFloat(webProp.m_utiles || '0'),
        terraza: webProp.terraza === '1' || webProp.terraza === 1,
        ascensor: webProp.ascensor === '1' || webProp.ascensor === 1,
        piscina_com: webProp.piscina_com === '1' || webProp.piscina === '1' || webProp.piscina_com === 1 || webProp.piscina === 1,
        aire_con: webProp.aire_con === '1' || webProp.aire_con === 1,
        calefaccion: webProp.calefaccion === '1' || webProp.calefaccion === 1,
        garaje: webProp.garaje === '1' || webProp.garaje === 1,
        vistasalmar: webProp.vistasalmar === '1' || webProp.vistasalmar === 1,
        descripciones: description,
        fotos_lista: photos,
        mainImage: photos[0] || '',
        numagencia: numAgencia,
        numfotos: webProp.numfotos,
        fotoletra: fotoLetra,
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

            return properties.map((p: any) => convertToPropertyListEntry(p, response));
        } catch (error) {
            console.error('Error fetching properties from Web API:', error);
            throw error;
        }
    }

    /**
     * Retrieves detailed information for a specific property
     * Uses a dual-lookup strategy: 'ficha' for full details and 'paginacion' as fallback
     * to ensure basic data (photos, price) is available even if 'ficha' is misconfigured.
     */
    async getPropertyDetails(id: number): Promise<PropertyDetails | null> {
        try {
            // Request both ficha for details and paginacion for safety
            this.client.addProcess('ficha', 1, 1, `ofertas.cod_ofer=${id}`, '');
            this.client.addProcess('paginacion', 1, 1, `ofertas.cod_ofer=${id}`, '');

            const result = await this.client.execute();

            let detailData: any = null;
            let listData: any = null;

            // Extract records (skipping metadata at index 0)
            if (result.ficha && result.ficha.length > 1) detailData = result.ficha[1];
            if (result.paginacion && result.paginacion.length > 1) listData = result.paginacion[1];

            if (!detailData && !listData) return null;

            // Merge: listData provides working basic fields, detailData provides rich descriptions
            const combined = { ...listData, ...detailData };

            // Pass the full result as well so we can find the parallel $descripciones array
            return convertToPropertyDetails(combined, result);
        } catch (error) {
            console.error(`Error fetching property ${id}:`, error);
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

            return properties.map((p: any) => convertToPropertyListEntry(p, response));
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

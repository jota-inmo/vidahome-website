/**
 * Inmovilla API Types
 * Based on API v1 Documentation: https://procesos.apinmo.com/api/v1/apidoc/
 */

export interface PropertyListEntry {
    cod_ofer: number;
    ref: string;
    nodisponible: boolean | number;
    prospecto: boolean;
    fechaact: string;
    // Discovered fields (calculated or fetched)
    numagencia?: string;
    numfotos?: string;
    fotoletra?: string;
    mainImage?: string;
    precioinmo?: number;
    precioalq?: number;
    calle?: string;
    descripciones?: string;
    poblacion?: string;
    keyacci?: number;
    tipo_nombre?: string;
    habitaciones?: number;
    banyos?: number;
    m_cons?: number;
}

export interface PropertyDetails {
    cod_ofer: number;
    keyacci: number;
    banyos: number;
    keycli: number;
    fecha: string;
    keyori: number;
    ref: string;
    nodisponible: boolean | number;
    prospecto?: boolean;
    precio: number;
    precioinmo: number;
    key_loca: number;
    key_zona: number;
    key_tipo: number;
    calle: string;
    planta: number;
    numero: string | number; // Changed to match real API (returned as string "6")
    m_cons?: number;
    m_utiles?: number;
    terraza?: number | boolean;
    ascensor?: number | boolean;
    piscina_com?: number | boolean;
    aire_con?: number | boolean;
    calefaccion?: number | boolean;
    garaje?: number | boolean;
    vistasalmar?: number | boolean;
    descripciones?: string;
    fotos_lista?: string[];
    mainImage?: string;
    numagencia?: string;
    numfotos?: string;
    fotoletra?: string;
    habitaciones?: number;
    fotos?: Record<string, { url: string; posicion: number }>;
    poblacion?: string;
    tipo_nombre?: string;
    // Additional fields can be added here as needed
}

export interface ApiBaseResponse<T> {
    data: T;
    status: number;
    message?: string;
}

export interface InmovillaErrorResponse {
    codigo: number;
    mensaje: string;
}

export interface PropertyFilters {
    page?: number;
    listado?: boolean;
    dateStart?: string;
    dateEnd?: string;
    // Common filters based on observation
    nodisponible?: boolean;
    prospecto?: boolean;
}

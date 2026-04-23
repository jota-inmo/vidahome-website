/**
 * Inmovilla API Types
 * Based on API v1 Documentation: https://procesos.apinmo.com/api/v1/apidoc/
 *
 * PRIVACY: street-address fields (calle, dir, numero, planta) are intentionally
 * absent from these types. `getPropertyDetailAction` strips them at runtime
 * before returning to the client. Only `poblacion` (city) and `zona` (area) are
 * public. If you need address data for an internal use case, fetch it directly
 * from the CRM, never via these public types.
 */

export interface PropertyListEntry {
    // Nullable since CRM-published rows may not have an Inmovilla cod_ofer yet.
    cod_ofer: number | null;
    ref: string;
    nodisponible: boolean | number;
    prospecto?: boolean; // Optional: from Inmovilla API only
    fechaact?: string;   // Optional: from Inmovilla API only
    // Discovered fields (calculated or fetched)
    numagencia?: string;
    numfotos?: string;
    fotoletra?: string;
    mainImage?: string;
    precioinmo?: number;
    precioalq?: number;
    descripciones?: string;
    poblacion?: string;
    keyacci?: number;
    tipo_nombre?: string;
    habitaciones?: number;
    banyos?: number;
    m_cons?: number;
    tipo?: string;
    precio?: number;
    main_photo?: string;
    habdobles?: number;
    // Extended fields from paginacion endpoint
    habitaciones_simples?: number;
    habitaciones_dobles?: number;
    outlet?: number;
    zona?: string;
    distmar?: number;
    m_utiles?: number;
    m_terraza?: number;
    m_parcela?: number;
    aseos?: number;
    ascensor?: boolean;
    aire_con?: boolean;
    calefaccion?: boolean;
    parking_tipo?: number; // 0=sin, 1=opcional, 2=incluido
    piscina_com?: boolean;
    piscina_prop?: boolean;
    diafano?: boolean;
    todoext?: boolean;
    // ISO timestamp from property_metadata.updated_at. Used for the
    // "most recent first" sort option on the catalog page.
    updated_at?: string;
}

export interface PropertyDetails {
    // Nullable since CRM-published rows may not have an Inmovilla cod_ofer yet.
    cod_ofer: number | null;
    keyacci: number;
    banyos: number;
    aseos?: number;
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
    latitud?: string | number;
    longitud?: string | number;
    all_descriptions?: Record<string, string>;
    habdobles?: number;
    // Energy Certificate (from encargos table)
    energy_label?: string | null;
    energy_consumption?: number | string | null;
    emissions_label?: string | null;
    emissions_value?: number | string | null;
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

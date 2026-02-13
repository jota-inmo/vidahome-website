/**
 * Cliente para la API del Catastro Español
 * Documentación oficial: https://www.catastro.hacienda.gob.es/ws/
 * Versión de servicios: 2.6 (actualizado 01-12-2025)
 * 
 * IMPORTANTE: Este cliente debe usarse SOLO desde el servidor (API Routes)
 * para evitar problemas de CORS.
 */

export interface CatastroAddress {
    provincia: string;
    municipio: string;
    via: string;
    numero: string;
}

export interface CatastroProperty {
    referenciaCatastral: string;
    direccion: string;
    superficie: number;
    anoConstruccion?: number;
    valorCatastral?: number;
    uso: string;
    clase: string;
    coordenadas?: {
        lat: number;
        lon: number;
    };
}

export interface CatastroSearchResult {
    found: boolean;
    properties: CatastroProperty[];
    error?: string;
}

/**
 * Cliente para consultar datos del Catastro
 * Este cliente debe usarse SOLO desde el servidor (API Routes)
 */
export class CatastroClient {
    private baseUrl = 'https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/json';

    /**
     * Obtener listado de todas las provincias
     */
    async getProvincias(): Promise<string[]> {
        try {
            const url = `${this.baseUrl}/ObtenerProvincias`;
            const response = await fetch(url);
            if (!response.ok) return [];
            const data = await response.json();
            const root = data.consulta_provincieroResult || data;
            if (root.provinciero && root.provinciero.prov) {
                const results = Array.isArray(root.provinciero.prov) ? root.provinciero.prov : [root.provinciero.prov];
                return results.map((p: any) => p.np);
            }
            return [];
        } catch (error) {
            console.error('[Catastro] Error en getProvincias:', error);
            return [];
        }
    }

    /**
     * Obtener municipios de una provincia
     */
    async getMunicipios(provincia: string, query: string = ''): Promise<string[]> {
        try {
            const params = new URLSearchParams({
                Provincia: provincia.toUpperCase(),
                Municipio: query.toUpperCase()
            });
            const url = `${this.baseUrl}/ObtenerMunicipios?${params}`;
            const response = await fetch(url);
            if (!response.ok) return [];
            const data = await response.json();
            const root = data.consulta_municipieroResult || data;
            if (root.municipiero && root.municipiero.muni) {
                const results = Array.isArray(root.municipiero.muni) ? root.municipiero.muni : [root.municipiero.muni];
                return results.map((m: any) => m.nm);
            }
            return [];
        } catch (error) {
            console.error('[Catastro] Error en getMunicipios:', error);
            return [];
        }
    }

    /**
     * Obtener vías de un municipio
     */
    async getVias(provincia: string, municipio: string, query: string): Promise<any[]> {
        try {
            const params = new URLSearchParams({
                Provincia: provincia.toUpperCase(),
                Municipio: municipio.toUpperCase(),
                NomVia: query.toUpperCase()
            });
            const url = `${this.baseUrl}/ObtenerCallejero?${params}`;
            const response = await fetch(url);
            if (!response.ok) return [];
            const data = await response.json();
            const root = data.consulta_callejeroResult || data;
            if (root.callejero && root.callejero.calle) {
                const results = Array.isArray(root.callejero.calle) ? root.callejero.calle : [root.callejero.calle];
                return results.map((c: any) => ({
                    tipo: c.dir.tv,
                    nombre: c.dir.nv,
                    label: `${c.dir.tv} ${c.dir.nv}`.trim()
                }));
            }
            return [];
        } catch (error) {
            console.error('[Catastro] Error en getVias:', error);
            return [];
        }
    }

    /**
     * Obtener números y referencias catastrales de una vía
     */
    async getNumeros(provincia: string, municipio: string, tipoVia: string, nomVia: string, numero: string = ''): Promise<any[]> {
        try {
            const params = new URLSearchParams({
                Provincia: provincia.toUpperCase(),
                Municipio: municipio.toUpperCase(),
                TipoVia: tipoVia.toUpperCase(),
                NomVia: nomVia.toUpperCase(),
                Numero: numero.toUpperCase()
            });
            const url = `${this.baseUrl}/ObtenerNumerero?${params}`;
            const response = await fetch(url);
            if (!response.ok) return [];
            const data = await response.json();
            const root = data.consulta_numereroResult || data;
            if (root.numerero && root.numerero.nump) {
                const results = Array.isArray(root.numerero.nump) ? root.numerero.nump : [root.numerero.nump];
                return results.map((n: any) => ({
                    numero: n.num.pnp,
                    duplicado: n.num.plp || '',
                    rc: `${n.pc.pc1}${n.pc.pc2}`
                }));
            }
            return [];
        } catch (error) {
            console.error('[Catastro] Error en getNumeros:', error);
            return [];
        }
    }

    /**
     * Buscar inmueble por dirección
     * Usa el servicio Consulta_DNPLOC en formato JSON
     */
    async searchByAddress(address: CatastroAddress): Promise<CatastroSearchResult> {
        try {
            // Normalizar a mayúsculas como prefiere el Catastro
            const prov = address.provincia.toUpperCase();
            const mun = address.municipio.toUpperCase();
            const via = address.via.toUpperCase();
            const num = address.numero.toUpperCase();

            const params = new URLSearchParams({
                Provincia: prov,
                Municipio: mun,
                TipoVia: 'CL', // Por defecto Calle
                NomVia: via,
                Numero: num
            });

            const url = `${this.baseUrl}/Consulta_DNPLOC?${params}`;
            console.log(`[Catastro] Buscando dirección: ${url}`);

            const response = await fetch(url);

            if (!response.ok) {
                console.error(`[Catastro] Error HTTP ${response.status}: ${response.statusText}`);
                if (response.status === 503) {
                    return {
                        found: false,
                        properties: [],
                        error: 'El servicio del Catastro no está disponible temporalmente. Inténtalo más tarde.'
                    };
                }
                throw new Error(`Catastro API error: ${response.status} ${response.statusText}`);
            }

            const text = await response.text();
            console.log(`[Catastro] Respuesta raw: ${text.substring(0, 500)}...`);

            if (text.includes('Sistema no disponible')) {
                return {
                    found: false,
                    properties: [],
                    error: 'El servicio del Catastro no está disponible temporalmente.'
                };
            }

            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('[Catastro] Error parseando JSON:', text.substring(0, 100));
                return {
                    found: false,
                    properties: [],
                    error: 'Error al procesar la respuesta del Catastro'
                };
            }

            // Desempaquetar respuesta
            const root = data.consulta_dnplocResult || data.consulta_dnp || data;

            // Verificar errores
            if (root.lerr) {
                const err = root.lerr[0];
                const msg = err.des || 'Error desconocido';
                console.warn(`[Catastro] API devolvió error: ${err.cod} - ${msg}`);

                if (err.cod === '43') {
                    return {
                        found: false,
                        properties: [],
                        error: 'No se encontró el número exacto en esa calle.'
                    };
                }

                return {
                    found: false,
                    properties: [],
                    error: `Catastro: ${msg}`
                };
            }

            // Si hay lista de inmuebles (lrcdnp)
            if (root.lrcdnp) {
                const results = Array.isArray(root.lrcdnp) ? root.lrcdnp : [root.lrcdnp];
                const properties = results.map((item: any) => this.mapJsonToProperty(item));
                console.log(`[Catastro] Encontradas ${properties.length} propiedades`);
                return {
                    found: properties.length > 0,
                    properties
                };
            }

            // Si hay un solo inmueble (bico)
            if (root.bico) {
                const bicoData = root.bico.bi || root.bico;
                const prop = this.mapJsonToProperty(bicoData);
                console.log(`[Catastro] Encontrada 1 propiedad (bico)`);
                return {
                    found: true,
                    properties: [prop]
                };
            }

            return {
                found: false,
                properties: [],
                error: 'No se encontraron resultados'
            };

        } catch (error) {
            console.error('[Catastro] Fallo en búsqueda por dirección:', error);
            return {
                found: false,
                properties: [],
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }

    /**
     * Obtener detalles de un inmueble por referencia catastral
     * Usa el servicio Consulta_DNPRC en formato JSON
     */
    async getPropertyDetails(referenciaCatastral: string): Promise<CatastroProperty | null> {
        try {
            const rc = referenciaCatastral.replace(/\s/g, '').toUpperCase();

            if (rc.length !== 14 && rc.length !== 18 && rc.length !== 20) {
                console.error(`[Catastro] RC con longitud inusual: ${rc} (longitud ${rc.length})`);
            }

            const params = new URLSearchParams({
                RefCat: rc
            });

            const url = `${this.baseUrl}/Consulta_DNPRC?${params}`;
            console.log(`[Catastro] Obteniendo detalles por RC: ${url}`);

            const response = await fetch(url);

            if (!response.ok) {
                console.error(`[Catastro] Error HTTP detalle ${response.status}: ${response.statusText}`);
                if (response.status === 503) {
                    throw new Error('El servicio del Catastro no está disponible temporalmente.');
                }
                throw new Error(`Catastro API error: ${response.status} ${response.statusText}`);
            }

            const text = await response.text();
            console.log(`[Catastro] Respuesta detalle raw: ${text.substring(0, 500)}...`);

            if (text.includes('Sistema no disponible')) {
                throw new Error('El servicio del Catastro no está disponible temporalmente.');
            }

            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('[Catastro] Error parseando JSON de detalle:', text.substring(0, 100));
                return null;
            }

            // Desempaquetar respuesta
            const root = data.consulta_dnprcResult || data.consulta_dnp || data;

            if (root.lerr) {
                const msg = root.lerr[0]?.des || 'Error desconocido';
                console.warn(`[Catastro] API detalle devolvió error: ${msg}`);
                return null;
            }

            if (root.bico) {
                const bico = root.bico;
                const item = bico.bi || (Array.isArray(bico) ? bico[0] : bico);
                return this.mapJsonToProperty(item);
            }

            if (root.lrcdnp) {
                const results = Array.isArray(root.lrcdnp) ? (root.lrcdnp.rcdnp || root.lrcdnp) : [root.lrcdnp];
                const list = Array.isArray(results) ? results : [results];
                if (list.length > 0) {
                    return this.mapJsonToProperty(list[0]);
                }
            }

            console.log('[Catastro] No se encontró información de propiedad en la respuesta (bico/lrcdnp)');
            return null;

        } catch (error) {
            console.error('[Catastro] Fallo obteniendo detalles por RC:', error);
            throw error;
        }
    }

    /**
     * Mapea la respuesta JSON compleja del Catastro a nuestra interfaz simplificada
     */
    private mapJsonToProperty(item: any): CatastroProperty {
        let rc = '';

        // Extraer Referencia Catastral
        // Caso 1: Estructura detallada idbi > rc
        if (item.idbi && item.idbi.rc) {
            const r = item.idbi.rc;
            rc = `${r.pc1}${r.pc2}${r.car}${r.cc1}${r.cc2}`;
        }
        // Caso 2: Estructura directa rc (objeto o string)
        else if (item.rc) {
            if (typeof item.rc === 'string') {
                rc = item.rc;
            } else {
                rc = `${item.rc.pc1}${item.rc.pc2}${item.rc.car}${item.rc.cc1}${item.rc.cc2}`;
            }
        }
        // Caso 3: Estructura pc (parcela catastral)
        else if (item.pc) {
            if (item.pc.pc1 && item.pc.pc2) {
                rc = `${item.pc.pc1}${item.pc.pc2}`;
            }
        }

        // Dirección
        let direccion = '';
        if (typeof item.ldt === 'string') {
            direccion = item.ldt;
        }
        // Intentar construir desde estructura (dt -> locs -> lourb)
        else if (item.dt && item.dt.locs && item.dt.locs.lourb && item.dt.locs.lourb.dir) {
            const dom = item.dt.locs.lourb.dir;
            direccion = `${dom.tv || ''} ${dom.nv || ''} ${dom.pnp || ''}`.trim();
        }
        else if (item.domicilio) {
            direccion = item.domicilio;
        }
        else {
            direccion = 'Dirección no disponible';
        }

        // Datos económicos / físicos
        let superficie = 0;
        let anoConstruccion = undefined;
        let uso = 'Desconocido';
        let valorCatastral = undefined;
        let clase = 'Urbano';

        // En detalle 'bico', datos están en 'debi'
        if (item.debi) {
            superficie = parseInt(item.debi.sfc) || 0;
            anoConstruccion = parseInt(item.debi.ant) || undefined;
            uso = item.debi.luso || 'Desconocido';
        }

        // Limpiar undefined string en RC
        rc = rc.replace(/undefined/g, '');

        return {
            referenciaCatastral: rc,
            direccion: direccion || 'Dirección no disponible',
            superficie,
            anoConstruccion,
            uso,
            clase,
            valorCatastral
        };
    }

    /**
     * Estimar valor de mercado basado en valor catastral
     * (Esta lógica se mantiene igual, es una estimación interna)
     */
    estimateMarketValue(valorCatastral: number): { min: number; max: number } {
        const COEF_MIN = 1.4;
        const COEF_MAX = 2.0;

        return {
            min: Math.round(valorCatastral * COEF_MIN),
            max: Math.round(valorCatastral * COEF_MAX)
        };
    }
}

/**
 * Factory function para crear una instancia del cliente
 */
export function createCatastroClient() {
    return new CatastroClient();
}

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
    tipoVia?: string;
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
    habitaciones?: number;
    banos?: number;
    aseos?: number;
    terraza?: boolean;
    terrazaM2?: number;
    reformado?: boolean;
    anoReforma?: number;
    ascensor?: boolean;
    piscina?: boolean;
    jardin?: boolean;
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
    private callejeroUrl = 'https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/json';
    private infoRefUrl = 'https://ovc.catastro.meh.es/OVCServWeb/OVCWcfInformacionReferencia/COVCInformacionReferencia.svc/json';

    /**
     * Obtener listado de todas las provincias
     */
    async getProvincias(): Promise<string[]> {
        try {
            const url = `${this.callejeroUrl}/ObtenerProvincias`;
            const response = await fetch(url);
            const text = await response.text();
            const data = JSON.parse(text);

            const root = data.consulta_provincieroResult || data;
            if (root.provinciero && root.provinciero.prov) {
                const results = Array.isArray(root.provinciero.prov) ? root.provinciero.prov : [root.provinciero.prov];
                return results.map((p: any) => p.np);
            }
            return [];
        } catch (error) {
            console.error('[Catastro] Error provincias:', error);
            return [];
        }
    }

    /**
     * Obtener municipios de una provincia
     */
    async getMunicipios(provincia: string): Promise<string[]> {
        try {
            const params = new URLSearchParams({
                Provincia: provincia.toUpperCase(),
                Municipio: ''
            });
            const url = `${this.callejeroUrl}/ObtenerMunicipios?${params}`;
            const response = await fetch(url);
            const text = await response.text();
            const data = JSON.parse(text);

            const root = data.consulta_municipieroResult || data;
            if (root.municipiero && root.municipiero.muni) {
                const results = Array.isArray(root.municipiero.muni) ? root.municipiero.muni : [root.municipiero.muni];
                return results.map((m: any) => m.nm);
            }
            return [];
        } catch (error) {
            console.error('[Catastro] Error municipios:', error);
            return [];
        }
    }

    /**
     * Obtener vías de un municipio
     */
    async getVias(provincia: string, municipio: string, query: string = ''): Promise<any[]> {
        try {
            const params = new URLSearchParams({
                Provincia: provincia.toUpperCase(),
                Municipio: municipio.toUpperCase(),
                TipoVia: '',
                NomVia: query.toUpperCase() // NomVia es el parámetro correcto
            });
            const url = `${this.callejeroUrl}/ObtenerCallejero?${params}`;
            const response = await fetch(url);
            const text = await response.text();
            const data = JSON.parse(text);

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
            console.error('[Catastro] Error vías:', error);
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
            const url = `${this.callejeroUrl}/ObtenerNumerero?${params}`;
            const response = await fetch(url);
            if (!response.ok) return [];
            const data = await response.json();
            const root = data.consulta_numereroResult || data;

            // Comprobar errores
            if (root.lerr) {
                const err = root.lerr?.err?.[0] || root.lerr?.[0];
                if (err) {
                    console.warn(`[Catastro] ObtenerNumerero error: ${err.cod} - ${err.des}`);
                    return [];
                }
            }

            // La respuesta puede tener nump directamente en root O dentro de root.numerero
            const numpData = root.nump || (root.numerero && root.numerero.nump);

            if (numpData) {
                const results = Array.isArray(numpData) ? numpData : [numpData];
                console.log(`[Catastro] ObtenerNumerero: ${results.length} números encontrados`);
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
            const num = address.numero.toUpperCase();

            let nomVia = address.via.toUpperCase().trim();
            let tipoVia = (address.tipoVia || '').toUpperCase().trim();

            // Si no tenemos tipoVia, intentamos extraerlo del nombre
            if (!tipoVia) {
                const commonTypes = ['CL', 'AV', 'PS', 'C/', 'AVDA', 'CTRA', 'PL'];
                for (const type of commonTypes) {
                    if (nomVia.startsWith(type + ' ')) {
                        tipoVia = type;
                        nomVia = nomVia.substring(type.length).trim();
                        break;
                    }
                }
                if (!tipoVia) tipoVia = 'CL'; // Default
            } else {
                // Si YA tenemos tipoVia, nos aseguramos de que no esté repetido en el nombre
                // Ejemplo: tipoVia="CL", nomVia="CL MAJOR" -> nomVia="MAJOR"
                const prefix = tipoVia + ' ';
                if (nomVia.startsWith(prefix)) {
                    nomVia = nomVia.substring(prefix.length).trim();
                }
            }

            const params = new URLSearchParams({
                Provincia: prov,
                Municipio: mun,
                TipoVia: tipoVia,
                NomVia: nomVia,
                Numero: num
            });

            // IMPORTANTE: Consulta_DNPLOC pertenece al servicio Callejero, NO al de InformacionReferencia
            const url = `${this.callejeroUrl}/Consulta_DNPLOC?${params}`;
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
                const err = root.lerr[0] || (root.lerr.err ? root.lerr.err[0] : null);
                if (err) {
                    const msg = err.des || 'Error desconocido';
                    console.warn(`[Catastro] API devolvió error: ${err.cod} - ${msg}`);


                    // Si el error es "43 - EL NUMERO NO EXISTE", intentamos recuperar la RC a través del callejero
                    // Esto maneja casos donde DNPLOC falla pero el número sí está registrado en la parcela.
                    if (err.cod === '43') { // Error 43: EL NUMERO NO EXISTE
                        console.log(`[Catastro] Error 43 para ${tipoVia} ${nomVia} ${num}. Intentando fallback agresivo...`);

                        try {
                            // Intento A: Número exacto con TipoVia
                            let numeros = await this.getNumeros(prov, mun, tipoVia, nomVia, num);

                            // Intento B: Número exacto SIN TipoVia (muy común que el tipo cause fallos)
                            if (numeros.length === 0 && tipoVia) {
                                console.log(`[Catastro] Fallback: Reintentando sin TipoVia...`);
                                numeros = await this.getNumeros(prov, mun, '', nomVia, num);
                            }

                            // Intento C: Número '1' como wildcard para pillar la parcela si el número exacto no está mapeado
                            if (numeros.length === 0 && num !== '1') {
                                console.log(`[Catastro] Fallback: Probando con número 1...`);
                                numeros = await this.getNumeros(prov, mun, tipoVia, nomVia, '1');
                                if (numeros.length === 0 && tipoVia) {
                                    numeros = await this.getNumeros(prov, mun, '', nomVia, '1');
                                }
                            }

                            if (numeros.length > 0) {
                                // Priorizar el que coincida en número si hemos traído varios
                                const exactMatch = numeros.find(n => String(n.numero).trim() === String(num).trim());
                                const matchToUse = exactMatch || numeros[0];

                                if (matchToUse && matchToUse.rc) {
                                    console.log(`[Catastro] Fallback exitoso. RC: ${matchToUse.rc}. Buscando inmuebles...`);
                                    return await this.searchPropertiesByRC(matchToUse.rc);
                                }
                            }
                        } catch (fbError) {
                            console.warn('[Catastro] Falló recuperación por callejero:', fbError);
                        }
                    }

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
            }

            // Si hay lista de inmuebles (lrcdnp)
            if (root.lrcdnp) {
                const results = Array.isArray(root.lrcdnp.rcdnp)
                    ? root.lrcdnp.rcdnp
                    : (root.lrcdnp.rcdnp ? [root.lrcdnp.rcdnp] : []);

                if (results.length === 0 && root.lrcdnp) {
                    // Fallback si la estructura es diferente
                    const possibleList = Array.isArray(root.lrcdnp) ? root.lrcdnp : [root.lrcdnp];
                    const properties = possibleList.map((item: any) => this.mapJsonToProperty(item));
                    return { found: properties.length > 0, properties };
                }

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
     * Buscar inmuebles por Referencia Catastral (exacta o de parcela)
     * Para RCs de parcela (14 chars) usa el endpoint SOAP XML porque el JSON no las soporta.
     * Devuelve todos los pisos/puertas con sus RCs de 20 chars para que el usuario elija.
     */
    async searchPropertiesByRC(rc: string): Promise<CatastroSearchResult> {
        try {
            const cleanRc = rc.replace(/\s/g, '').toUpperCase();

            // Si la RC tiene 20 chars, usar el endpoint JSON normal
            if (cleanRc.length === 20) {
                const params = new URLSearchParams({ RefCat: cleanRc });
                const url = `${this.infoRefUrl}/Consulta_DNPRC?${params}`;
                console.log(`[Catastro] searchPropertiesByRC (JSON, RC completa): ${url}`);
                const response = await fetch(url);
                if (!response.ok) throw new Error(`API Error ${response.status}`);
                const text = await response.text();
                let data;
                try { data = JSON.parse(text); } catch { return { found: false, properties: [] }; }
                const root = data.consulta_dnprcResult || data.consulta_dnp || data;
                if (root.lerr) {
                    const err = root.lerr[0] || (root.lerr.err ? root.lerr.err[0] : null);
                    if (err) return { found: false, properties: [], error: err.des };
                }
                const properties: CatastroProperty[] = [];
                if (root.bico) {
                    properties.push(this.mapJsonToProperty(root.bico.bi || root.bico));
                } else if (root.lrcdnp) {
                    const results = Array.isArray(root.lrcdnp.rcdnp) ? root.lrcdnp.rcdnp : (root.lrcdnp.rcdnp ? [root.lrcdnp.rcdnp] : []);
                    properties.push(...results.map((item: any) => this.mapJsonToProperty(item)));
                }
                return { found: properties.length > 0, properties };
            }

            // Para RCs de parcela (14 chars), usar el endpoint SOAP XML
            const xmlUrl = `https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/Consulta_DNPRC?Provincia=&Municipio=&RC=${cleanRc}`;
            console.log(`[Catastro] searchPropertiesByRC (XML, parcela ${cleanRc.length} chars): ${xmlUrl}`);

            const response = await fetch(xmlUrl);
            if (!response.ok) throw new Error(`API Error ${response.status}`);

            const xmlText = await response.text();
            const properties: CatastroProperty[] = [];

            // Extraer todos los bloques <rcdnp>...</rcdnp> del XML
            const rcdnpBlocks = xmlText.match(/<rcdnp>([\s\S]*?)<\/rcdnp>/g) || [];
            console.log(`[Catastro] XML: encontrados ${rcdnpBlocks.length} inmuebles en parcela`);

            for (const block of rcdnpBlocks) {
                const pc1 = this.xmlVal(block, 'pc1');
                const pc2 = this.xmlVal(block, 'pc2');
                const car = this.xmlVal(block, 'car');
                const cc1 = this.xmlVal(block, 'cc1');
                const cc2 = this.xmlVal(block, 'cc2');
                const fullRc = `${pc1}${pc2}${car}${cc1}${cc2}`;

                const tv = this.xmlVal(block, 'tv');
                const nv = this.xmlVal(block, 'nv');
                const pnp = this.xmlVal(block, 'pnp');
                const plp = this.xmlVal(block, 'plp')?.trim();
                const bq = this.xmlVal(block, 'bq');
                const es = this.xmlVal(block, 'es');
                const pt = this.xmlVal(block, 'pt');
                const pu = this.xmlVal(block, 'pu');
                const nm = this.xmlVal(block, 'nm');
                const dp = this.xmlVal(block, 'dp');

                let direccion = `${tv} ${nv} ${pnp}`;
                if (plp && plp !== ' ' && plp !== '0') direccion += ` ${plp}`;

                // Construir detalle de ubicación dentro del edificio
                const ubicacion: string[] = [];
                if (bq) ubicacion.push(`Bloque ${bq}`);
                if (es && es !== '1') ubicacion.push(`Esc. ${es}`);
                if (pt) {
                    const ptNum = parseInt(pt);
                    if (ptNum < 0) ubicacion.push(`Sótano ${pt}`);
                    else if (ptNum > 0) ubicacion.push(`Planta ${ptNum}`);
                    else if (pt === '00') ubicacion.push(`Planta Baja`);
                }
                if (pu) ubicacion.push(`Puerta ${pu}`);

                if (ubicacion.length > 0) direccion += `, ${ubicacion.join(', ')}`;
                if (dp) direccion += ` ${dp}`;
                if (nm) direccion += ` (${nm})`;

                const superficie = parseInt(this.xmlVal(block, 'sfc')) || 0;
                const uso = this.xmlVal(block, 'luso') || 'Residencial';

                properties.push({
                    referenciaCatastral: fullRc,
                    direccion: direccion.trim(),
                    superficie,
                    uso,
                    clase: 'Urbano',
                    habitaciones: 1,
                    banos: 1,
                    aseos: 0,
                    terraza: false,
                    reformado: false,
                    ascensor: false,
                    piscina: false,
                    jardin: false
                });
            }

            console.log(`[Catastro] searchPropertiesByRC: ${properties.length} inmuebles para parcela ${cleanRc}`);
            return { found: properties.length > 0, properties };

        } catch (error) {
            console.error('[Catastro] Error searchPropertiesByRC:', error);
            return { found: false, properties: [], error: error instanceof Error ? error.message : 'Error desconocido' };
        }
    }

    /** Extraer valor de una etiqueta XML simple */
    private xmlVal(xml: string, tag: string): string {
        const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
        return match ? match[1] : '';
    }

    /**
     * Obtener detalles de un inmueble por referencia catastral
     * Usa el servicio Consulta_DNPRC en formato JSON
     */
    async getPropertyDetails(referenciaCatastral: string): Promise<CatastroProperty | null> {
        try {
            const rc = referenciaCatastral.replace(/\s/g, '').toUpperCase();

            // Usar el endpoint XML que es más robusto para detalles
            const xmlUrl = `https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/Consulta_DNPRC?Provincia=&Municipio=&RC=${rc}`;
            console.log(`[Catastro] getPropertyDetails (XML): ${xmlUrl}`);

            const response = await fetch(xmlUrl);

            if (!response.ok) {
                console.error(`[Catastro] Error HTTP detalle ${response.status}: ${response.statusText}`);
                throw new Error(`Catastro API error: ${response.status}`);
            }

            const xmlText = await response.text();

            // Si el XML indica error
            if (xmlText.includes('<lerr>')) {
                const cod = this.xmlVal(xmlText, 'cod');
                const des = this.xmlVal(xmlText, 'des');
                console.warn(`[Catastro] API detalle devolvió error XML: ${cod} - ${des}`);
                return null;
            }

            // Extraer bloque bico
            const bicoMatch = xmlText.match(/<bico>([\s\S]*?)<\/bico>/);
            if (!bicoMatch) {
                console.warn('[Catastro] No se encontró bloque <bico> en la respuesta XML');
                return null;
            }
            const bico = bicoMatch[1];

            // Extraer datos básicos
            const direccion = this.xmlVal(bico, 'ldt') || 'Dirección no disponible';
            const superficie = parseInt(this.xmlVal(bico, 'sfc')) || 0;
            const anoConstruccion = parseInt(this.xmlVal(bico, 'ant')) || undefined;
            const uso = this.xmlVal(bico, 'luso') || 'Residencial';

            // Valor catastral (difícil de obtener por API pública, pero lo intentamos por si acaso)
            let valorCatastral = undefined;
            const vcat = this.xmlVal(bico, 'vcat');
            if (vcat) {
                valorCatastral = parseFloat(vcat.replace(',', '.')) || undefined;
            }

            return {
                referenciaCatastral: rc,
                direccion: direccion.trim(),
                superficie,
                anoConstruccion,
                uso,
                clase: 'Urbano',
                valorCatastral,
                habitaciones: 1,
                banos: 1,
                aseos: 0,
                terraza: false,
                reformado: false,
                ascensor: false,
                piscina: false,
                jardin: false
            };

        } catch (error) {
            console.error('[Catastro] Error en getPropertyDetails:', error);
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
        let clase = item.debi?.cl || 'Urbano';

        // En detalle 'bico', datos están en 'debi'
        if (item.debi) {
            superficie = parseInt(item.debi.sfc) || 0;
            anoConstruccion = parseInt(item.debi.ant) || undefined;
            uso = item.debi.luso || 'Desconocido';

            // Valor catastral: vcat puede venir como string "12345,67"
            if (item.debi.vcat) {
                const vStr = String(item.debi.vcat).replace(',', '.');
                valorCatastral = parseFloat(vStr) || undefined;
            }
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
            valorCatastral,
            habitaciones: 1,
            banos: 1,
            aseos: 0,
            terraza: false,
            reformado: false,
            ascensor: false,
            piscina: false,
            jardin: false
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

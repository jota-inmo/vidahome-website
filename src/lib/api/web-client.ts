/**
 * Inmovilla Web API Client
 * 
 * This client uses the official Inmovilla Web API (apiweb.inmovilla.com)
 * which has no rate limits and is more stable than the REST API.
 * 
 * Security validations implemented as per Inmovilla recommendations:
 * - Numeric validation for key fields (zona, ciudad, tipo, operación)
 * - SQL injection prevention for text fields
 * - Input sanitization
 * 
 * Static IP Support (Arsys Proxy):
 * - Supports routing through Arsys server with static IP
 * - Set ARSYS_PROXY_URL and ARSYS_PROXY_SECRET in environment
 */

interface WebApiConfig {
    numagencia: string;
    password: string;
    idioma: number; // 1 = Spanish, 2 = Valencian, etc.
    addnumagencia?: string; // Optional suffix for multi-agency
    ip?: string; // Client IP
    domain?: string; // Authorized domain
}

interface ProcessRequest {
    tipo: string;
    posinicial: string | number;
    numelementos: string | number;
    where: string;
    orden: string;
}

export class InmovillaWebClient {
    private config: WebApiConfig;
    private baseUrl = 'https://apiweb.inmovilla.com/apiweb/apiweb.php';
    private requests: ProcessRequest[] = [];

    constructor(config: WebApiConfig) {
        this.config = {
            ...config,
            addnumagencia: config.addnumagencia || '',
            ip: config.ip || '127.0.0.1',
            domain: config.domain || 'vidahome.es'
        };
    }

    /**
     * Security: Validate that an Agency ID or Branch is valid (alphanumeric + underscore)
     */
    private validateAgencyId(value: any, fieldName: string): string {
        const strValue = String(value).trim();
        if (!strValue) return '';

        // Allow numbers, letters and underscores (needed for some special Inmovilla accounts)
        const isValid = /^[0-9a-zA-Z_]+$/.test(strValue);

        if (!isValid) {
            console.error(`[InmovillaWebClient] Security Block: Invalid agency ID format for ${fieldName}: ${value}`);
            throw new Error(`Security Validation Error: Invalid agency ID format for ${fieldName}`);
        }
        return strValue;
    }

    private validateNumeric(value: any, fieldName: string): string {
        const strValue = String(value).trim();
        if (!strValue) return '0';

        // Check if it's a single number or a comma-separated list of numbers
        const parts = strValue.split(',');
        const isValid = parts.every(part => {
            const trimmed = part.trim();
            // Allow numbers with leading zeros (common in some IDs) but ensure they are numeric
            return trimmed !== '' && !isNaN(Number(trimmed)) && Number.isFinite(Number(trimmed));
        });

        if (!isValid) {
            console.error(`[InmovillaWebClient] Security Block: Invalid numeric value for ${fieldName}: ${value}`);
            throw new Error(`Security Validation Error: Invalid numeric value for ${fieldName}`);
        }
        return strValue;
    }

    /**
     * Security: Sanitize text input to prevent SQL injection and malicious code
     * Checks for SQL commands, length, nested parentheses, and quotes as requested.
     */
    private sanitizeText(text: string): string {
        if (!text) return '';

        let sanitized = text.trim();

        // 1. Length validation
        if (sanitized.length > 200) {
            sanitized = sanitized.substring(0, 200);
        }

        // 2. SQL Command validation (Case-insensitive)
        const forbiddenCommands = [
            'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE',
            'ALTER', 'EXEC', 'EXECUTE', 'UNION', 'OR 1=1', 'AND 1=1'
        ];

        const hasForbidden = forbiddenCommands.some(cmd =>
            new RegExp(`\\b${cmd}\\b`, 'gi').test(sanitized)
        );

        // 3. Nested parentheses and multiple quotes validation
        const hasNestedParens = /\([^)]*\([^)]*\)/.test(sanitized);
        const hasSuspiciousQuotes = /(['"])[^'"]*\1/.test(sanitized) || /['"]/.test(sanitized);
        const hasDangerousChars = /[;\\*]/.test(sanitized);

        if (hasForbidden || hasNestedParens || hasSuspiciousQuotes || hasDangerousChars) {
            console.error(`[InmovillaWebClient] Security Block: Malicious pattern detected in text: "${sanitized}"`);
            throw new Error('Security Validation Error: Potential malicious code detected in input');
        }

        return sanitized;
    }

    /**
     * Add a process request to the queue
     */
    public addProcess(
        tipo: string,
        posinicial: string | number,
        numelementos: string | number,
        where: string = '',
        orden: string = ''
    ): void {
        // Validate basic numeric parameters (returns a string but we accept both for internal consistency)
        const vPos = this.validateNumeric(posinicial, 'posinicial');
        const vNum = this.validateNumeric(numelementos, 'numelementos');

        // Sanitize where and orden clauses
        const sanitizedWhere = where ? this.sanitizeText(where) : '';
        const sanitizedOrden = orden ? this.sanitizeText(orden) : '';

        this.requests.push({
            tipo,
            posinicial: vPos,
            numelementos: vNum,
            where: sanitizedWhere,
            orden: sanitizedOrden
        });
    }

    /**
     * Build the parameter string for the API
     * Conforms to PHP: $texto = "$numagencia$addnumagencia;$password;$idioma;lostipos";
     * followed by processes: ";$tipo;$posinicial;$numelementos;$where;$orden"
     */
    private buildParamString(): string {
        const { numagencia, addnumagencia, password, idioma } = this.config;

        // Security: Validate agency IDs before building the string
        const vAgencia = this.validateAgencyId(numagencia, 'numagencia');
        const vAddAgencia = this.validateAgencyId(addnumagencia, 'addnumagencia');

        let texto = `${vAgencia}${vAddAgencia};${password};${idioma};lostipos`;

        for (const req of this.requests) {
            // Semicolon separated values for each process
            texto += `;${req.tipo};${req.posinicial};${req.numelementos};${req.where};${req.orden}`;
        }

        return texto;
    }

    /**
     * Execute all queued requests and get data
     */
    public async execute<T = any>(json: boolean = true): Promise<T> {
        if (this.requests.length === 0) {
            return {} as T;
        }

        const paramString = this.buildParamString();
        const clientIp = this.config.ip || '127.0.0.1';
        const domain = this.config.domain || 'vidahome.es';

        /**
         * IMPORTANT: Inmovilla's legacy API is extremely sensitive to encoding.
         * We use manual construction to ensure RFC 3986 (rawurlencode) behavior:
         * - Spaces must be %20, not +
         * - Semicolons and other chars must be percent-encoded
         */
        const encode = (str: string) => encodeURIComponent(str).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

        const bodyParts = [
            `param=${encode(paramString)}`,
            `elDominio=${encode(domain)}`,
            `ia=${encode(clientIp)}`,
            `laIP=${encode(clientIp)}`,
            `json=${json ? '1' : '0'}`
        ];

        const body = bodyParts.join('&');

        // Check if Arsys proxy is configured
        const arsysProxyUrl = process.env.ARSYS_PROXY_URL;
        const arsysProxySecret = process.env.ARSYS_PROXY_SECRET;
        const useArsysProxy = arsysProxyUrl && arsysProxySecret;

        try {
            let response: Response;

            if (useArsysProxy) {
                // Route through Arsys proxy with static IP
                console.log('[InmovillaWebClient] Using Arsys proxy with static IP');
                response = await fetch(arsysProxyUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Proxy-Secret': arsysProxySecret
                    },
                    body: JSON.stringify({ body })
                });
            } else {
                // Direct call to Inmovilla (will use Vercel's dynamic IP)
                response = await fetch(this.baseUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        // Precision User-Agent from Inmovilla PHP sample
                        'User-Agent': 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.3) Gecko/20070309 Firefox/2.0.0.3'
                    },
                    body: body
                });
            }

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            const text = await response.text();

            if (json) {
                try {
                    const data = JSON.parse(text);
                    // Clear requests after successful execution
                    this.requests = [];
                    return data;
                } catch (e) {
                    // Diagnostic check for Inmovilla specific IP/Domain errors
                    if (text.includes('IP NO VALIDADA')) {
                        console.error('[InmovillaWebClient] Authorization Error:', text);
                        const ipMatch = text.match(/IP_RECIVED:\s*([0-9.]+)/);
                        const receivedIp = ipMatch ? ipMatch[1] : 'unknown';
                        throw new Error(
                            `Inmovilla API: IP no autorizada. ` +
                            `IP recibida: ${receivedIp}. ` +
                            (useArsysProxy
                                ? `Verifica que la IP de tu servidor Arsys esté autorizada en Inmovilla.`
                                : `Considera usar el proxy de Arsys con IP estática. Ver docs/ARSYS_PROXY_SETUP.md`)
                        );
                    }
                    if (text.includes('DOMINIO NO VALIDADO')) {
                        throw new Error(`Inmovilla API: Dominio (${domain}) no autorizado.`);
                    }

                    console.error('[InmovillaWebClient] JSON Parse error. Raw response:', text);
                    if (text.includes('NECESITAMO') || text.includes('ERROR')) {
                        throw new Error(`Inmovilla API Error: ${text}`);
                    }
                    throw new Error(`Invalid JSON response from API: ${text.substring(0, 100)}...`);
                }
            }

            // Clear requests after execution
            this.requests = [];
            return text as unknown as T;
        } catch (error) {
            // Clear requests on error too
            this.requests = [];
            throw error;
        }
    }

    /**
     * Convenience method: Get all property types
     */
    public async getPropertyTypes() {
        this.addProcess('tipos', 1, 100, '', '');
        return this.execute();
    }

    /**
     * Convenience method: Get all cities
     */
    public async getCities() {
        this.addProcess('ciudades', 1, 100, '', '');
        return this.execute();
    }

    /**
     * Convenience method: Get zones for a city
     */
    public async getZones(cityKey: number) {
        const validatedKey = this.validateNumeric(cityKey, 'cityKey');
        this.addProcess('zonas', 1, 100, `key_loca=${validatedKey}`, '');
        return this.execute();
    }

    /**
     * Convenience method: Get featured properties
     */
    public async getFeaturedProperties(limit: number = 20) {
        this.addProcess('destacados', 1, limit, '', 'precioinmo, precioalq');
        return this.execute();
    }

    /**
     * Convenience method: Get property details by ID
     */
    public async getPropertyDetails(codOfer: number) {
        const validatedId = this.validateNumeric(codOfer, 'codOfer');
        this.addProcess('ficha', 1, 1, `ofertas.cod_ofer=${validatedId}`, '');
        return this.execute();
    }

    /**
     * Convenience method: Get paginated properties with filters
     */
    public async getProperties(
        page: number = 1,
        pageSize: number = 20,
        where: string = '',
        orderBy: string = 'precioinmo, precioalq'
    ) {
        const validatedPage = this.validateNumeric(page, 'page');
        const validatedPageSize = this.validateNumeric(pageSize, 'pageSize');

        this.addProcess('paginacion', validatedPage, validatedPageSize, where, orderBy);
        return this.execute();
    }
}

/**
 * Factory function to create a Web API client
 */
export function createInmovillaWebClient(config: WebApiConfig): InmovillaWebClient {
    return new InmovillaWebClient(config);
}

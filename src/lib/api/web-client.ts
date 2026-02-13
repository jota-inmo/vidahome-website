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
 */

interface WebApiConfig {
    numagencia: string;
    password: string;
    idioma: number; // 1 = Spanish, 2 = Valencian, etc.
    addnumagencia?: string; // Optional suffix for multi-agency
}

interface ProcessRequest {
    tipo: string;
    posinicial: number;
    numelementos: number;
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
            addnumagencia: config.addnumagencia || ''
        };
    }

    /**
     * Security: Validate that a value is numeric
     */
    private validateNumeric(value: any, fieldName: string): number {
        const num = Number(value);
        if (isNaN(num) || !Number.isInteger(num)) {
            throw new Error(`Invalid numeric value for ${fieldName}: ${value}`);
        }
        return num;
    }

    /**
     * Security: Sanitize text input to prevent SQL injection
     */
    private sanitizeText(text: string): string {
        if (!text) return '';

        // Remove SQL keywords and dangerous characters
        const dangerous = [
            'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE',
            'ALTER', 'EXEC', 'EXECUTE', 'SCRIPT', '--', ';--', '/*', '*/',
            'xp_', 'sp_', 'UNION', 'OR 1=1', 'AND 1=1'
        ];

        let sanitized = text;
        dangerous.forEach(keyword => {
            const regex = new RegExp(keyword, 'gi');
            sanitized = sanitized.replace(regex, '');
        });

        // Limit length
        if (sanitized.length > 200) {
            sanitized = sanitized.substring(0, 200);
        }

        // Check for nested parentheses or quotes
        const nestedParens = /\([^)]*\([^)]*\)/;
        const multipleQuotes = /(['"])[^'"]*\1[^'"]*\1/;

        if (nestedParens.test(sanitized) || multipleQuotes.test(sanitized)) {
            throw new Error('Invalid text format: nested structures detected');
        }

        return sanitized.trim();
    }

    /**
     * Add a process request to the queue
     */
    public addProcess(
        tipo: string,
        posinicial: number,
        numelementos: number,
        where: string = '',
        orden: string = ''
    ): void {
        // Validate numeric parameters
        this.validateNumeric(posinicial, 'posinicial');
        this.validateNumeric(numelementos, 'numelementos');

        // Sanitize where clause if it contains text
        const sanitizedWhere = where ? this.sanitizeText(where) : '';

        this.requests.push({
            tipo,
            posinicial,
            numelementos,
            where: sanitizedWhere,
            orden
        });
    }

    /**
     * Build the parameter string for the API
     */
    private buildParamString(): string {
        const { numagencia, addnumagencia, password, idioma } = this.config;

        let texto = `${numagencia}${addnumagencia};${password};${idioma};lostipos`;

        for (const req of this.requests) {
            texto += `;${req.tipo};${req.posinicial};${req.numelementos};${req.where};${req.orden}`;
        }

        return texto;
    }

    /**
     * Execute all queued requests and get data
     */
    public async execute<T = any>(json: boolean = true): Promise<T> {
        const paramString = this.buildParamString();
        const encodedParam = encodeURIComponent(paramString);

        const domain = typeof window !== 'undefined'
            ? window.location.hostname
            : 'vidahome.es';

        const body = new URLSearchParams({
            param: encodedParam,
            elDominio: domain,
            ...(json && { json: '1' })
        });

        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: body.toString()
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            const data = json ? await response.json() : await response.text();

            // Clear requests after execution
            this.requests = [];

            return data;
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

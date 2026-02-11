import { InmovillaApiError, AuthenticationError, RateLimitError } from './error';

interface ClientConfig {
    baseUrl?: string;
    token: string;
    authType?: 'Token' | 'Bearer';
}

/**
 * Senior-level API Client for Inmovilla
 */
export class InmovillaClient {
    private baseUrl: string;
    private token: string;
    private authType: 'Token' | 'Bearer';

    constructor(config: ClientConfig) {
        this.baseUrl = config.baseUrl || 'https://procesos.inmovilla.com/api/v1';
        this.token = config.token;
        this.authType = config.authType || 'Bearer'; // Defaults to requested Bearer
    }

    /**
     * Core request method with error handling and interceptor-like logic
     */
    protected async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

        const headers = new Headers(options.headers);
        headers.set('Content-Type', 'application/json');
        headers.set('Accept', 'application/json');

        // Handle authentication based on config
        if (this.authType === 'Bearer') {
            headers.set('Authorization', `Bearer ${this.token}`);
        } else {
            headers.set('Token', this.token);
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });

            const data = await this.parseResponse(response);

            if (!response.ok) {
                this.handleErrorResponse(response.status, data);
            }

            return data as T;
        } catch (error) {
            if (error instanceof InmovillaApiError) throw error;

            // Handle network or unexpected errors
            throw new InmovillaApiError(
                error instanceof Error ? error.message : 'Network request failed',
                500
            );
        }
    }

    private async parseResponse(response: Response) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return response.json();
        }
        return response.text();
    }

    private handleErrorResponse(status: number, data: any): never {
        if (status === 401) throw new AuthenticationError();
        if (status === 429) throw new RateLimitError();

        throw InmovillaApiError.fromResponse(status, data);
    }

    // GET helper
    protected get<T>(endpoint: string, params?: Record<string, any>) {
        const query = params
            ? `?${new URLSearchParams(
                Object.entries(params).filter(([_, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
            ).toString()}`
            : '';
        return this.request<T>(`${endpoint}${query}`, { method: 'GET' });
    }

    // POST helper
    public post<T>(endpoint: string, body: any) {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    }
}

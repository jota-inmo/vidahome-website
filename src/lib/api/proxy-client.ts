/**
 * Proxy Client for Static IP
 * 
 * This client routes Inmovilla API requests through a static IP proxy
 * to avoid Vercel's dynamic IP issues.
 * 
 * Supported Proxies:
 * - QuotaGuard Static (recommended)
 * - Fixie
 * - Custom HTTP/HTTPS proxy
 */

import { HttpsProxyAgent } from 'https-proxy-agent';

interface ProxyConfig {
    enabled: boolean;
    url?: string; // Format: http://username:password@proxy-host:port
}

/**
 * Get proxy configuration from environment
 */
export function getProxyConfig(): ProxyConfig {
    const proxyUrl = process.env.QUOTAGUARD_URL || process.env.FIXIE_URL || process.env.HTTPS_PROXY;

    return {
        enabled: !!proxyUrl && process.env.USE_STATIC_IP_PROXY === 'true',
        url: proxyUrl
    };
}

/**
 * Create a fetch function that uses the proxy if configured
 */
export function createProxyFetch() {
    const proxyConfig = getProxyConfig();

    if (!proxyConfig.enabled || !proxyConfig.url) {
        // No proxy configured, use standard fetch
        return fetch;
    }

    // Create proxy agent
    const agent = new HttpsProxyAgent(proxyConfig.url);

    // Return a custom fetch function that uses the proxy
    return async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
        const fetchOptions: RequestInit = {
            ...init,
            // @ts-ignore - Node.js specific agent option
            agent: agent
        };

        console.log(`[Proxy] Routing request through static IP proxy: ${proxyConfig.url?.split('@')[1]}`);

        return fetch(url, fetchOptions);
    };
}

/**
 * Get the static IP that will be used (for documentation)
 */
export async function getStaticIP(): Promise<string | null> {
    const proxyConfig = getProxyConfig();

    if (!proxyConfig.enabled) {
        return null;
    }

    try {
        const proxyFetch = createProxyFetch();
        const response = await proxyFetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error('[Proxy] Failed to get static IP:', error);
        return null;
    }
}

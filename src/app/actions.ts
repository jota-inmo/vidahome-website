'use server';

import { createInmovillaApi } from '@/lib/api/properties';
import { PropertyListEntry, PropertyDetails } from '@/types/inmovilla';
import { apiCache } from '@/lib/api/cache';
import { cookies, headers } from 'next/headers';

export async function fetchPropertiesAction(): Promise<{
    success: boolean;
    data?: PropertyListEntry[];
    error?: string;
    isConfigured: boolean;
    meta?: { populations: string[] };
}> {
    const token = process.env.INMOVILLA_TOKEN;
    const numagencia = process.env.INMOVILLA_AGENCIA;
    const addnumagencia = process.env.INMOVILLA_ADDAGENCIA || '';
    const password = process.env.INMOVILLA_PASSWORD;
    const domain = process.env.INMOVILLA_DOMAIN || 'vidahome.es';

    // Get client IP for Inmovilla security check
    const headerList = await headers();
    let clientIp = headerList.get('x-forwarded-for')?.split(',')[0] || headerList.get('x-real-ip') || '127.0.0.1';

    // Fallback for local development: Inmovilla rejects 127.0.0.1
    if (clientIp === '127.0.0.1' || clientIp === '::1') {
        try {
            const ipRes = await fetch('https://api.ipify.org?format=json');
            if (ipRes.ok) {
                const ipData = await ipRes.json();
                clientIp = ipData.ip;
                console.log(`[Actions] Local IP detected. Using public IP fallback: ${clientIp}`);
            }
        } catch (e) {
            console.warn('[Actions] Failed to fetch public IP fallback', e);
        }
    }

    // We prioritize Web API as it has no rate limits and is more stable
    const isConfigured = !!(numagencia && password) || (!!token && token !== 'your_token_here');

    if (!isConfigured) {
        return {
            success: false,
            isConfigured: false,
            error: 'Credenciales de Inmovilla no configuradas.'
        };
    }

    const cacheKey = 'property_list_v2';
    let properties = apiCache.get<PropertyListEntry[]>(cacheKey);

    try {
        if (!properties) {
            console.log(`[Actions] Cache miss: Fetching from Web API (IP: ${clientIp})...`);

            const { InmovillaWebApiService } = await import('@/lib/api/web-service');
            const api = new InmovillaWebApiService(numagencia!, password!, addnumagencia, 1, clientIp, domain);

            // Get properties (100 at a time)
            properties = await api.getProperties({ page: 1 });

            if (properties && properties.length > 0) {
                // Filter: only active, available, and non-prospect
                properties = properties.filter(p => !p.nodisponible && !p.prospecto);
                apiCache.set(cacheKey, properties, 1200); // 20 min cache
            }
        } else {
            console.log('[Actions] Cache hit: Returning from cache.');
        }

        // Extract unique populations for filters
        const populations = [...new Set((properties || []).map(p => p.poblacion).filter(Boolean))].sort() as string[];

        return {
            success: true,
            data: properties || [],
            isConfigured: true,
            meta: { populations }
        };
    } catch (error: any) {
        console.error('[Actions] fetchProperties Error:', error);
        return {
            success: false,
            isConfigured: true,
            error: error.message || 'Error al conectar con Inmovilla'
        };
    }
}

export async function getPropertyDetailAction(id: number): Promise<{ success: boolean; data?: PropertyDetails; error?: string }> {
    const numagencia = process.env.INMOVILLA_AGENCIA;
    const addnumagencia = process.env.INMOVILLA_ADDAGENCIA || '';
    const password = process.env.INMOVILLA_PASSWORD;
    const domain = process.env.INMOVILLA_DOMAIN || 'vidahome.es';

    if (!numagencia || !password) return { success: false, error: 'Credenciales no configuradas' };

    // Check individual cache
    const cacheKey = `prop_detail_${id}`;
    const cachedDetail = apiCache.get<PropertyDetails>(cacheKey);
    if (cachedDetail) {
        return { success: true, data: cachedDetail };
    }

    // Get client IP for Inmovilla security check
    const headerList = await headers();
    let clientIp = headerList.get('x-forwarded-for')?.split(',')[0] || headerList.get('x-real-ip') || '127.0.0.1';

    // Fallback for local development: Inmovilla rejects 127.0.0.1
    if (clientIp === '127.0.0.1' || clientIp === '::1') {
        try {
            const ipRes = await fetch('https://api.ipify.org?format=json');
            if (ipRes.ok) {
                const ipData = await ipRes.json();
                clientIp = ipData.ip;
            }
        } catch (e) { }
    }

    try {
        const { InmovillaWebApiService } = await import('@/lib/api/web-service');
        const api = new InmovillaWebApiService(numagencia, password, addnumagencia, 1, clientIp, domain);
        const details = await api.getPropertyDetails(id);

        // Resolve population name (adapter already does basic, but let's ensure)
        if (details.key_loca && !details.poblacion) {
            try {
                const localidadMap = require('@/lib/api/localidades_map.json');
                details.poblacion = localidadMap[details.key_loca] || '';
            } catch (e) { }
        }

        // Save to cache
        apiCache.set(cacheKey, details);

        return { success: true, data: details };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function submitLeadAction(formData: {
    nombre: string;
    apellidos: string;
    email: string;
    telefono: string;
    mensaje: string;
    cod_ofer: number;
}) {
    const token = process.env.INMOVILLA_TOKEN;
    const authType = (process.env.INMOVILLA_AUTH_TYPE as 'Token' | 'Bearer') || 'Bearer';

    try {
        // 1. Send to Inmovilla
        const api = createInmovillaApi(token!, authType);
        await api.createClient({
            nombre: formData.nombre,
            // Fallback: Append message to make sure it's seen
            apellidos: `${formData.apellidos} -- Mensaje: ${formData.mensaje.substring(0, 100)}`,
            email: formData.email,
            telefono1: formData.telefono,
            ...(formData.cod_ofer > 0 ? { cod_ofer: formData.cod_ofer } : {})
        });

        // 2. Save to Supabase (Backup) - Non-blocking
        try {
            const { supabase } = await import('@/lib/supabase');
            if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
                await supabase.from('leads').insert([
                    {
                        ...formData,
                        created_at: new Date().toISOString()
                    }
                ]);
            }
        } catch (supaError) {
            console.warn('Supabase backup failed (non-critical):', supaError);
        }

        return { success: true };
    } catch (error: any) {
        console.error('Lead Submission Error:', error);
        return { success: false, error: error.message };
    }
}

export async function getFeaturedPropertiesAction(): Promise<number[]> {
    return apiCache.get<number[]>('featured_properties_ids') || [];
}

export async function updateFeaturedPropertiesAction(ids: number[]) {
    apiCache.set('featured_properties_ids', ids.slice(0, 6));
    // Clear main list cache to reflect changes if needed
    apiCache.remove('property_list_main');
    return { success: true };
}

export async function loginAction(password: string) {
    const adminPass = process.env.ADMIN_PASSWORD || 'VID@home0720';
    if (password.trim() === adminPass.trim()) {
        (await cookies()).set('admin_session', 'active', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 // 1 day
        });
        return { success: true };
    }
    return { success: false, error: 'Contraseña incorrecta' };
}

export async function logoutAction() {
    (await cookies()).delete('admin_session');
    return { success: true };
}

export async function checkAuthAction() {
    const session = (await cookies()).get('admin_session');
    return !!session;
}

// Catastro Actions
export async function getCatastroProvinciasAction(): Promise<string[]> {
    try {
        const { CatastroClient } = await import('@/lib/api/catastro');
        const client = new CatastroClient();
        return await client.getProvincias();
    } catch (error) {
        console.error('Error fetching provincias:', error);
        return ['VALENCIA', 'ALICANTE', 'CASTELLON']; // Fallback básico
    }
}

export async function getCatastroMunicipiosAction(provincia: string): Promise<string[]> {
    try {
        const { CatastroClient } = await import('@/lib/api/catastro');
        const client = new CatastroClient();
        return await client.getMunicipios(provincia);
    } catch (error) {
        console.error('Error fetching municipios:', error);
        return [];
    }
}


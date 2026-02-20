'use server';

import { createInmovillaApi } from '@/lib/api/properties';
import { PropertyListEntry, PropertyDetails } from '@/types/inmovilla';
import { apiCache, withNextCache } from '@/lib/api/cache';
import { headers } from 'next/headers';
import { revalidateTag } from 'next/cache';

// ─── Función interna cacheada con Next.js Data Cache ─────────────────────────
const _fetchPropertiesFromApi = withNextCache(
    'inmovilla_property_list',
    async (numagencia: string, password: string, addnumagencia: string, clientIp: string, domain: string): Promise<PropertyListEntry[]> => {
        console.log(`[Actions] Next.js Cache miss: Fetching from Web API (IP: ${clientIp})...`);
        const { InmovillaWebApiService } = await import('@/lib/api/web-service');
        const api = new InmovillaWebApiService(numagencia, password, addnumagencia, 1, clientIp, domain);
        const properties: PropertyListEntry[] = await api.getProperties({ page: 1 });

        if (!properties || properties.length === 0) return [];

        return properties
            .filter(p =>
                !p.nodisponible &&
                !p.prospecto &&
                !isNaN(p.cod_ofer) &&
                p.ref &&
                p.ref.trim() !== ''
            )
            .sort((a, b) => b.cod_ofer - a.cod_ofer);
    },
    { revalidate: 1200, tags: ['inmovilla_property_list'] } // 20 minutos
);

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

    const headerList = await headers();
    let clientIp = headerList.get('x-forwarded-for')?.split(',')[0] || headerList.get('x-real-ip') || '127.0.0.1';

    if (clientIp === '127.0.0.1' || clientIp === '::1') {
        try {
            const ipRes = await fetch('https://api.ipify.org?format=json');
            if (ipRes.ok) {
                const ipData = await ipRes.json();
                clientIp = ipData.ip;
            }
        } catch (e) {
            console.warn('[Inmovilla Action] Fallback IP fetch failed:', e);
        }
    }

    const isConfigured = !!(numagencia && password) || (!!token && token !== 'your_token_here');

    if (!isConfigured) {
        return { success: false, isConfigured: false, error: 'Credenciales de Inmovilla no configuradas.' };
    }

    try {
        const properties = await _fetchPropertiesFromApi(numagencia!, password!, addnumagencia, clientIp, domain);
        const populations = [...new Set(properties.map(p => p.poblacion).filter(Boolean))].sort() as string[];

        return { success: true, data: properties, isConfigured: true, meta: { populations } };
    } catch (error: any) {
        console.error('[Actions] fetchProperties Error:', error);
        return { success: false, isConfigured: true, error: error.message || 'Error al conectar con Inmovilla' };
    }
}

export async function getPropertyDetailAction(id: number): Promise<{ success: boolean; data?: PropertyDetails; error?: string }> {
    const numagencia = process.env.INMOVILLA_AGENCIA;
    const addnumagencia = process.env.INMOVILLA_ADDAGENCIA || '';
    const password = process.env.INMOVILLA_PASSWORD;
    const domain = process.env.INMOVILLA_DOMAIN || 'vidahome.es';

    if (!numagencia || !password) return { success: false, error: 'Credenciales no configuradas' };

    const cacheKey = `prop_detail_v9_${id}`;
    const cachedDetail = apiCache.get<PropertyDetails>(cacheKey);
    if (cachedDetail) return { success: true, data: cachedDetail };

    const headerList = await headers();
    let clientIp = headerList.get('x-forwarded-for')?.split(',')[0] || headerList.get('x-real-ip') || '127.0.0.1';

    if (clientIp === '127.0.0.1' || clientIp === '::1') {
        try {
            const ipRes = await fetch('https://api.ipify.org?format=json');
            if (ipRes.ok) {
                const ipData = await ipRes.json();
                clientIp = ipData.ip;
            }
        } catch (e) {
            console.warn('[Inmovilla Action] Fallback IP fetch failed for details:', e);
        }
    }

    try {
        const { InmovillaWebApiService } = await import('@/lib/api/web-service');
        const api = new InmovillaWebApiService(numagencia, password, addnumagencia, 1, clientIp, domain);
        const details = await api.getPropertyDetails(id);

        if (!details) return { success: false, error: 'La propiedad solicitada no está disponible actualmente' };

        apiCache.set(cacheKey, details);
        return { success: true, data: details };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

import { checkRateLimit } from '@/lib/rate-limit';

export async function submitLeadAction(formData: {
    nombre: string;
    apellidos: string;
    email: string;
    telefono: string;
    mensaje: string;
    cod_ofer: number;
}) {
    // ─── Rate Limiting ──────────────────────────────────────────────────────────
    const rate = await checkRateLimit({
        key: 'submit_lead',
        limit: 3,         // 3 envíos
        windowMs: 3600000 // por hora
    });

    if (!rate.success) {
        return {
            success: false,
            error: 'Has superado el límite de envíos permitidos por hora. Por favor, inténtalo más tarde o llámanos directamente.'
        };
    }

    const token = process.env.INMOVILLA_TOKEN;

    const authType = (process.env.INMOVILLA_AUTH_TYPE as 'Token' | 'Bearer') || 'Bearer';

    try {
        const api = createInmovillaApi(token!, authType);
        await api.createClient({
            nombre: formData.nombre,
            apellidos: `${formData.apellidos} -- Mensaje: ${formData.mensaje.substring(0, 100)}`,
            email: formData.email,
            telefono1: formData.telefono,
            ...(formData.cod_ofer > 0 ? { cod_ofer: formData.cod_ofer } : {})
        });

        try {
            const { supabase } = await import('@/lib/supabase');
            if (process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)) {
                await supabase.from('leads').insert([{
                    ...formData,
                    created_at: new Date().toISOString()
                }]);
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
    try {
        const { supabase } = await import('@/lib/supabase');
        const { data, error } = await supabase
            .from('featured_properties')
            .select('cod_ofer')
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data.map(item => item.cod_ofer);
    } catch (e) {
        console.error('Error fetching featured properties from Supabase:', e);
        return [];
    }
}

export async function getFeaturedPropertiesWithDetailsAction(): Promise<{ success: boolean; data: any[] }> {
    const featuredIds = await getFeaturedPropertiesAction();

    if (featuredIds.length === 0) return { success: true, data: [] };

    try {
        const detailPromises = featuredIds.map((id: number) => getPropertyDetailAction(id));
        const results = await Promise.all(detailPromises);

        const validDetails = results
            .filter(res => res.success && res.data)
            .map(res => res.data);

        return { success: true, data: validDetails };
    } catch (error) {
        console.error('Error enriching featured properties:', error);
        return { success: false, data: [] };
    }
}

export async function updateFeaturedPropertiesAction(ids: number[]) {
    try {
        const { supabaseAdmin } = await import('@/lib/supabase-admin');

        const { error: deleteError } = await supabaseAdmin.from('featured_properties').delete().neq('id', 0);
        if (deleteError) throw deleteError;

        if (ids.length > 0) {
            const inserts = ids.map(id => ({ cod_ofer: id }));
            const { error: insertError } = await supabaseAdmin.from('featured_properties').insert(inserts);
            if (insertError) throw insertError;
        }

        revalidateTag('inmovilla_property_list', {});
        return { success: true };
    } catch (e) {
        console.error('Error updating featured properties in Supabase:', e);
        return { success: false, error: 'Error al persistir cambios' };
    }
}

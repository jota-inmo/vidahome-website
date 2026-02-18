'use server';

import { createInmovillaApi } from '@/lib/api/properties';
import { PropertyListEntry, PropertyDetails } from '@/types/inmovilla';
import { apiCache, withNextCache } from '@/lib/api/cache';
import { cookies, headers } from 'next/headers';
import { revalidateTag } from 'next/cache';

export interface HeroSlide {
    id: string;
    video_path: string;
    link_url: string;
    title: string;
    order: number;
    active: boolean;
    type: 'video' | 'image';
    poster?: string;
}

// ─── Función interna cacheada con Next.js Data Cache ─────────────────────────
// Persiste entre invocaciones serverless en Vercel (a diferencia de fs/memoria).
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

    const isConfigured = !!(numagencia && password) || (!!token && token !== 'your_token_here');

    if (!isConfigured) {
        return {
            success: false,
            isConfigured: false,
            error: 'Credenciales de Inmovilla no configuradas.'
        };
    }

    try {
        const properties = await _fetchPropertiesFromApi(numagencia!, password!, addnumagencia, clientIp, domain);
        const populations = [...new Set(properties.map(p => p.poblacion).filter(Boolean))].sort() as string[];

        return {
            success: true,
            data: properties,
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

    // Check individual cache - v9 to ensure fresh data after full-detail-for-cards fix
    const cacheKey = `prop_detail_v9_${id}`;
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

        if (!details) {
            return { success: false, error: 'La propiedad solicitada no está disponible actualmente' };
        }

        // Resolve population name (adapter already does basic, but let's ensure)
        if (details && details.key_loca && !details.poblacion) {
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

/**
 * NEW: Fetches featured properties with FULL details (descriptions, etc)
 * Using the Dual-Fetch strategy for each property.
 */
export async function getFeaturedPropertiesWithDetailsAction(): Promise<{ success: boolean; data: any[] }> {
    const featuredIds = await getFeaturedPropertiesAction();

    if (featuredIds.length === 0) {
        return { success: true, data: [] };
    }

    try {
        // Fetch details for each featured property in parallel
        // They will be cached individually by getPropertyDetailAction
        const detailPromises = featuredIds.map((id: number) => getPropertyDetailAction(id));
        const results = await Promise.all(detailPromises);

        const validDetails = results
            .filter((res: { success: boolean; data?: PropertyDetails; error?: string }) => res.success && res.data)
            .map((res: { success: boolean; data?: PropertyDetails; error?: string }) => res.data);

        return { success: true, data: validDetails };
    } catch (error) {
        console.error('Error enriching featured properties:', error);
        return { success: false, data: [] };
    }
}

export async function updateFeaturedPropertiesAction(ids: number[]) {
    try {
        // Escritura: usar supabaseAdmin (SERVICE_ROLE_KEY) para bypassar RLS
        const { supabaseAdmin } = await import('@/lib/supabase-admin');

        // 1. Remove all existing featured properties
        const { error: deleteError } = await supabaseAdmin
            .from('featured_properties')
            .delete()
            .neq('id', 0);

        if (deleteError) throw deleteError;

        // 2. Insert new selections
        if (ids.length > 0) {
            const inserts = ids.map(id => ({ cod_ofer: id }));
            const { error: insertError } = await supabaseAdmin
                .from('featured_properties')
                .insert(inserts);

            if (insertError) throw insertError;
        }

        // Invalidar la Next.js Data Cache para que la próxima visita obtenga datos frescos
        revalidateTag('inmovilla_property_list', {});
        return { success: true };
    } catch (e) {
        console.error('Error updating featured properties in Supabase:', e);
        return { success: false, error: 'Error al persistir cambios' };
    }
}

export async function loginAction(password: string) {
    const adminPass = process.env.ADMIN_PASSWORD;
    if (!adminPass) {
        console.error('[Auth] ADMIN_PASSWORD no está configurado en las variables de entorno.');
        return { success: false, error: 'Error de configuración del servidor' };
    }
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
    return session?.value === 'active';
}

/**
 * HERO SLIDES MANAGEMENT
 */
export async function getHeroSlidesAction(onlyActive = false): Promise<HeroSlide[]> {
    try {
        const { supabase } = await import('@/lib/supabase');
        let query = supabase
            .from('hero_slides')
            .select('*')
            .order('order', { ascending: true });

        if (onlyActive) {
            query = query.eq('active', true);
        }

        const { data, error } = await query;

        if (error) throw error;
        return (data || []) as HeroSlide[];
    } catch (e) {
        console.error('Error fetching hero slides:', e);
        return [];
    }
}


export async function saveHeroSlideAction(slide: Partial<HeroSlide>) {
    try {
        // Escritura: usar supabaseAdmin (SERVICE_ROLE_KEY) para bypassar RLS
        const { supabaseAdmin } = await import('@/lib/supabase-admin');

        const { error } = await supabaseAdmin
            .from('hero_slides')
            .upsert(slide);

        if (error) throw error;

        return { success: true };
    } catch (e: any) {
        console.error('Error saving hero slide:', e);
        return { success: false, error: e.message };
    }
}

export async function deleteHeroSlideAction(id: string) {
    try {
        // Escritura: usar supabaseAdmin (SERVICE_ROLE_KEY) para bypassar RLS
        const { supabaseAdmin } = await import('@/lib/supabase-admin');
        const { error } = await supabaseAdmin
            .from('hero_slides')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (e: any) {
        console.error('Error deleting hero slide:', e);
        return { success: false, error: e.message };
    }
}

export async function uploadMediaAction(formData: FormData) {
    try {
        // Escritura en Storage: usar supabaseAdmin (SERVICE_ROLE_KEY) para bypassar RLS
        const { supabaseAdmin } = await import('@/lib/supabase-admin');
        const file = formData.get('file') as File;
        if (!file) throw new Error('No se ha proporcionado ningún archivo');

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `hero/${fileName}`;

        // Upload to 'videos' bucket
        const { data, error } = await supabaseAdmin.storage
            .from('videos')
            .upload(filePath, file);

        if (error) throw error;

        // Get Public URL (la URL pública no requiere autenticación)
        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('videos')
            .getPublicUrl(filePath);

        return { success: true, url: publicUrl, path: filePath };
    } catch (e: any) {
        console.error('Upload Error:', e);
        return { success: false, error: e.message };
    }
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


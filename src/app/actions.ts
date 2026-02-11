'use server';

import { createInmovillaApi } from '@/lib/api/properties';
import { PropertyListEntry, PropertyDetails } from '@/types/inmovilla';
import { apiCache } from '@/lib/api/cache';
import { cookies } from 'next/headers';

export async function fetchPropertiesAction(): Promise<{
    success: boolean;
    data?: PropertyListEntry[];
    error?: string;
    isConfigured: boolean;
    meta?: { populations: string[] };
}> {
    const token = process.env.INMOVILLA_TOKEN;
    const authType = (process.env.INMOVILLA_AUTH_TYPE as 'Token' | 'Bearer') || 'Bearer';
    const isConfigured = !!token && token !== 'your_token_here';

    if (!isConfigured) {
        return {
            success: false,
            isConfigured: false,
            error: 'Token no configurado. Por favor, añade INMOVILLA_TOKEN a tu archivo .env'
        };
    }

    const cacheKey = 'property_list_main';
    let basicProperties = apiCache.get<PropertyListEntry[]>(cacheKey);

    try {
        const api = createInmovillaApi(token!, authType);

        if (!basicProperties) {
            console.log('Cache miss: Fetching property list from API...');
            basicProperties = await api.getProperties({ page: 1 });

            if (basicProperties && basicProperties.length > 0) {
                apiCache.set(cacheKey, basicProperties, 600); // Cache for 10 minutes
            }
        } else {
            console.log('Cache hit: Returning property list from cache.');
        }

        // Filter: only active, available, and non-prospect properties
        const filteredProperties = (basicProperties || []).filter(p => !p.nodisponible && !p.prospecto);

        // Build list with existing cache
        // We map over properties to inject any details we might already have in cache
        const allProperties = filteredProperties.map((prop) => {
            const detailCacheKey = `prop_detail_${prop.cod_ofer}`;
            const cachedDetails = apiCache.get<PropertyDetails>(detailCacheKey);

            if (cachedDetails) {
                let mainImage = '';
                if (cachedDetails.numagencia && cachedDetails.fotoletra && parseInt(cachedDetails.numfotos || '0') > 0) {
                    mainImage = `https://fotos15.inmovilla.com/${cachedDetails.numagencia}/${prop.cod_ofer}/${cachedDetails.fotoletra}-1.jpg`;
                }

                return {
                    ...prop,
                    numagencia: cachedDetails.numagencia,
                    numfotos: cachedDetails.numfotos,
                    fotoletra: cachedDetails.fotoletra,
                    precioinmo: cachedDetails.precioinmo,
                    calle: cachedDetails.calle,
                    descripciones: cachedDetails.descripciones,
                    poblacion: cachedDetails.poblacion || '',
                    keyacci: cachedDetails.keyacci,
                    tipo_nombre: cachedDetails.tipo_nombre || '',
                    habitaciones: (Number(cachedDetails.habitaciones) || 0) + (Number((cachedDetails as any).habdobles) || 0),
                    banyos: cachedDetails.banyos,
                    m_cons: cachedDetails.m_cons,
                    mainImage
                } as PropertyListEntry;
            }
            return prop;
        });

        // Enrich some new ones (limited to strictly 2 items per request to stay under 10/min safely)
        const toEnrich = allProperties.filter(p => !p.mainImage || !p.tipo_nombre || p.habitaciones === undefined).slice(0, 2);

        if (toEnrich.length > 0) {
            await Promise.all(toEnrich.map(async (prop) => {
                try {
                    const details = await api.getPropertyDetails(prop.cod_ofer);

                    // Resolve population name
                    if (details.key_loca) {
                        try {
                            const localidadMap = require('@/lib/api/localidades_map.json');
                            details.poblacion = localidadMap[details.key_loca] || '';
                        } catch (e) { }
                    }

                    // Resolve type name
                    if (details.key_tipo) {
                        try {
                            const tiposMap = require('@/lib/api/tipos_map.json');
                            const typeKey = String(details.key_tipo);
                            details.tipo_nombre = tiposMap[typeKey] || '';
                        } catch (e) { }
                    }

                    // Generate all photo URLs
                    const photos: string[] = [];
                    const numFotos = parseInt(details.numfotos || '0');
                    if (numFotos > 0 && details.numagencia && details.fotoletra) {
                        for (let i = 1; i <= numFotos; i++) {
                            photos.push(`https://fotos15.inmovilla.com/${details.numagencia}/${prop.cod_ofer}/${details.fotoletra}-${i}.jpg`);
                        }
                    }
                    details.fotos_lista = photos;

                    apiCache.set(`prop_detail_${prop.cod_ofer}`, details);

                    // Update in list in-memory for this response
                    const idx = allProperties.findIndex(p => p.cod_ofer === prop.cod_ofer);
                    if (idx !== -1) {
                        let mainImage = '';
                        if (details.numagencia && details.fotoletra && parseInt(details.numfotos || '0') > 0) {
                            mainImage = `https://fotos15.inmovilla.com/${details.numagencia}/${prop.cod_ofer}/${details.fotoletra}-1.jpg`;
                        }
                        const totalHabitaciones = (Number(details.habitaciones) || 0) + (Number((details as any).habdobles) || 0);

                        allProperties[idx] = {
                            ...allProperties[idx],
                            ...details,
                            habitaciones: totalHabitaciones,
                            nodisponible: !!details.nodisponible,
                            mainImage
                        } as PropertyListEntry;
                    }
                } catch (e) { }
            }));

            // Save updated enriched list to cache
            apiCache.set(cacheKey, allProperties, 600);
        }

        // Extract unique populations for filters
        const populations = [...new Set(allProperties.map(p => p.poblacion).filter(Boolean))].sort() as string[];

        return {
            success: true,
            data: allProperties,
            isConfigured: true,
            meta: { populations }
        };
    } catch (error: any) {
        console.error('Action Error:', error);
        return {
            success: false,
            isConfigured: true,
            error: error.message || 'Error desconocido al conectar con la API'
        };
    }
}

export async function getPropertyDetailAction(id: number): Promise<{ success: boolean; data?: PropertyDetails; error?: string }> {
    const token = process.env.INMOVILLA_TOKEN;
    const authType = (process.env.INMOVILLA_AUTH_TYPE as 'Token' | 'Bearer') || 'Bearer';

    if (!token) return { success: false, error: 'Token no configurado' };

    // Check individual cache
    const cacheKey = `prop_detail_${id}`;
    const cachedDetail = apiCache.get<PropertyDetails>(cacheKey);
    if (cachedDetail) {
        return { success: true, data: cachedDetail };
    }

    try {
        const api = createInmovillaApi(token, authType);
        const details = await api.getPropertyDetails(id);

        // Generate all photo URLs
        const photos: string[] = [];
        const numFotos = parseInt(details.numfotos || '0');
        if (numFotos > 0 && details.numagencia && details.fotoletra) {
            for (let i = 1; i <= numFotos; i++) {
                photos.push(`https://fotos15.inmovilla.com/${details.numagencia}/${id}/${details.fotoletra}-${i}.jpg`);
            }
        }

        details.fotos_lista = photos;

        // Resolve population name using the key_loca map
        if (details.key_loca) {
            try {
                const localidadMap = require('@/lib/api/localidades_map.json');
                details.poblacion = localidadMap[details.key_loca] || '';
            } catch (e) {
                console.error('Error resolving population', e);
            }
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

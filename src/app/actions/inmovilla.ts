'use server';

import { createInmovillaApi } from '@/lib/api/properties';
import { PropertyListEntry, PropertyDetails } from '@/types/inmovilla';
import { revalidateTag } from 'next/cache';

/**
 * Helper to map next-intl locale to description key
 */
function getDescriptionKey(locale: string): string {
    switch (locale) {
        case 'en': return 'description_en';
        case 'fr': return 'description_fr';
        case 'de': return 'description_de';
        case 'it': return 'description_it';
        case 'pl': return 'description_pl';
        case 'es':
        default: return 'description_es';
    }
}

/**
 * SIMPLIFIED: Fetch properties from Supabase (source of truth)
 * No Inmovilla calls - all data is pre-synced via admin/sync panel
 */
export async function fetchPropertiesAction(): Promise<{
    success: boolean;
    data?: PropertyListEntry[];
    error?: string;
    isConfigured: boolean;
    meta?: { populations: string[] };
}> {
    try {
        const { supabase } = await import('@/lib/supabase');
        const { data: properties, error } = await supabase
            .from('property_metadata')
            .select('cod_ofer, ref, tipo, precio, descripciones:descriptions->>description_es, main_photo, poblacion, nodisponible, prospecto, fechaact')
            .eq('nodisponible', false)
            .order('cod_ofer', { ascending: false });

        if (error) throw error;

        // Cast to PropertyListEntry (Supabase returns the structure we need)
        const formatted = (properties || []) as PropertyListEntry[];
        const populations = [...new Set(formatted.map(p => p.poblacion).filter(Boolean))].sort() as string[];

        return { success: true, data: formatted, isConfigured: true, meta: { populations } };
    } catch (error: any) {
        console.error('[Actions] fetchPropertiesAction Error:', error);
        return { success: false, isConfigured: true, error: error.message || 'Error loading properties', data: [] };
    }
}

/**
 * SIMPLIFIED: Get property detail from Supabase (source of truth)
 * All data including photos are pre-synced via admin/sync panel
 */
export async function getPropertyDetailAction(id: number, locale: string = 'es'): Promise<{ success: boolean; data?: PropertyDetails; error?: string }> {
    try {
        const { supabase } = await import('@/lib/supabase');
        const { data: meta, error } = await supabase
            .from('property_metadata')
            .select('cod_ofer, ref, full_data, descriptions, photos, main_photo')
            .eq('cod_ofer', id)
            .single();

        if (error || !meta) {
            return { success: false, error: 'Propiedad no encontrada' };
        }

        // Get full property data from stored full_data
        const fullData = meta.full_data as PropertyDetails || {};

        // Apply correct locale description
        const descKey = getDescriptionKey(locale);
        const descriptions = meta.descriptions as Record<string, string> || {};
        const localizedDesc = descriptions[descKey] || descriptions.description_es || fullData.descripciones;

        // Enrich with photos if available
        const propertyWithPhotos = {
            ...fullData,
            cod_ofer: meta.cod_ofer,
            ref: meta.ref,
            descripciones: localizedDesc,
            all_descriptions: descriptions,
            fotos: meta.photos || [],
            main_photo: meta.main_photo
        };

        return { success: true, data: propertyWithPhotos };
    } catch (error: any) {
        console.error('[Actions] getPropertyDetailAction Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * SIMPLIFIED: Get featured property IDs from Supabase
 */
export async function getFeaturedPropertiesAction(): Promise<number[]> {
    try {
        const { supabase } = await import('@/lib/supabase');
        const { data, error } = await supabase
            .from('featured_properties')
            .select('cod_ofer')
            .order('created_at', { ascending: true });

        if (error) throw error;
        return (data || []).map(item => item.cod_ofer);
    } catch (e) {
        console.error('Error fetching featured properties:', e);
        return [];
    }
}

/**
 * SIMPLIFIED: Get featured properties with full details from Supabase
 * All data is pre-synced, no Inmovilla calls
 */
export async function getFeaturedPropertiesWithDetailsAction(locale: string): Promise<{ success: boolean; data: any[] }> {
    try {
        const featuredIds = await getFeaturedPropertiesAction();

        if (featuredIds.length === 0) return { success: true, data: [] };

        const { supabase } = await import('@/lib/supabase');
        const { data: metadata, error } = await supabase
            .from('property_metadata')
            .select('cod_ofer, full_data, descriptions, main_photo, photos')
            .in('cod_ofer', featuredIds);

        if (error) throw error;

        const results = featuredIds
            .map(id => {
                const meta = metadata?.find(m => m.cod_ofer === id);
                if (!meta || !meta.full_data) return null;

                const fullData = meta.full_data as PropertyDetails;
                const descriptions = meta.descriptions as Record<string, string> || {};
                const descKey = getDescriptionKey(locale);
                const localizedDesc = descriptions[descKey] || descriptions.description_es || fullData.descripciones;

                return {
                    ...fullData,
                    cod_ofer: meta.cod_ofer,
                    descripciones: localizedDesc,
                    all_descriptions: descriptions,
                    main_photo: meta.main_photo,
                    fotos: meta.photos || []
                };
            })
            .filter(Boolean);

        return { success: true, data: results };
    } catch (error: any) {
        console.error('Error getting featured properties with details:', error);
        return { success: false, data: [] };
    }
}

/**
 * Update featured properties list
 */
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

        return { success: true };
    } catch (e) {
        console.error('Error updating featured properties:', e);
        return { success: false, error: 'Error al persistir cambios' };
    }
}

import { checkRateLimit } from '@/lib/rate-limit';

/**
 * ⭐ THE ONLY FUNCTION THAT CALLS INMOVILLA
 * 
 * Synchronize properties from Inmovilla to Supabase
 * Called ONLY from /admin/sync panel
 * 
 * Process:
 * 1. Call Inmovilla getProperties (lista inicial)
 * 2. Call Inmovilla getPropertyDetails (para cada propiedad → obtener fotos)
 * 3. Store everything in Supabase property_metadata with clean structure
 */
export async function syncPropertiesFromInmovillaAction(): Promise<{
    success: boolean;
    synced: number;
    error?: string;
}> {
    const token = process.env.INMOVILLA_TOKEN;
    const numagencia = process.env.INMOVILLA_AGENCIA;
    const password = process.env.INMOVILLA_PASSWORD;
    const authType = (process.env.INMOVILLA_AUTH_TYPE as 'Token' | 'Bearer') || 'Bearer';

    if (!numagencia || !password) {
        return { success: false, synced: 0, error: 'Inmovilla credentials not configured' };
    }

    try {
        console.log('[Sync] Starting sync from Inmovilla...');

        // STEP 1: Get property list from Inmovilla
        const api = createInmovillaApi(token!, authType);
        const propertiesData = await api.getProperties({ page: 1 });

        if (!propertiesData || propertiesData.length === 0) {
            return { success: true, synced: 0 };
        }

        // Filter valid properties
        const validProperties = propertiesData.filter(p =>
            !p.nodisponible &&
            !p.prospecto &&
            !isNaN(p.cod_ofer) &&
            p.ref &&
            p.ref.trim() !== '' &&
            p.ref !== '2494' &&
            p.cod_ofer !== 2494
        );

        console.log(`[Sync] Found ${validProperties.length} valid properties from Inmovilla`);

        const { supabaseAdmin } = await import('@/lib/supabase-admin');
        let successCount = 0;

        // STEP 2: Process each property
        for (const baseProp of validProperties) {
            try {
                // Get full details for this property to extract photos
                const details = await api.getPropertyDetails(baseProp.cod_ofer);

                if (!details) continue;

                // Extract photos - handle both array and Record formats
                let photos: any[] = [];
                if (Array.isArray(details.fotos)) {
                    photos = details.fotos;
                } else if (details.fotos && typeof details.fotos === 'object') {
                    // Convert Record to array
                    photos = Object.values(details.fotos).map((f: any) => f?.url || f);
                }
                const mainPhoto = photos[0] || null;

                // Prepare data for Supabase
                const upsertData = {
                    cod_ofer: baseProp.cod_ofer,
                    ref: baseProp.ref,
                    tipo: details.tipo_nombre || baseProp.tipo_nombre || 'Property',
                    precio: details.precio || 0,
                    poblacion: details.poblacion || baseProp.poblacion,
                    // Store Spanish description in key format
                    descriptions: {
                        description_es: details.descripciones || baseProp.descripciones || ''
                    },
                    // Store full property data for reference
                    full_data: details,
                    // Store photos separately for easy display
                    photos: photos,
                    main_photo: mainPhoto,
                    nodisponible: false,
                    updated_at: new Date().toISOString()
                };

                // Upsert to Supabase
                const { error } = await supabaseAdmin
                    .from('property_metadata')
                    .upsert(upsertData, { onConflict: 'cod_ofer' });

                if (error) {
                    console.warn(`[Sync] Error upserting property ${baseProp.cod_ofer}:`, error);
                } else {
                    successCount++;
                }
            } catch (propError) {
                console.warn(`[Sync] Error processing property ${baseProp.cod_ofer}:`, propError);
            }
        }

        console.log(`[Sync] Successfully synced ${successCount}/${validProperties.length} properties`);
        return { success: true, synced: successCount };
    } catch (error: any) {
        console.error('[Sync] Error during sync:', error);
        return { success: false, synced: 0, error: error.message };
    }
}

/**
 * Submit lead (contact form submission)
 * Minimal - only stores to Supabase and optionally Inmovilla
 */
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
        // Optional: Send to Inmovilla if configured
        if (token) {
            const api = createInmovillaApi(token, authType);
            await api.createClient({
                nombre: formData.nombre,
                apellidos: `${formData.apellidos} -- Mensaje: ${formData.mensaje.substring(0, 100)}`,
                email: formData.email,
                telefono1: formData.telefono,
                ...(formData.cod_ofer > 0 ? { cod_ofer: formData.cod_ofer } : {})
            });
        }

        // Store in Supabase
        const { supabase } = await import('@/lib/supabase');
        if (process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)) {
            await supabase.from('leads').insert([{
                ...formData,
                created_at: new Date().toISOString()
            }]);
        }

        return { success: true };
    } catch (error: any) {
        console.error('Lead Submission Error:', error);
        return { success: false, error: error.message };
    }
}

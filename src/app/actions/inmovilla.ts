'use server';

import { createInmovillaApi } from '@/lib/api/properties';
import { PropertyListEntry, PropertyDetails } from '@/types/inmovilla';

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
        
        // Get property metadata with all necessary fields
        const { data: properties, error } = await supabase
            .from('property_metadata')
            .select(`
                cod_ofer, 
                ref, 
                tipo, 
                precio,
                poblacion,
                nodisponible,
                main_photo,
                full_data
            `)
            .eq('nodisponible', false)
            .order('cod_ofer', { ascending: false });

        if (error) throw error;

        // Map database records to PropertyListEntry format
        const formatted: PropertyListEntry[] = (properties || []).map((row: any) => {
            const fullData = row.full_data || {};
            
            return {
                cod_ofer: row.cod_ofer,
                ref: row.ref,
                tipo: row.tipo,
                precio: row.precio,
                poblacion: row.poblacion,
                nodisponible: row.nodisponible,
                mainImage: row.main_photo,
                // Extract from full_data if available
                keyacci: fullData.keyacci,
                precioinmo: fullData.precioinmo,
                precioalq: fullData.precioalq,
                habitaciones: fullData.habitaciones,
                banyos: fullData.banyos,
                m_cons: fullData.m_cons,
                descripciones: fullData.descripciones,
                tipo_nombre: fullData.tipo_nombre,
                numagencia: fullData.numagencia,
                fotoletra: fullData.fotoletra,
                numfotos: fullData.numfotos
            };
        });
        
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

        // Get full property data from stored full_data (with fallback)
        const fullData = (meta.full_data as PropertyDetails) || {};

        // Apply correct locale description
        const descKey = getDescriptionKey(locale);
        const descriptions = (meta.descriptions as Record<string, string>) || {};
        const localizedDesc = descriptions[descKey] || descriptions.description_es || fullData.descripciones || '';

        // Enrich with photos if available
        const propertyWithPhotos = {
            ...fullData,
            cod_ofer: meta.cod_ofer,
            ref: meta.ref,
            descripciones: localizedDesc,
            all_descriptions: descriptions,
            fotos_lista: meta.photos || [],
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
        const { supabase } = await import('@/lib/supabase');
        
        // Get featured properties (sin ORDER BY orden porque esa columna no existe)
        const { data: featured, error: featError } = await supabase
            .from('featured_properties')
            .select('cod_ofer')
            .order('created_at', { ascending: true });

        if (featError) throw featError;
        if (!featured || featured.length === 0) return { success: true, data: [] };

        const featuredIds = featured.map(f => f.cod_ofer);
        const { data: metadata, error } = await supabase
            .from('property_metadata')
            .select('cod_ofer, full_data, descriptions, main_photo, photos')
            .in('cod_ofer', featuredIds);

        if (error) throw error;

        // Preserve order from featured_properties table
        const results = featured
            .map(featuredItem => {
                const meta = metadata?.find(m => m.cod_ofer === featuredItem.cod_ofer);
                if (!meta || !meta.full_data) return null;

                const fullData = meta.full_data as PropertyDetails || {};
                const descriptions = meta.descriptions as Record<string, string> || {};
                const descKey = getDescriptionKey(locale);
                const localizedDesc = descriptions[descKey] || descriptions.description_es || fullData.descripciones || '';

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

        // Delete all existing featured properties (featured_properties has cod_ofer as PRIMARY KEY, not 'id')
        const { error: deleteError } = await supabaseAdmin.from('featured_properties').delete().gt('cod_ofer', 0);
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
    const numagencia = process.env.INMOVILLA_NUMAGENCIA;
    const addnumagencia = process.env.INMOVILLA_ADDNUMAGENCIA || '';
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

                // Build photo URLs using numfotos, numagencia, and fotoletra
                // These fields are returned by Inmovilla API but fotos field is just a status string
                let photos: string[] = [];
                const numFotos = (details as any).numfotos ? parseInt((details as any).numfotos as string) : 0;
                const numAgencia = (details as any).numagencia || baseProp.numagencia || '';
                const fotoLetra = (details as any).fotoletra || baseProp.fotoletra || '';
                
                // Generate URLs for all available photos
                if (numFotos > 0 && numAgencia && fotoLetra) {
                    for (let i = 1; i <= numFotos; i++) {
                        photos.push(`https://fotos15.inmovilla.com/${numAgencia}/${baseProp.cod_ofer}/${fotoLetra}-${i}.jpg`);
                    }
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
                    // Store photos - constructed URLs array
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
                console.error(`[Sync] Error processing property ${baseProp.cod_ofer}:`, propError);
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
 * ⭐ INCREMENTAL SYNC - Syncs 10 properties at a time
 * 
 * Good for automated cron jobs (call every 30 seconds)
 * - Reads from Inmovilla
 * - Tracks progress in sync_progress table
 * - Processes 10 properties per call to avoid rate limits & conflicts
 * 
 * Usage: Call this from a cron job every 30 seconds
 * Example: `curl https://vidahome-website.vercel.app/api/admin/sync-incremental`
 */
export async function syncPropertiesIncrementalAction(batchSize: number = 10): Promise<{
    success: boolean;
    synced: number;
    total: number;
    isComplete: boolean;
    error?: string;
}> {
    console.log('[Sync Inc] Starting incremental sync with batchSize:', batchSize);
    
    const token = process.env.INMOVILLA_TOKEN;
    const authType = (process.env.INMOVILLA_AUTH_TYPE as 'Token' | 'Bearer') || 'Bearer';

    if (!token) {
        console.error('[Sync Inc] INMOVILLA_TOKEN not configured');
        return { success: false, synced: 0, total: 0, isComplete: false, error: 'Inmovilla token not configured' };
    }

    try {
        console.log('[Sync Inc] Getting Supabase admin client...');
        const { supabaseAdmin } = await import('@/lib/supabase-admin');

        // Get current sync progress
        console.log('[Sync Inc] Fetching current progress from sync_progress...');
        const { data: progress, error: progressError } = await supabaseAdmin
            .from('sync_progress')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (progressError && progressError.code !== 'PGRST116') { // PGRST116 = no rows found
            console.error('[Sync Inc] Error fetching progress:', progressError);
        }

        console.log('[Sync Inc] Current progress:', progress);

        const api = createInmovillaApi(token, authType);
        
        // Get ALL properties to find pagination point
        console.log('[Sync Inc] Fetching ALL properties from Inmovilla API...');
        const allProperties = await api.getProperties({ page: 1 });
        
        console.log('[Sync Inc] Received properties from API:', allProperties?.length || 0);
        
        if (!allProperties || allProperties.length === 0) {
            console.log('[Sync Inc] No properties returned from API');
            return { success: true, synced: 0, total: 0, isComplete: true };
        }

        // Filter valid properties
        const validProperties = allProperties.filter(p =>
            !p.nodisponible &&
            !p.prospecto &&
            !isNaN(p.cod_ofer) &&
            p.ref &&
            p.ref.trim() !== '' &&
            p.ref !== '2494' &&
            p.cod_ofer !== 2494
        );

        console.log('[Sync Inc] Valid properties after filtering:', validProperties.length);

        // Find where to resume
        const lastSyncedIndex = progress?.last_synced_cod_ofer 
            ? validProperties.findIndex(p => p.cod_ofer === progress.last_synced_cod_ofer)
            : -1;
        
        const startIndex = lastSyncedIndex + 1;
        const endIndex = Math.min(startIndex + batchSize, validProperties.length);
        const batch = validProperties.slice(startIndex, endIndex);

        if (batch.length === 0) {
            // All done!
            await supabaseAdmin
                .from('sync_progress')
                .insert({
                    last_synced_cod_ofer: validProperties[validProperties.length - 1].cod_ofer,
                    total_synced: validProperties.length,
                    status: 'idle',
                    error_message: null
                });
            
            console.log('[Sync] ✅ All properties synced!');
            return { success: true, synced: 0, total: validProperties.length, isComplete: true };
        }

        let successCount = 0;
        let lastCodOfer = progress?.last_synced_cod_ofer || 0;

        // Process batch
        for (const prop of batch) {
            try {
                const details = await api.getPropertyDetails(prop.cod_ofer);
                if (!details) continue;

                // Build photo URLs using numfotos, numagencia, and fotoletra
                let photos: string[] = [];
                const numFotos = (details as any).numfotos ? parseInt((details as any).numfotos as string) : 0;
                const numAgencia = (details as any).numagencia || prop.numagencia || '';
                const fotoLetra = (details as any).fotoletra || prop.fotoletra || '';
                
                // Generate URLs for all available photos
                if (numFotos > 0 && numAgencia && fotoLetra) {
                    for (let i = 1; i <= numFotos; i++) {
                        photos.push(`https://fotos15.inmovilla.com/${numAgencia}/${prop.cod_ofer}/${fotoLetra}-${i}.jpg`);
                    }
                }
                
                const mainPhoto = photos[0] || null;

                const upsertData = {
                    cod_ofer: prop.cod_ofer,
                    ref: prop.ref,
                    tipo: details.tipo_nombre || prop.tipo_nombre || 'Property',
                    precio: details.precio || 0,
                    poblacion: details.poblacion || prop.poblacion,
                    descriptions: {
                        description_es: details.descripciones || prop.descripciones || ''
                    },
                    full_data: details,
                    photos: photos,
                    main_photo: mainPhoto,
                    nodisponible: false,
                    updated_at: new Date().toISOString()
                };

                // Upsert to Supabase (individual inserts avoid conflict issues)
                const { error } = await supabaseAdmin
                    .from('property_metadata')
                    .upsert(upsertData, { onConflict: 'cod_ofer' });

                if (!error) {
                    // Also upsert to property_features for fast querying
                    const habitacionesSimples = details.habitaciones || 0;
                    const habitacionesDobles = details.habdobles || 0;
                    const totalHabitaciones = habitacionesSimples + habitacionesDobles;

                    const featureData = {
                        cod_ofer: prop.cod_ofer,
                        precio: details.precio || 0,
                        habitaciones: totalHabitaciones,
                        habitaciones_simples: habitacionesSimples,
                        habitaciones_dobles: habitacionesDobles,
                        banos: details.banyos || 0,
                        superficie: details.m_utiles || details.m_cons || 0,
                        plantas: Math.max(0, details.planta || 0),
                        ascensor: Boolean(details.ascensor),
                        parking: Boolean(details.garaje),
                        terraza: Boolean(details.terraza),
                        synced_at: new Date().toISOString()
                    };

                    const { error: featureError } = await supabaseAdmin
                        .from('property_features')
                        .upsert(featureData, { onConflict: 'cod_ofer' });

                    if (featureError) {
                        console.warn(`[Sync] Error upserting features for ${prop.cod_ofer}:`, featureError);
                    }

                    successCount++;
                    lastCodOfer = prop.cod_ofer;
                } else {
                    console.warn(`[Sync] Error upserting ${prop.cod_ofer}:`, error);
                }
            } catch (e) {
                console.error(`[Sync] Error processing ${prop.cod_ofer}:`, e);
            }
        }

        // Update progress
        console.log('[Sync Inc] Updating sync_progress with:', { lastCodOfer, successCount, totalSynced: (progress?.total_synced || 0) + successCount });
        const { error: updateError } = await supabaseAdmin
            .from('sync_progress')
            .insert({
                last_synced_cod_ofer: lastCodOfer,
                total_synced: (progress?.total_synced || 0) + successCount,
                status: 'idle',
                error_message: null
            });

        if (updateError) {
            console.error('[Sync Inc] Error updating sync_progress:', updateError);
        } else {
            console.log('[Sync Inc] ✅ sync_progress updated successfully');
        }

        const isComplete = endIndex >= validProperties.length;
        console.log(`[Sync Inc] Batch complete: ${successCount}/${batch.length} synced. Progress: ${endIndex}/${validProperties.length}`);

        return {
            success: true,
            synced: successCount,
            total: validProperties.length,
            isComplete
        };
    } catch (error: any) {
        console.error('[Sync Inc] Incremental sync error:', error);
        return { success: false, synced: 0, total: 0, isComplete: false, error: error.message };
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

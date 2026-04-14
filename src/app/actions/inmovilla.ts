'use server';

import { createInmovillaApi } from '@/lib/api/properties';
import { PropertyListEntry, PropertyDetails } from '@/types/inmovilla';
import tiposMap from '@/lib/api/tipos_map.json';
import localidadesMap from '@/lib/api/localidades_map.json';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

/** Resolve tipo name from key_tipo using the master map */
function resolveTipo(details: any): string {
    const keyTipo = String(details.key_tipo || '');
    return (tiposMap as Record<string, string>)[keyTipo] || details.tipo_nombre || '';
}

/** Resolve poblacion from key_loca using the master map */
function resolvePoblacion(details: any): string {
    const keyLoca = String(details.key_loca || '');
    // 'ciudad' is the specific locality (e.g. "La Font d'En Carros")
    // 'poblacion' is the broader municipality (e.g. "Gandía")
    // Prefer the more specific one
    return (localidadesMap as Record<string, string>)[keyLoca]
        || details.ciudad
        || details.poblacion
        || '';
}

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
export async function fetchPropertiesAction(locale: string = 'es'): Promise<{
    success: boolean;
    data?: PropertyListEntry[];
    error?: string;
    isConfigured: boolean;
    meta?: { populations: string[] };
}> {
    try {
        const { supabase } = await import('@/lib/supabase');

        // Get property metadata: only visible_web=true, plus recently sold (nodisponible in last 10 days)
        const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
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
                full_data,
                descriptions,
                updated_at
            `)
            .eq('visible_web', true)
            .or(`nodisponible.eq.false,and(nodisponible.eq.true,updated_at.gte.${tenDaysAgo})`)
            .order('nodisponible', { ascending: true })
            .order('updated_at', { ascending: false });

        if (error) throw error;

        // Also get property features for accurate room/bath counts
        const { data: features, error: featError } = await supabase
            .from('property_features')
            .select('cod_ofer, habitaciones, habitaciones_simples, habitaciones_dobles, banos, superficie');

        if (featError) {
            console.warn('[Actions] Error fetching features:', featError);
        }

        // Create a lookup map for features
        const featuresMap = new Map((features || []).map((f: any) => [f.cod_ofer, f]));

        // Map database records to PropertyListEntry format
        const descKey = getDescriptionKey(locale);
        const formatted: PropertyListEntry[] = (properties || []).map((row: any) => {
            const fullData = row.full_data || {};
            const feat = featuresMap.get(row.cod_ofer);
            const descriptions = (row.descriptions as Record<string, string>) || {};

            // Use feature data if available, otherwise fall back to full_data
            // Total habitaciones = simples + dobles
            const habitaciones = feat?.habitaciones
                ?? (((Number(fullData.habitaciones) || 0) + (Number(fullData.habdobles) || 0)) || 0);
            const banyos = feat?.banos || fullData.banyos || 0;
            // aseos lives only in full_data (property_features no lo tiene).
            // Lo propagamos para que la card pueda mostrar baños+aseos sumados
            // con tooltip "X baño + Y aseo" en hover.
            const aseos = Number(fullData.aseos) || 0;
            const m_cons = feat?.superficie || fullData.m_cons || 0;

            // Apply locale-specific description, fallback to Spanish
            const localizedDesc = descriptions[descKey] || descriptions.description_es || fullData.descripciones || '';

            return {
                cod_ofer: row.cod_ofer,
                ref: row.ref,
                tipo: row.tipo,
                precio: row.precio || fullData.precioinmo || 0,
                poblacion: row.poblacion || fullData.poblacion || '',
                nodisponible: !!row.nodisponible,
                mainImage: row.main_photo,
                // Use accurate data from property_features or full_data fallback
                keyacci: fullData.keyacci,
                precioinmo: fullData.precioinmo,
                precioalq: fullData.precioalq,
                habitaciones: habitaciones,
                banyos: banyos,
                aseos: aseos,
                m_cons: m_cons,
                descripciones: localizedDesc,
                tipo_nombre: fullData.tipo_nombre || row.tipo || '',
                numagencia: fullData.numagencia,
                fotoletra: fullData.fotoletra,
                numfotos: fullData.numfotos,
                // Expose updated_at so the catalog can offer a
                // "most recent first" sort option.
                updated_at: row.updated_at,
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
 *
 * Accepts a path param that may be either:
 *   - a CRM ref string (e.g. "2975", "T2785", "A2812")
 *   - a numeric Inmovilla cod_ofer (e.g. 28734500)
 *
 * The previous version assumed "all-digit string == cod_ofer" but CRM refs
 * like "2975" or "2772" are also all-digits, which made every CRM-managed
 * property return "Propiedad no encontrada". Fixed by ALWAYS trying ref
 * first, then falling back to cod_ofer for legacy URLs.
 */
export async function getPropertyDetailAction(idOrRef: number | string, locale: string = 'es'): Promise<{ success: boolean; data?: PropertyDetails; error?: string }> {
    try {
        const { supabase } = await import('@/lib/supabase');

        const asString = String(idOrRef).trim();
        const SELECT_COLS = 'cod_ofer, ref, full_data, descriptions, photos, main_photo, poblacion, nodisponible, visible_web, energy_label, energy_consumption, emissions_label, emissions_value';

        // Try lookup by ref first (CRM source-of-truth, every URL minted by
        // the new wizard uses ref). maybeSingle so a miss doesn't throw.
        let { data: meta } = await supabase
            .from('property_metadata')
            .select(SELECT_COLS)
            .eq('ref', asString)
            .maybeSingle();

        // Fallback: legacy URLs minted by the old website used the numeric
        // Inmovilla cod_ofer. Try that only if (a) the param is purely
        // numeric and (b) the ref lookup didn't find anything.
        if (!meta && /^\d+$/.test(asString)) {
            const codOfer = Number(asString);
            const { data: metaByCod } = await supabase
                .from('property_metadata')
                .select(SELECT_COLS)
                .eq('cod_ofer', codOfer)
                .maybeSingle();
            meta = metaByCod;
        }
        const error = null;

        // CRM-published rows may not have cod_ofer, so the join below skips
        // property_features (it's keyed by cod_ofer). Energy data already
        // comes inside `meta` from the select above.
        const features = meta?.cod_ofer
            ? (await supabase
                .from('property_features')
                .select('cod_ofer, habitaciones, banos, superficie')
                .eq('cod_ofer', meta.cod_ofer)
                .maybeSingle()).data
            : null;

        if (error || !meta) {
            return { success: false, error: 'Propiedad no encontrada' };
        }

        // Block detail page for deactivated or hidden properties
        if ((meta as any).nodisponible || (meta as any).visible_web === false) {
            return { success: false, error: 'Propiedad no disponible' };
        }

        // Get full property data from stored full_data
        const fullData = (meta.full_data as PropertyDetails) || {};
        const feat = features || null;

        // Apply correct locale description
        const descKey = getDescriptionKey(locale);
        const descriptions = (meta.descriptions as Record<string, string>) || {};
        const localizedDesc = descriptions[descKey] || descriptions.description_es || fullData.descripciones || '';

        // Total habitaciones = simples + dobles
        const habitaciones = feat?.habitaciones
            ?? (((Number(fullData.habitaciones) || 0) + (Number(fullData.habdobles) || 0)) || 0);
        const banyos = feat?.banos || fullData.banyos || 0;
        // aseos is Spanish-real-estate-specific (toilet room without shower);
        // only full_data carries it. Expose it so the card/detail can show
        // (baños + aseos) with a tooltip "X baño + Y aseo" on hover.
        const aseos = Number((fullData as { aseos?: number | string }).aseos) || 0;
        const m_cons = feat?.superficie || fullData.m_cons || 0;

        // Fotos: preferir Cloudinary SOLO si hay al menos el 80% del total
        // esperado (vs URLs Inmovilla CDN). Evita mostrar 5 fotos cuando
        // Cloudinary tiene un set parcial y la galería completa vive en
        // Inmovilla. Si no hay fotos Inmovilla (CRM-only), Cloudinary gana
        // siempre.
        let fotos_lista: string[] = meta.photos || [];
        let main_photo: string | null = meta.main_photo || null;
        const inmovillaCount = (meta.photos || []).length;
        const PHOTO_COVERAGE_THRESHOLD = 0.8;

        if (meta.ref) {
            const { data: cloudinaryFotos } = await supabase
                .from('fotos_inmuebles')
                .select('url_cloudinary')
                .eq('ref', meta.ref)
                .or('visible.is.null,visible.eq.true')
                .order('orden', { ascending: true });

            const cloudinaryCount = cloudinaryFotos?.length || 0;
            const coverageOk = inmovillaCount === 0
                ? cloudinaryCount > 0
                : (cloudinaryCount / inmovillaCount) >= PHOTO_COVERAGE_THRESHOLD;

            if (coverageOk && cloudinaryFotos && cloudinaryFotos.length > 0) {
                fotos_lista = cloudinaryFotos.map((f: any) => f.url_cloudinary);
                main_photo = fotos_lista[0];
            }
        }

        // tipo_nombre: full_data trae NULL para refs CRM-only o stale, así que
        // usamos la columna `tipo` (resuelta vía tipos_map) como source of truth.
        const resolvedTipoNombre = (meta as any).tipo
            || resolveTipo(fullData)
            || fullData.tipo_nombre
            || '';

        // Enrich with photos if available
        const propertyWithPhotos = {
            ...fullData,
            cod_ofer: meta.cod_ofer,
            ref: meta.ref,
            descripciones: localizedDesc,
            all_descriptions: descriptions,
            fotos_lista,
            main_photo,
            mainImage: main_photo,
            tipo_nombre: resolvedTipoNombre,
            habitaciones: habitaciones,
            banyos: banyos,
            aseos: aseos,
            m_cons: m_cons,
            // Use resolved poblacion from DB column (preferred) over full_data fallback
            poblacion: (meta as any).poblacion || fullData.poblacion || '',
            // Energy Certificate (from property_metadata, selected above)
            energy_label: (meta as any).energy_label || null,
            energy_consumption: (meta as any).energy_consumption || null,
            emissions_label: (meta as any).emissions_label || null,
            emissions_value: (meta as any).emissions_value || null,
        };

        return { success: true, data: propertyWithPhotos as PropertyDetails };
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

        // Get featured properties
        const { data: featured, error: featError } = await supabase
            .from('featured_properties')
            .select('cod_ofer')
            .order('created_at', { ascending: true });

        if (featError) throw featError;
        if (!featured || featured.length === 0) return { success: true, data: [] };

        const featuredIds = featured.map(f => f.cod_ofer);

        // Get metadata and features in parallel (same as fetchPropertiesAction)
        const [{ data: metadata, error }, { data: features, error: featError2 }] = await Promise.all([
            supabase
                .from('property_metadata')
                .select('cod_ofer, full_data, descriptions, main_photo, photos, ref, tipo, precio, poblacion, nodisponible, visible_web')
                .in('cod_ofer', featuredIds)
                .eq('visible_web', true)
                .eq('nodisponible', false),
            supabase
                .from('property_features')
                .select('cod_ofer, habitaciones, banos, superficie')
                .in('cod_ofer', featuredIds)
        ]);

        if (error) throw error;
        if (featError2) console.warn('[getFeaturedPropertiesWithDetailsAction] Error fetching features:', featError2);

        // Create features lookup map
        const featuresMap = new Map((features || []).map((f: any) => [f.cod_ofer, f]));

        // Preserve order from featured_properties table and format correctly
        const results = featured
            .map(featuredItem => {
                const meta = metadata?.find(m => m.cod_ofer === featuredItem.cod_ofer);
                if (!meta || !meta.full_data) return null;

                const fullData = meta.full_data as PropertyDetails || {};
                const descriptions = meta.descriptions as Record<string, string> || {};
                const descKey = getDescriptionKey(locale);
                // Try to get the translation for the requested locale, fallback to Spanish
                const localizedDesc = descriptions[descKey] || descriptions.description_es || fullData.descripciones || '';

                // Get features for this property
                const feat = featuresMap.get(meta.cod_ofer);

                // Total habitaciones = simples + dobles
                const habitaciones = feat?.habitaciones
                    ?? (((Number(fullData.habitaciones) || 0) + (Number(fullData.habdobles) || 0)) || 0);
                const banyos = feat?.banos || fullData.banyos || 0;
                const aseos = Number((fullData as { aseos?: number | string }).aseos) || 0;
                const m_cons = feat?.superficie || fullData.m_cons || 0;

                return {
                    ...fullData,
                    cod_ofer: meta.cod_ofer,
                    ref: meta.ref,
                    mainImage: meta.main_photo,
                    habitaciones: habitaciones,
                    banyos: banyos,
                    aseos: aseos,
                    m_cons: m_cons,
                    descripciones: localizedDesc,
                    fotos_lista: meta.photos || []
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
        if (!(await requireAdmin())) return { success: false, error: 'No autorizado' };
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
 * Helper: Record price change in audit table
 */
async function recordPriceChange(
    supabaseAdmin: any,
    cod_ofer: number,
    oldPrice: number | null,
    newPrice: number,
    notes?: string
) {
    try {
        const priceChange = oldPrice ? newPrice - oldPrice : null;
        const percentageChange = oldPrice && oldPrice !== 0
            ? ((newPrice - oldPrice) / oldPrice) * 100
            : null;

        await supabaseAdmin.from('price_audit').insert({
            cod_ofer,
            old_price: oldPrice,
            new_price: newPrice,
            price_change: priceChange,
            percentage_change: percentageChange,
            changed_by: 'system',
            notes: notes || `Auto-synced from Inmovilla${oldPrice ? ' price updated' : ' new property'}`,
        });

        if (oldPrice && oldPrice !== newPrice) {
            const change = priceChange! > 0 ? '📈' : '📉';
            const percent = Math.abs(percentageChange!).toFixed(1);
            console.log(`[Sync] ${change} COD ${cod_ofer}: €${oldPrice} → €${newPrice} (${percent}%)`);
        }
    } catch (error) {
        console.warn(`[Sync] Error recording price change for ${cod_ofer}:`, error);
    }
}

/**
 * Helper: Smart update - only updates price + new photos, preserves existing data
 */
async function smartUpdateProperty(
    supabaseAdmin: any,
    cod_ofer: number,
    newData: any,
    existingData: any
) {
    try {
        // Check for admin overrides (manual edits that persist over sync)
        const adminOverrides = existingData.admin_overrides || {};

        // Preserve existing critical data
        const updateData: any = {
            cod_ofer: cod_ofer,
            // Respect admin price override if set
            precio: adminOverrides.precio ?? newData.precio,
            tipo: newData.tipo_nombre, // Resolved from tiposMap
            poblacion: newData.poblacion, // Resolved from localidadesMap
            updated_at: new Date().toISOString(),
        };

        // Only update photos IF they didn't exist before OR if count changed
        const existingPhotoCount = existingData.photos?.length || 0;
        const newPhotoCount = newData.photos?.length || 0;

        if (newPhotoCount > 0 && newPhotoCount !== existingPhotoCount) {
            updateData.photos = newData.photos;
            updateData.main_photo = newData.main_photo;
        }

        // Keep existing descriptions (translated manually)
        if (existingData.descriptions) {
            updateData.descriptions = existingData.descriptions;
        } else {
            // Only set Spanish if we don't have descriptions yet
            updateData.descriptions = {
                description_es: newData.descriptions?.description_es || ''
            };
        }

        // Keep existing full_data but update certain fields
        const updatedFullData = {
            ...(existingData.full_data || newData.full_data),
            // Update only metadata fields, preserve original descriptions
            tipo_nombre: newData.tipo_nombre,
            poblacion: newData.poblacion,
            habitat: newData.habitat,
            numagencia: newData.numagencia,
            fotoletra: newData.fotoletra,
            numfotos: newData.numfotos,
            // Price is in full_data too, keep it synced
            precio: newData.precio,
            precioinmo: newData.precioinmo,
        };

        updateData.full_data = updatedFullData;

        // Update in Supabase
        const { error } = await supabaseAdmin
            .from('property_metadata')
            .update(updateData)
            .eq('cod_ofer', cod_ofer);

        return { success: !error, error };
    } catch (error) {
        console.error(`[Sync] Error in smartUpdateProperty for ${cod_ofer}:`, error);
        return { success: false, error };
    }
}

/**
 * Helper: Generate and save property URLs
 */
async function syncPropertyUrls(
    supabaseAdmin: any,
    cod_ofer: number,
    ref: string
) {
    const baseDomain = process.env.INMOVILLA_DOMAIN || 'vidahome-website.vercel.app';
    const locales = ['es', 'en', 'fr', 'de', 'it', 'pl'];

    const urlData: any = {
        cod_ofer,
        ref,
        updated_at: new Date().toISOString()
    };

    locales.forEach(locale => {
        urlData[`url_${locale}`] = `https://${baseDomain}/${locale}/propiedades/${cod_ofer}`;
    });

    try {
        await supabaseAdmin
            .from('property_urls')
            .upsert(urlData, { onConflict: 'cod_ofer' });
    } catch (error) {
        console.warn(`[Sync] Error updating URLs for ${cod_ofer}:`, error);
    }
}

/**
 * ⭐ THE ONLY FUNCTION THAT CALLS INMOVILLA
 * 
 * Synchronize properties from Inmovilla to Supabase
 * Called ONLY from /admin/sync panel OR cron jobs
 * 
 * SMART SYNC:
 * - Creates new properties with all data
 * - Updates existing properties ONLY for: prices, photos (if count changed), metadata
 * - PRESERVES: translations, manual descriptions, existing metadata
 * - TRACKS: price changes in price_audit table
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

    if (!(await requireAdmin())) return { success: false, synced: 0, error: 'No autorizado' };

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

        // Filter valid properties (must have a numeric cod_ofer — Inmovilla rows always do)
        const validProperties = propertiesData.filter((p): p is typeof p & { cod_ofer: number } =>
            p.cod_ofer != null &&
            !p.nodisponible &&
            !p.prospecto &&
            !isNaN(p.cod_ofer) &&
            !!p.ref &&
            p.ref.trim() !== '' &&
            p.ref !== '2494' &&
            p.cod_ofer !== 2494
        );

        console.log(`[Sync] Found ${validProperties.length} valid properties from Inmovilla`);

        const { supabaseAdmin } = await import('@/lib/supabase-admin');
        let successCount = 0;
        let newCount = 0;
        let updatedCount = 0;
        let priceChanges = 0;

        // Get all existing properties ONCE for comparison
        const { data: existingProps } = await supabaseAdmin
            .from('property_metadata')
            .select('cod_ofer, precio, descriptions, full_data, photos, main_photo, admin_overrides');

        const existingMap = new Map(
            (existingProps || []).map(p => [p.cod_ofer, p])
        );

        // STEP 2: Process each property
        for (const baseProp of validProperties) {
            try {
                // Get full details for this property to extract photos
                const details = await api.getPropertyDetails(baseProp.cod_ofer);

                if (!details) continue;

                // Build photo URLs using numfotos, numagencia, and fotoletra
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
                // Use precioinmo (real price) instead of precio (commission-deducted)
                const newPrice = details.precioinmo || details.precio || 0;

                // Check if property exists
                const existing = existingMap.get(baseProp.cod_ofer);

                if (existing) {
                    // EXISTING PROPERTY - Smart update only

                    // Check for price change
                    const oldPrice = existing.precio || null;
                    if (oldPrice !== newPrice) {
                        priceChanges++;
                        await recordPriceChange(supabaseAdmin, baseProp.cod_ofer, oldPrice, newPrice);
                    }

                    // Prepare update data (preserves translations & descriptions)
                    const newData = {
                        tipo_nombre: resolveTipo(details),
                        precio: newPrice,
                        poblacion: resolvePoblacion(details) || baseProp.poblacion,
                        descripciones: details.descripciones || baseProp.descripciones || '',
                        numagencia: (details as any).numagencia || baseProp.numagencia,
                        fotoletra: (details as any).fotoletra || baseProp.fotoletra,
                        numfotos: (details as any).numfotos || baseProp.numfotos,
                        precioinmo: details.precioinmo,
                        full_data: details,
                        photos: photos,
                        main_photo: mainPhoto,
                        descriptions: {
                            description_es: details.descripciones || baseProp.descripciones || ''
                        }
                    };

                    const result = await smartUpdateProperty(
                        supabaseAdmin,
                        baseProp.cod_ofer,
                        newData,
                        existing
                    );

                    if (result.success) {
                        updatedCount++;
                        successCount++;
                    }
                } else {
                    // NEW PROPERTY - Create with all data
                    const insertData = {
                        cod_ofer: baseProp.cod_ofer,
                        ref: baseProp.ref,
                        tipo: resolveTipo(details),
                        precio: newPrice,
                        poblacion: resolvePoblacion(details) || baseProp.poblacion,
                        descriptions: {
                            description_es: details.descripciones || baseProp.descripciones || ''
                        },
                        full_data: details,
                        photos: photos,
                        main_photo: mainPhoto,
                        nodisponible: false,
                        updated_at: new Date().toISOString()
                    };

                    const { error } = await supabaseAdmin
                        .from('property_metadata')
                        .insert(insertData);

                    if (!error) {
                        newCount++;
                        successCount++;
                        // Generate URLs for new property
                        await syncPropertyUrls(supabaseAdmin, baseProp.cod_ofer, baseProp.ref);
                        // Record as new property (no price change)
                        await recordPriceChange(supabaseAdmin, baseProp.cod_ofer, null, newPrice, 'New property synced');
                    } else {
                        console.warn(`[Sync] Error inserting property ${baseProp.cod_ofer}:`, error);
                    }
                }
            } catch (propError) {
                console.error(`[Sync] Error processing property ${baseProp.cod_ofer}:`, propError);
            }
        }

        console.log(`[Sync] Sync completed:`);
        console.log(`  ✅ New: ${newCount}`);
        console.log(`  🔄 Updated: ${updatedCount}`);
        console.log(`  💰 Price changes: ${priceChanges}`);
        console.log(`  📊 Total: ${successCount}/${validProperties.length}`);

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
    if (!(await requireAdmin())) return { success: false, synced: 0, total: 0, isComplete: false, error: 'No autorizado' };
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

        // Filter valid properties (must have a numeric cod_ofer — Inmovilla rows always do)
        const validProperties = allProperties.filter((p): p is typeof p & { cod_ofer: number } =>
            p.cod_ofer != null &&
            !p.nodisponible &&
            !p.prospecto &&
            !isNaN(p.cod_ofer) &&
            !!p.ref &&
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
                    tipo: resolveTipo(details),
                    precio: details.precioinmo || details.precio || 0,
                    poblacion: resolvePoblacion(details) || prop.poblacion,
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
                    // Update only description_es, preserving existing translations
                    const { data: existingMeta } = await supabaseAdmin
                        .from('property_metadata')
                        .select('descriptions')
                        .eq('cod_ofer', prop.cod_ofer)
                        .maybeSingle();
                    const mergedDescs = {
                        ...(existingMeta?.descriptions || {}),
                        description_es: details.descripciones || prop.descripciones || ''
                    };
                    await supabaseAdmin
                        .from('property_metadata')
                        .update({ descriptions: mergedDescs })
                        .eq('cod_ofer', prop.cod_ofer);

                    // Generate/Update URLs
                    await syncPropertyUrls(supabaseAdmin, prop.cod_ofer, prop.ref);

                    // Also upsert to property_features for fast querying
                    const habitacionesSimples = details.habitaciones || 0;
                    const habitacionesDobles = details.habdobles || 0;
                    const totalHabitaciones = habitacionesSimples + habitacionesDobles;

                    const featureData = {
                        cod_ofer: prop.cod_ofer,
                        precio: details.precioinmo || details.precio || 0,
                        precioalq: (details as any).precioalq || 0,
                        outlet: (details as any).outlet || 0,
                        keyacci: details.keyacci || 1,
                        habitaciones: totalHabitaciones,
                        habitaciones_simples: habitacionesSimples,
                        habitaciones_dobles: habitacionesDobles,
                        banos: details.banyos || 0,
                        aseos: (details as any).aseos || 0,
                        superficie: details.m_utiles || details.m_cons || 0,
                        m_utiles: details.m_utiles || 0,
                        m_terraza: (details as any).m_terraza || 0,
                        m_parcela: (details as any).m_parcela || 0,
                        plantas: Math.max(0, details.planta || 0),
                        ascensor: Boolean(details.ascensor),
                        parking: Boolean(details.garaje),
                        parking_tipo: (details as any).parking ? parseInt(String((details as any).parking)) : 0,
                        terraza: Boolean(details.terraza),
                        piscina_com: Boolean(details.piscina_com),
                        piscina_prop: Boolean((details as any).piscina_prop),
                        aire_con: Boolean(details.aire_con),
                        calefaccion: Boolean(details.calefaccion),
                        diafano: Boolean((details as any).diafano),
                        todoext: Boolean((details as any).todoext),
                        zona: (details as any).zona || null,
                        tipo: details.tipo_nombre || null,
                        distmar: (details as any).distmar || 0,
                        latitud: details.latitud ? parseFloat(String(details.latitud)) : null,
                        longitud: details.longitud ? parseFloat(String(details.longitud)) : null,
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
    // cod_ofer can be null for CRM-only properties not yet synced to Inmovilla.
    cod_ofer: number | null;
    // Optional ref so the email subject can still identify the property.
    ref?: string;
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

    try {
        // Resolve property reference for the email. Prefer the ref the
        // caller passed in (CRM-friendly path); otherwise look it up by
        // cod_ofer (legacy Inmovilla path).
        let propertyRef = formData.ref || 'General';
        if (propertyRef === 'General' && formData.cod_ofer && formData.cod_ofer > 0) {
            try {
                const { supabase } = await import('@/lib/supabase');
                const { data: propData } = await supabase
                    .from('property_metadata')
                    .select('ref')
                    .eq('cod_ofer', formData.cod_ofer)
                    .maybeSingle();
                if (propData?.ref) propertyRef = propData.ref;
            } catch (e) {
                console.warn('Could not resolve ref for cod_ofer:', formData.cod_ofer);
            }
        }

        // Store in Supabase (Internal backup)
        const { supabase } = await import('@/lib/supabase');
        if (process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)) {
            await supabase.from('leads').insert([{
                ...formData,
                created_at: new Date().toISOString()
            }]);
        }

        // Send notification email
        try {
            const { data: settingsData } = await supabaseAdmin
                .from('company_settings')
                .select('value')
                .eq('key', 'notifications_email')
                .maybeSingle();
            
            const notificationTarget = settingsData?.value || 'info@vidahome.es';
            const { sendNotificationEmail } = await import('@/lib/mail');
            
            // Format Subject: Solicitud [REF] Nombre Apellidos
            const subject = `Solicitud [${propertyRef}] ${formData.nombre} ${formData.apellidos}`;
            
            await sendNotificationEmail(
                notificationTarget,
                subject,
                `
                <h2>Nueva solicitud de contacto</h2>
                <p><strong>Nombre:</strong> ${formData.nombre} ${formData.apellidos}</p>
                <p><strong>Email:</strong> ${formData.email}</p>
                <p><strong>Teléfono:</strong> ${formData.telefono}</p>
                <p><strong>Mensaje:</strong> ${formData.mensaje}</p>
                <p><strong>Propiedad (código):</strong> ${propertyRef}</p>
                `
            );
        } catch (mailErr) {
            console.error('Error sending lead notification email:', mailErr);
        }

        return { success: true };
    } catch (error: any) {
        console.error('Lead Submission Error:', error);
        return { success: false, error: error.message };
    }
}

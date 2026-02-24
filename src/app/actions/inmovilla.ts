'use server';

import { createInmovillaApi } from '@/lib/api/properties';
import { PropertyListEntry, PropertyDetails } from '@/types/inmovilla';
import { apiCache } from '@/lib/api/cache';
import { headers } from 'next/headers';
import { revalidateTag, unstable_cache } from 'next/cache';
import { getLocale } from 'next-intl/server';

/**
 * Helper to map next-intl locale to Inmovilla language code
 * 1 = Spanish, 2 = English
 */
function mapLocaleToInmovillaId(locale: string): number {
    switch (locale) {
        case 'en': return 2;
        case 'fr': return 3;
        case 'de': return 4;
        case 'it': return 5; // Added Italian
        case 'pl': return 6; // Added Polish
        case 'es':
        default: return 1;
    }
}

// ─── Función interna cacheada con Next.js Data Cache ─────────────────────────
// IMPORTANTE: La caché es por idioma. Cada locale tiene su propia entrada.
async function _fetchPropertiesFromApiRaw(numagencia: string, password: string, addnumagencia: string, clientIp: string, domain: string, inmoLang: number): Promise<PropertyListEntry[]> {
    console.log(`[Actions] Next.js Cache miss: Fetching from Web API (IP: ${clientIp}, Lang: ${inmoLang})...`);
    const { InmovillaWebApiService } = await import('@/lib/api/web-service');
    const api = new InmovillaWebApiService(numagencia, password, addnumagencia, inmoLang, clientIp, domain);
    const properties: PropertyListEntry[] = await api.getProperties({ page: 1 });

    if (!properties || properties.length === 0) return [];

    return properties
        .filter(p =>
            !p.nodisponible &&
            !p.prospecto &&
            !isNaN(p.cod_ofer) &&
            p.ref &&
            p.ref.trim() !== '' &&
            p.ref !== '2494' &&
            p.cod_ofer !== 2494
        )
        .sort((a, b) => b.cod_ofer - a.cod_ofer);
}

// Devuelve una versión cacheada de la función, con clave única por idioma
function _getLocaleAwarePropertyFetcher(locale: string) {
    const tag = `inmovilla_property_list_v9_${locale}`;
    return unstable_cache(_fetchPropertiesFromApiRaw, [tag], { revalidate: 60, tags: [tag] });
}

export async function fetchPropertiesAction(): Promise<{
    success: boolean;
    data?: PropertyListEntry[];
    error?: string;
    isConfigured: boolean;
    meta?: { populations: string[] };
}> {
    const locale = await getLocale();
    const inmoLang = mapLocaleToInmovillaId(locale);

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
        const _fetchPropertiesFromApi = _getLocaleAwarePropertyFetcher(locale);
        let properties = await _fetchPropertiesFromApi(numagencia!, password!, addnumagencia, clientIp, domain, inmoLang);

        // --- Enrichment with Supabase Metadata starts here ---
        try {
            const { supabase } = await import('@/lib/supabase');
            // Fetch from property_metadata (source of truth for translations)
            const { data: metadata } = await supabase
                .from('property_metadata')
                .select('cod_ofer, descriptions, full_data');

            if (metadata && metadata.length > 0) {
                properties = properties.map(p => {
                    const meta = metadata.find(m => m.cod_ofer === p.cod_ofer);
                    if (!meta) return p;

                    let bestDescription = p.descripciones;
                    
                    // Try translations first
                    if (meta.descriptions) {
                        const descriptions = meta.descriptions as Record<string, string>;
                        const langKey = `description_${locale}`;
                        const translated = descriptions[langKey];

                        if (translated) {
                            bestDescription = translated;
                        } else if (descriptions.description_es) {
                            bestDescription = descriptions.description_es;
                        }
                    }
                    
                    // Fallback to full_data if no description found
                    if (!bestDescription && meta.full_data) {
                        const fullData = meta.full_data as any;
                        bestDescription = fullData.descripciones;
                    }

                    return {
                        ...p,
                        descripciones: bestDescription
                    };
                });
            }
        } catch (supaError) {
            console.warn('[Actions] Supabase properties enrichment failed:', supaError);
        }
        // --- Enrichment ends here ---

        const populations = [...new Set(properties.map(p => p.poblacion).filter(Boolean))].sort() as string[];

        return { success: true, data: properties, isConfigured: true, meta: { populations } };
    } catch (error: any) {
        console.error('[Actions] fetchProperties Error:', error);
        return { success: false, isConfigured: true, error: error.message || 'Error al conectar con Inmovilla' };
    }
}

export async function getPropertyDetailAction(id: number): Promise<{ success: boolean; data?: PropertyDetails; error?: string }> {
    const locale = await getLocale();
    const inmoLang = mapLocaleToInmovillaId(locale);

    const numagencia = process.env.INMOVILLA_AGENCIA;
    const addnumagencia = process.env.INMOVILLA_ADDAGENCIA || '';
    const password = process.env.INMOVILLA_PASSWORD;
    const domain = process.env.INMOVILLA_DOMAIN || 'vidahome.es';

    if (!numagencia || !password) return { success: false, error: 'Credenciales no configuradas' };

    const cacheKey = `prop_detail_v11_${id}_${locale}`;
    const cachedDetail = apiCache.get<PropertyDetails>(cacheKey);
    if (cachedDetail) return { success: true, data: cachedDetail };

    // --- STEP 0: Check Supabase FIRST for FULL DATA (Super-fast path) ---
    try {
        const { supabase } = await import('@/lib/supabase');
        const { data: meta } = await supabase
            .from('property_metadata')
            .select('cod_ofer, descriptions, full_data')
            .eq('cod_ofer', id)
            .single();

        if (meta && meta.descriptions && meta.full_data) {
            const descriptions = meta.descriptions as Record<string, string>;
            const langKey = `description_${locale}`;
            const translation = descriptions[langKey];

            if (translation || locale === 'es') {
                console.log(`[Actions] 🚀 SUPABASE-FIRST: Full data HIT for ${id} in '${locale}'`);
                // Return complete property data with correct description for the locale
                const fullData = meta.full_data as any;
                fullData.descripciones = translation || descriptions.description_es || fullData.descripciones;
                fullData.all_descriptions = descriptions;
                return {
                    success: true,
                    data: fullData
                };
            }
        }
        console.log(`[Actions] ⏳ Cache MISS for ${id}, fetching from Inmovilla...`);
    } catch (supaErr) {
        console.warn('[Actions] Supabase pre-fetch failed, falling back to API:', supaErr);
    }

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
        const api = new InmovillaWebApiService(numagencia, password, addnumagencia, inmoLang, clientIp, domain);
        const details = await api.getPropertyDetails(id);

        if (!details || details.nodisponible || details.prospecto || details.ref === '2494' || details.cod_ofer === 2494) {
            return { success: false, error: 'La propiedad solicitada no está disponible actualmente' };
        }

        // --- STEP 2: AI Translation only if Supabase had no cached translation ---
        const needsTranslation = locale !== 'es' && (!details.all_descriptions || !details.all_descriptions[locale]);
        const spanishText = details.all_descriptions?.es || (locale === 'es' ? details.descripciones : null);

        if (needsTranslation && spanishText && spanishText.length > 20) {
            try {
                const { translateText } = await import('@/lib/api/translator');
                console.log(`[Actions] 🤖 AI Translating property ${id} from 'es' to '${locale}'...`);
                // Timeout de 8 segundos para no bloquear la experiencia del usuario
                const translated = await translateText(spanishText, 'es', locale, 8000);

                if (translated) {
                    details.descripciones = translated;
                    if (!details.all_descriptions) details.all_descriptions = {};
                    details.all_descriptions[locale] = translated;
                    console.log(`[Actions] ✅ AI Translation successful for ${id}`);
                } else {
                    // Fallback: show Spanish description rather than nothing
                    if (spanishText && !details.descripciones) {
                        details.descripciones = spanishText;
                    }
                }
            } catch (transError) {
                console.warn('[Actions] AI Translation failed, falling back to Spanish:', transError);
                if (spanishText) details.descripciones = spanishText;
            }
        }

        // --- Auto-Learn: Sync everything to Supabase for the catalog and super-fast path ---
        try {
            const { supabaseAdmin } = await import('@/lib/supabase-admin');

            // Fix: Ensure the current locale translation is explicitly in the descriptions map
            const currentDescriptions = { ...(details.all_descriptions || {}) };
            if (locale && details.descripciones && !currentDescriptions[locale]) {
                currentDescriptions[locale] = details.descripciones;
            }

            const upsertData: any = {
                cod_ofer: details.cod_ofer,
                ref: details.ref,
                full_data: { ...details, all_descriptions: currentDescriptions },
                descriptions: currentDescriptions,
                updated_at: new Date().toISOString()
            };

            if (currentDescriptions.es) {
                upsertData.description = currentDescriptions.es;
            } else if (locale === 'es' && details.descripciones) {
                upsertData.description = details.descripciones;
            }

            await supabaseAdmin.from('property_metadata').upsert(upsertData, { onConflict: 'cod_ofer' });
            console.log(`[Actions] 💾 Property ${id} synced to Supabase (Full Data, Locales: ${Object.keys(currentDescriptions).join(', ')})`);
        } catch (supaError) {
            console.warn('[Actions] Auto-sync multi-lang metadata failed:', supaError);
        }
        // --- Auto-Learn ends here ---

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

const getCachedFeaturedIds = unstable_cache(
    async () => {
        const { supabase } = await import('@/lib/supabase');
        const { data, error } = await supabase
            .from('featured_properties')
            .select('cod_ofer')
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data.map(item => item.cod_ofer);
    },
    ['featured_ids_v1'],
    { revalidate: 3600, tags: ['featured_properties'] }
);

export async function getFeaturedPropertiesAction(): Promise<number[]> {
    try {
        return await getCachedFeaturedIds();
    } catch (e) {
        console.error('Error fetching featured properties from Supabase:', e);
        return [];
    }
}

export async function getFeaturedPropertiesWithDetailsAction(): Promise<{ success: boolean; data: any[] }> {
    const locale = await getLocale();

    // Use cached version per locale for better performance
    return await getCachedFeaturedPropertiesForLocale(locale);
}

// Cached version that varies by locale - improves SSR performance
const getCachedFeaturedPropertiesForLocale = unstable_cache(
    async (locale: string) => {
        const featuredIds = await getFeaturedPropertiesAction();

        if (featuredIds.length === 0) return { success: true, data: [] };

        try {
            // --- BATCH FAST PATH ---
            const { supabase } = await import('@/lib/supabase');
            const { data: metadata, error } = await supabase
                .from('property_metadata')
                .select('cod_ofer, full_data, descriptions')
                .in('cod_ofer', featuredIds);

            if (error) throw error;

            const results: any[] = [];
            const missingIds: number[] = [];

            featuredIds.forEach(id => {
                const meta = metadata?.find(m => m.cod_ofer === id);
                if (meta && meta.full_data) {
                    const data = meta.full_data as PropertyDetails;
                    // Check for current locale translation
                    const translation = meta.descriptions?.[locale] || data.all_descriptions?.[locale];

                    if (translation || locale === 'es') {
                        if (translation) data.descripciones = translation;
                        // Ensure the data object has the correct descriptions map for consistency
                        if (!data.all_descriptions) data.all_descriptions = meta.descriptions || {};
                        results.push(data);
                        return;
                    }
                }
                // If any property is missing or lacks translation, queue for individual fetch
                missingIds.push(id);
            });

            if (missingIds.length > 0) {
                console.log(`[Actions] Featured: ${missingIds.length} properties missing from bulk cache, fetching individually...`);
                const individualPromises = missingIds.map(id => getPropertyDetailAction(id));
                const individualResults = await Promise.all(individualPromises);

                individualResults.forEach(res => {
                    if (res.success && res.data) {
                        results.push(res.data);
                    }
                });
            }

            // Sort results to match original featuredIds order
            const sortedResults = featuredIds
                .map(id => results.find(r => r.cod_ofer === id))
                .filter(Boolean);

            return { success: true, data: sortedResults };
        } catch (error) {
            console.error('Error enriching featured properties:', error);
            // Fallback to individual fetching if batch fails
            const featuredIds = await getFeaturedPropertiesAction();
            const detailPromises = featuredIds.map((id: number) => getPropertyDetailAction(id));
            const results = await Promise.all(detailPromises);
            const validDetails = results.filter(res => res.success && res.data).map(res => res.data);
            return { success: true, data: validDetails };
        }
    },
    ['featured_with_details'],
    { revalidate: 3600, tags: ['featured_properties'] } // Cache per locale for 1 hour
);

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

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
            const { data: metadata } = await supabase
                .from('property_metadata')
                .select('cod_ofer, description, descriptions');

            if (metadata && metadata.length > 0) {
                properties = properties.map(p => {
                    const meta = metadata.find(m => m.cod_ofer === p.cod_ofer);
                    if (!meta) return p;

                    // Prioridad: descriptions JSONB (multi-idioma) > description (legacy)
                    let bestDescription = p.descripciones;

                    if (meta.descriptions && typeof meta.descriptions === 'object') {
                        const langDesc = (meta.descriptions as any)[locale];
                        if (langDesc) {
                            bestDescription = langDesc;
                        } else {
                            // Fallback a español si el idioma actual no existe en la caché
                            const esDesc = (meta.descriptions as any)['es'];
                            if (esDesc) bestDescription = esDesc;
                        }
                    } else if (meta.description) {
                        // Fallback legacy (columna simple)
                        bestDescription = meta.description;
                    }

                    return {
                        ...p,
                        descripciones: bestDescription
                    };
                });
            }
        } catch (supaError) {
            console.warn('[Actions] Supabase metadata enrichment failed:', supaError);
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
            .select('full_data, descriptions, ref')
            .eq('cod_ofer', id)
            .single();

        if (meta && meta.full_data) {
            const data = meta.full_data as PropertyDetails;
            // Ensure we have the translation for current locale
            const translation = meta.descriptions?.[locale] || data.all_descriptions?.[locale];

            if (translation || locale === 'es') {
                if (translation) data.descripciones = translation;
                if (!data.all_descriptions) data.all_descriptions = meta.descriptions || {};

                console.log(`[Actions] 🚀 SUPABASE-FIRST: Full cache HIT for ${id} in '${locale}'`);
                apiCache.set(cacheKey, data);
                return { success: true, data };
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
            const upsertData: any = {
                cod_ofer: details.cod_ofer,
                ref: details.ref,
                full_data: details, // Store full object for bypass
                descriptions: details.all_descriptions || {},
                updated_at: new Date().toISOString()
            };

            if (details.all_descriptions?.es) {
                upsertData.description = details.all_descriptions.es;
            } else if (locale === 'es' && details.descripciones) {
                upsertData.description = details.descripciones;
                if (!upsertData.descriptions.es) upsertData.descriptions.es = details.descripciones;
            }

            await supabaseAdmin.from('property_metadata').upsert(upsertData, { onConflict: 'cod_ofer' });
            console.log(`[Actions] 💾 Property ${id} synced to Supabase (Full Data)`);
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

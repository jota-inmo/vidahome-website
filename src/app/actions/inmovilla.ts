'use server';

import { PropertyListEntry, PropertyDetails } from '@/types/inmovilla';
import tiposMap from '@/lib/api/tipos_map.json';
import localidadesMap from '@/lib/api/localidades_map.json';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkRateLimit } from '@/lib/rate-limit';

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
 * Encargo columns needed from the CRM to fill in the fields the website
 * reads from `full_data`. Kept minimal — solo los campos que la UI
 * consume. Si añades un nuevo campo en PropertyDetailClient que lea de
 * full_data, añádelo también aquí.
 */
const ENCARGO_COLUMNS_FOR_WEB =
    'precio, num_hab_dobles, num_hab_simples, num_banos, num_aseos, ' +
    'loc_m2_const, loc_m2_util, tipo_vivienda, poblacion, res_ori, ' +
    'res_asc, res_gar, res_tras, edi_ano_construccion, ' +
    'edi_clase_energetica, edi_consumo_energia, edi_calificacion_emisiones, ' +
    'edi_emisiones, edi_estado_conservacion, res_t1, res_t2, res_t3, ' +
    'res_patio, com_mes, ibi_anual, "contractType", calefaccion, ' +
    'aire_acondicionado, armarios_empotrados, balcon, cocina_independiente, ' +
    'adaptado_movilidad, jardin_propio, piscina_comunitaria, ' +
    'piscina_privada, amueblado, planta';

function numOrUndef(v: unknown): number | undefined {
    if (v === null || v === undefined || v === '') return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
}

function parseSiNo(v: unknown): boolean | undefined {
    if (v === null || v === undefined || v === '') return undefined;
    if (typeof v === 'boolean') return v;
    const s = String(v).toLowerCase().trim();
    if (s === 'sí' || s === 'si' || s === 'true' || s === '1') return true;
    if (s === 'no' || s === 'false' || s === '0') return false;
    return undefined;
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(obj)) {
        if (obj[k] !== undefined) out[k] = obj[k];
    }
    return out as Partial<T>;
}

/**
 * Mapea una fila de `encargos` (+ pub_overrides) a la forma que usa
 * `property_metadata.full_data` (campos Inmovilla). Pensado para refs
 * CRM-only donde `full_data` está vacío, o para refs Inmovilla cuyos
 * datos CRM son más recientes que el último pull.
 *
 * Prioridad segun CLAUDE.md: pub_overrides > encargo > full_data. Este
 * helper devuelve el merge de (encargo + overrides). El caller mergeá
 * después sobre full_data.
 *
 * Inmovilla divide "habitaciones" en sencillas vs dobles:
 *   - full_data.habitaciones = num_hab_simples
 *   - full_data.habdobles   = num_hab_dobles
 * La UI suma ambos para mostrar el total.
 */
function encargoToFullDataShape(
    enc: Record<string, unknown> | null,
    overrides: Record<string, unknown> | null = null,
): Record<string, unknown> {
    if (!enc && !overrides) return {};
    const merged = { ...(enc || {}), ...(overrides || {}) };
    // contractType → keyacci de Inmovilla (1 = venta/traspaso, 2 = alquiler).
    // Sin esto el filtro Comprar/Alquilar del catálogo trata el keyacci
    // undefined como "pasa en ambos" y el inmueble aparece en las dos
    // pestañas (regresión vista en 2980 tras la fusión).
    const ct = (merged.contractType as string) || '';
    const keyacci = ct.startsWith('alquiler') ? 2 : (ct ? 1 : undefined);
    return stripUndefined({
        keyacci,
        precio: numOrUndef(merged.precio),
        // Inmovilla guarda el precio en `precioinmo` (ventas) o `precioalq`
        // (alquileres). Refs CRM-only que nunca pasaron por el pull de
        // Inmovilla no tienen ninguno de los dos en full_data. Rellenamos
        // ambos desde encargos.precio:
        //  - precioinmo siempre, porque PropertyDetailClient lo usa como
        //    fuente única sin distinguir keyacci.
        //  - precioalq solo cuando keyacci===2, porque
        //    LuxuryPropertyCard (listado) y effectivePrice (sort) leen
        //    de un campo u otro según keyacci. Sin esto, los alquileres
        //    CRM-only muestran "Precio bajo consulta" en el listado.
        precioinmo: numOrUndef(merged.precio),
        precioalq: keyacci === 2 ? numOrUndef(merged.precio) : undefined,
        habitaciones: numOrUndef(merged.num_hab_simples),
        habdobles: numOrUndef(merged.num_hab_dobles),
        banyos: numOrUndef(merged.num_banos),
        aseos: numOrUndef(merged.num_aseos),
        m_cons: numOrUndef(merged.loc_m2_const),
        m_util: numOrUndef(merged.loc_m2_util),
        ano_cons: numOrUndef(merged.edi_ano_construccion),
        tipo_nombre: (merged.tipo_vivienda as string) || undefined,
        // `ciudad` es el campo legacy del formulario, `poblacion` es el
        // split nuevo. Muchos encargos solo tienen `ciudad` — fallback.
        poblacion: (merged.poblacion as string) || (merged.ciudad as string) || undefined,
        orientacion: (merged.res_ori as string) || undefined,
        ascensor: parseSiNo(merged.res_asc),
        garaje: parseSiNo(merged.res_gar),
        trastero: parseSiNo(merged.res_tras),
        terraza: parseSiNo(merged.res_t1) || parseSiNo(merged.res_t2) || parseSiNo(merged.res_t3) || undefined,
        patio: parseSiNo(merged.res_patio),
        jardin: parseSiNo(merged.jardin_propio),
        piscina: parseSiNo(merged.piscina_comunitaria) || parseSiNo(merged.piscina_privada) || undefined,
        amueblado: (merged.amueblado as string) || undefined,
        calefaccion: (merged.calefaccion as string) || undefined,
        aire_acondicionado: (merged.aire_acondicionado as string) || undefined,
        armarios: parseSiNo(merged.armarios_empotrados),
        balcon: parseSiNo(merged.balcon),
        cocina_independiente: parseSiNo(merged.cocina_independiente),
        adaptado_movilidad: parseSiNo(merged.adaptado_movilidad),
        com_mes: numOrUndef(merged.com_mes),
        ibi_anual: numOrUndef(merged.ibi_anual),
        estado_conservacion: (merged.edi_estado_conservacion as string) || undefined,
        planta: numOrUndef(merged.planta) ?? ((merged.planta as string) || undefined),
    });
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
                updated_at,
                pub_overrides,
                source
            `)
            .eq('visible_web', true)
            .or(`nodisponible.eq.false,and(nodisponible.eq.true,updated_at.gte.${tenDaysAgo})`)
            .order('nodisponible', { ascending: true })
            .order('updated_at', { ascending: false });

        if (error) throw error;

        // Batch-fetch encargos para refs visibles. Rellena los campos que
        // viven en el CRM (precio, habs, m²…) cuando full_data está vacío.
        // Ref es el PK del encargo, así que usamos .in('ref', refs).
        const refs = (properties || []).map((p: any) => p.ref).filter(Boolean);
        const encargosByRef = new Map<string, Record<string, unknown>>();
        if (refs.length > 0) {
            const { data: encs } = await supabase
                .from('encargos')
                .select(`ref, ${ENCARGO_COLUMNS_FOR_WEB}`)
                .in('ref', refs);
            for (const e of (encs || [])) {
                if ((e as any).ref) encargosByRef.set(String((e as any).ref), e as Record<string, unknown>);
            }
        }

        // Map database records to PropertyListEntry format
        const descKey = getDescriptionKey(locale);
        const formatted: PropertyListEntry[] = (properties || []).map((row: any) => {
            const rawFullData = row.full_data || {};
            const descriptions = (row.descriptions as Record<string, string>) || {};

            // Merge CRM encargo + pub_overrides on top of full_data para que
            // refs CRM-only muestren datos. Mismo helper que el detalle.
            const encFull = encargoToFullDataShape(
                encargosByRef.get(row.ref) || null,
                row.pub_overrides || null,
            );
            const fullData: Record<string, any> = { ...rawFullData, ...encFull };

            const habitaciones = ((Number(fullData.habitaciones) || 0) + (Number(fullData.habdobles) || 0)) || 0;
            const banyos = Number(fullData.banyos) || 0;
            const aseos = Number(fullData.aseos) || 0;
            const m_cons = Number(fullData.m_cons) || 0;

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
                habitaciones,
                banyos,
                aseos,
                m_cons,
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
        const SELECT_COLS = 'cod_ofer, ref, full_data, descriptions, photos, main_photo, poblacion, nodisponible, visible_web, energy_label, energy_consumption, emissions_label, emissions_value, pub_overrides, tipo, precio, source';

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

        if (error || !meta) {
            return { success: false, error: 'Propiedad no encontrada' };
        }

        // Block detail page for deactivated or hidden properties
        if ((meta as any).nodisponible || (meta as any).visible_web === false) {
            return { success: false, error: 'Propiedad no disponible' };
        }

        // Get full property data from stored full_data
        const rawFullData = (meta.full_data as PropertyDetails) || {};

        // Fill gaps from the CRM encargo + pub_overrides. Crítico para refs
        // CRM-only (source='crm') donde full_data está vacío — antes del fix
        // la ficha web salía sin precio, habitaciones ni m² aunque el agente
        // hubiera metido todo en el CRM. Priority segun CLAUDE.md:
        // pub_overrides > encargo > full_data. Orden del merge refleja eso.
        let encargoRow: Record<string, unknown> | null = null;
        if (meta.ref) {
            const { data: enc } = await supabase
                .from('encargos')
                .select(ENCARGO_COLUMNS_FOR_WEB)
                .ilike('ref', meta.ref)
                .maybeSingle();
            encargoRow = enc as Record<string, unknown> | null;
        }
        const encargoAsFullData = encargoToFullDataShape(
            encargoRow,
            (meta as { pub_overrides?: Record<string, unknown> | null }).pub_overrides || null,
        );
        const fullData = { ...rawFullData, ...encargoAsFullData } as PropertyDetails;

        // Apply correct locale description
        const descKey = getDescriptionKey(locale);
        const descriptions = (meta.descriptions as Record<string, string>) || {};
        const localizedDesc = descriptions[descKey] || descriptions.description_es || fullData.descripciones || '';

        const habitaciones = ((Number(fullData.habitaciones) || 0) + (Number((fullData as { habdobles?: number | string }).habdobles) || 0)) || 0;
        const banyos = Number(fullData.banyos) || 0;
        const aseos = Number((fullData as { aseos?: number | string }).aseos) || 0;
        const m_cons = Number(fullData.m_cons) || 0;

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

        // PRIVACY: strip street address from public data — never expose
        // calle/dir to the website. Only poblacion (city) is public.
        const { calle: _calle, dir: _dir, ...safeFullData } = fullData as any;

        // Enrich with photos if available
        const propertyWithPhotos = {
            ...safeFullData,
            cod_ofer: meta.cod_ofer,
            ref: meta.ref,
            descripciones: localizedDesc,
            all_descriptions: descriptions,
            fotos_lista,
            main_photo,
            mainImage: main_photo,
            tipo_nombre: resolvedTipoNombre,
            habitaciones,
            banyos,
            aseos,
            m_cons,
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

        const { data: metadata, error } = await supabase
            .from('property_metadata')
            .select('cod_ofer, full_data, descriptions, main_photo, photos, ref, tipo, precio, poblacion, nodisponible, visible_web')
            .in('cod_ofer', featuredIds)
            .eq('visible_web', true)
            .eq('nodisponible', false);

        if (error) throw error;

        // Preserve order from featured_properties table and format correctly
        const results = featured
            .map(featuredItem => {
                const meta = metadata?.find(m => m.cod_ofer === featuredItem.cod_ofer);
                if (!meta || !meta.full_data) return null;

                const fullData = meta.full_data as PropertyDetails || {};
                const descriptions = meta.descriptions as Record<string, string> || {};
                const descKey = getDescriptionKey(locale);
                const localizedDesc = descriptions[descKey] || descriptions.description_es || fullData.descripciones || '';

                const habitaciones = ((Number(fullData.habitaciones) || 0) + (Number((fullData as { habdobles?: number | string }).habdobles) || 0)) || 0;
                const banyos = Number(fullData.banyos) || 0;
                const aseos = Number((fullData as { aseos?: number | string }).aseos) || 0;
                const m_cons = Number(fullData.m_cons) || 0;

                return {
                    ...fullData,
                    cod_ofer: meta.cod_ofer,
                    ref: meta.ref,
                    mainImage: meta.main_photo,
                    habitaciones,
                    banyos,
                    aseos,
                    m_cons,
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

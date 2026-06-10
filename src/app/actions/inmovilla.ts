'use server';

import { PropertyListEntry, PropertyDetails } from '@/types/inmovilla';
import tiposMap from '@/lib/api/tipos_map.json';
import localidadesMap from '@/lib/api/localidades_map.json';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { parseSpanishNumber } from '@/lib/utils/parse-spanish-number';
import { getPublicCoords, coerceCoord } from '@/lib/utils/coords';
import { encargoToFullDataShape } from '@/lib/utils/encargo-shape';
import { getPublicTenantClient } from '@/lib/tenantClient';

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
    'piscina_privada, amueblado, planta, ' +
    // Coords duales: lat_exacta + lng_exacta nunca salen tal cual al
    // visitor — pasan por getPublicCoords con jitter por defecto.
    // ubicacion_exacta_publica es el opt-in del agente (default false).
    'lat_exacta, lng_exacta, ubicacion_exacta_publica';

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
        const supabase = await getPublicTenantClient();

        // Visibilidad web:
        //  - Activas: visible_web=true AND nodisponible=false
        //  - Cierre con motivo de operación (vendido / alquilado / traspasado):
        //    visible_web=true AND deactivation_reason IN (...) AND deactivated_at
        //    > NOW() - app_config.deactivation_grace_days (default 7).
        //
        // Antes usábamos `updated_at` como proxy, lo que mantenía visible
        // cualquier touch al row durante 10d aunque el motivo fuera "pausada".
        // Desde 2026-05-08 la columna `deactivation_reason` distingue el motivo
        // y `deactivated_at` ancla el inicio del grace period.
        let graceDays = 7;
        try {
            const { data: cfg } = await supabase
                .from('app_config')
                .select('value')
                .eq('key', 'deactivation_grace_days')
                .maybeSingle();
            const v = (cfg as { value?: unknown } | null)?.value;
            const n = typeof v === 'number' ? v : Number(v);
            if (Number.isFinite(n) && n > 0 && n <= 365) graceDays = n;
        } catch { /* default 7 */ }
        const graceCutoff = new Date(Date.now() - graceDays * 24 * 60 * 60 * 1000).toISOString();
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
                source,
                deactivation_reason,
                deactivated_at
            `)
            .eq('visible_web', true)
            .or(`and(nodisponible.eq.false,deactivation_reason.is.null),and(deactivation_reason.in.(vendido,vendido_por_otros,alquilado,traspasado),deactivated_at.gte.${graceCutoff})`)
            .order('nodisponible', { ascending: true })
            .order('deactivated_at', { ascending: false, nullsFirst: false })
            .order('updated_at', { ascending: false });

        if (error) throw error;

        // Batch-fetch encargos para refs visibles. Rellena los campos que
        // viven en el CRM (precio, habs, m²…) cuando full_data está vacío.
        // Ref es el PK del encargo, así que usamos .in('ref', refs).
        const refs = (properties || []).map((p: any) => p.ref).filter(Boolean);
        const encargosByRef = new Map<string, Record<string, unknown>>();
        if (refs.length > 0) {
            // encargos_public_view: vista anon-readable (Phase 0 v2 F.6
            // bloqueó el SELECT directo a `encargos` para el rol anon). La
            // vista expone solo columnas seguras — sin owners/NIF/honorarios.
            const { data: encs, error: encsError } = await supabase
                .from('encargos_public_view')
                .select(`ref, ${ENCARGO_COLUMNS_FOR_WEB}`)
                .in('ref', refs);
            if (encsError) {
                console.error('[inmovilla] encargos_public_view batch query failed:', encsError);
            }
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

            // `property_metadata.precio` es numeric limpio (escrito por
            // publish_to_web). `fullData.precioinmo` viene de encargos.precio
            // (text), que aunque ya pasamos por parseSpanishNumber puede estar
            // desincronizado con el último cambio de precio. Preferimos pm.precio
            // como source-of-truth para el display web.
            const cleanPrecio = parseSpanishNumber(row.precio);
            const precioinmoFinal = cleanPrecio ?? fullData.precioinmo;
            const precioalqFinal = fullData.keyacci === 2
                ? (cleanPrecio ?? fullData.precioalq)
                : fullData.precioalq;

            return {
                cod_ofer: row.cod_ofer,
                ref: row.ref,
                tipo: row.tipo,
                precio: cleanPrecio ?? fullData.precioinmo ?? 0,
                poblacion: row.poblacion || fullData.poblacion || '',
                nodisponible: !!row.nodisponible,
                mainImage: row.main_photo,
                // Use accurate data from property_features or full_data fallback
                keyacci: fullData.keyacci,
                precioinmo: precioinmoFinal,
                precioalq: precioalqFinal,
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
                // Cierre con motivo dentro del grace period — el UI lo usa
                // para grayscale + sello "VENDIDO"/"ALQUILADO"/"TRASPASADO".
                deactivation_reason: (row as { deactivation_reason?: string | null }).deactivation_reason ?? null,
                deactivated_at: (row as { deactivated_at?: string | null }).deactivated_at ?? null,
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
        const supabase = await getPublicTenantClient();

        const asString = String(idOrRef).trim();
        const SELECT_COLS = 'cod_ofer, ref, full_data, descriptions, photos, main_photo, poblacion, nodisponible, visible_web, energy_label, energy_consumption, emissions_label, emissions_value, pub_overrides, tipo, precio, source, deactivation_reason, deactivated_at';

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

        // Visibilidad: bloqueamos si visible_web=false. Si nodisponible=true
        // permitimos solo cuando hay deactivation_reason de operación cerrada
        // (vendido/alquilado/traspasado) DENTRO del grace period configurable
        // (default 7d) — el visitor verá la ficha en grayscale con sello.
        const m = meta as unknown as {
            nodisponible?: boolean;
            visible_web?: boolean;
            deactivation_reason?: string | null;
            deactivated_at?: string | null;
        };
        if (m.visible_web === false) {
            return { success: false, error: 'Propiedad no disponible' };
        }
        if (m.nodisponible === true) {
            const inGrace = m.deactivation_reason !== null
                && m.deactivation_reason !== undefined
                && ['vendido', 'vendido_por_otros', 'alquilado', 'traspasado'].includes(m.deactivation_reason)
                && m.deactivated_at != null;
            if (inGrace) {
                let graceDays = 7;
                try {
                    const { data: cfg } = await supabase
                        .from('app_config')
                        .select('value')
                        .eq('key', 'deactivation_grace_days')
                        .maybeSingle();
                    const v = (cfg as { value?: unknown } | null)?.value;
                    const n = typeof v === 'number' ? v : Number(v);
                    if (Number.isFinite(n) && n > 0 && n <= 365) graceDays = n;
                } catch { /* default 7 */ }
                const cutoff = Date.now() - graceDays * 24 * 60 * 60 * 1000;
                const deactAt = new Date(m.deactivated_at!).getTime();
                if (!Number.isFinite(deactAt) || deactAt < cutoff) {
                    return { success: false, error: 'Propiedad no disponible' };
                }
                // Dentro del grace period — caer en el render normal con el flag.
            } else {
                return { success: false, error: 'Propiedad no disponible' };
            }
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
            // encargos_public_view: ver nota en fetchPropertiesAction.
            const { data: enc, error: encError } = await supabase
                .from('encargos_public_view')
                .select(ENCARGO_COLUMNS_FOR_WEB)
                .ilike('ref', meta.ref)
                .maybeSingle();
            if (encError) {
                console.error('[inmovilla] encargos_public_view detail query failed:', encError);
            }
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
            // url_storage añadida 2026-05-06 (migración 20260505180000): bucket
            // Supabase Storage `property-photos` con path `tenants/{slug}/{ref}/{id}.jpg`.
            // Preferimos Storage cuando existe (control total, no depende del CDN
            // externo de Inmovilla); fallback a url_cloudinary (legacy: apinmo CDN
            // o Cloudinary). Mismo resolver que el CRM (`resolvePhotoUrl` en
            // src/services/photoService.ts).
            const { data: cloudinaryFotos } = await supabase
                .from('fotos_inmuebles')
                .select('url_cloudinary, url_storage')
                .eq('ref', meta.ref)
                .or('visible.is.null,visible.eq.true')
                .order('orden', { ascending: true });

            const cloudinaryCount = cloudinaryFotos?.length || 0;
            const coverageOk = inmovillaCount === 0
                ? cloudinaryCount > 0
                : (cloudinaryCount / inmovillaCount) >= PHOTO_COVERAGE_THRESHOLD;

            if (coverageOk && cloudinaryFotos && cloudinaryFotos.length > 0) {
                const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
                const resolvePhotoUrl = (row: { url_storage?: string | null; url_cloudinary?: string | null }): string => {
                    if (row.url_storage && supabaseUrl) {
                        return `${supabaseUrl}/storage/v1/object/public/property-photos/${row.url_storage}`;
                    }
                    return row.url_cloudinary ?? '';
                };
                fotos_lista = cloudinaryFotos
                    .map((f: any) => resolvePhotoUrl(f))
                    .filter((url: string) => url.length > 0);
                main_photo = fotos_lista[0] ?? null;
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

        // Coords duales (2026-05-09): la web NUNCA devuelve coords exactas
        // salvo opt-in explícito del agente (ubicacion_exacta_publica=true).
        // Default: jitter determinista por ref con radio según tipo_vivienda
        // (200m piso / 500m chalet). Si el encargo aún no tiene lat_exacta
        // poblado, dejamos pasar las coords legacy de full_data — pero
        // también jittered. Solo el opt-in expone la coord exacta.
        const encargoCoordsRow = encargoRow as {
            lat_exacta?: unknown;
            lng_exacta?: unknown;
            ubicacion_exacta_publica?: boolean;
            tipo_vivienda?: string | null;
        } | null;
        const exposeExact = encargoCoordsRow?.ubicacion_exacta_publica === true;
        const seedRef = String(meta.ref ?? idOrRef ?? '');
        const tipoVivienda = encargoCoordsRow?.tipo_vivienda || resolvedTipoNombre || null;

        const exactLat = coerceCoord(encargoCoordsRow?.lat_exacta);
        const exactLng = coerceCoord(encargoCoordsRow?.lng_exacta);
        let publicCoords: { lat: number; lng: number } | null = null;
        if (exactLat != null && exactLng != null) {
            publicCoords = getPublicCoords({
                lat: exactLat,
                lng: exactLng,
                seed: seedRef,
                exposeExact,
                tipoVivienda,
            });
        } else {
            // Fallback a coords legacy de full_data — también jittered si
            // no hay opt-in. Si tampoco hay coords legacy, no se devuelven
            // y la web cae en geocoding por poblacion.
            const legacyLat = coerceCoord((safeFullData as { latitud?: unknown }).latitud);
            const legacyLng = coerceCoord((safeFullData as { longitud?: unknown }).longitud);
            if (legacyLat != null && legacyLng != null) {
                publicCoords = getPublicCoords({
                    lat: legacyLat,
                    lng: legacyLng,
                    seed: seedRef,
                    exposeExact,
                    tipoVivienda,
                });
            }
        }
        if (publicCoords) {
            (safeFullData as { latitud?: number; longitud?: number }).latitud = publicCoords.lat;
            (safeFullData as { latitud?: number; longitud?: number }).longitud = publicCoords.lng;
        } else {
            // No coords disponibles — borramos por si acaso quedaron las
            // legacy en safeFullData sin pasar por jitter.
            delete (safeFullData as { latitud?: unknown }).latitud;
            delete (safeFullData as { longitud?: unknown }).longitud;
        }

        // Mismo patrón que `fetchPropertiesAction`: pm.precio es numeric limpio
        // (escrito por publish_to_web) y por tanto la fuente preferida sobre
        // fullData.precioinmo (que viene de encargos.precio text). Sin esto,
        // refs cuyo encargo.precio quedó stale o con formato roto muestran
        // precio mal en la ficha.
        const cleanPrecioDetail = parseSpanishNumber((meta as { precio?: unknown }).precio);
        const precioinmoFinal = cleanPrecioDetail ?? (fullData as { precioinmo?: number }).precioinmo;
        const precioalqFinal = (fullData as { keyacci?: number }).keyacci === 2
            ? (cleanPrecioDetail ?? (fullData as { precioalq?: number }).precioalq)
            : (fullData as { precioalq?: number }).precioalq;

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
            precioinmo: precioinmoFinal,
            precioalq: precioalqFinal,
            // Use resolved poblacion from DB column (preferred) over full_data fallback
            poblacion: (meta as any).poblacion || fullData.poblacion || '',
            // Energy Certificate (from property_metadata, selected above)
            energy_label: (meta as any).energy_label || null,
            energy_consumption: (meta as any).energy_consumption || null,
            emissions_label: (meta as any).emissions_label || null,
            emissions_value: (meta as any).emissions_value || null,
            // Cierre con motivo (vendido/alquilado/traspasado dentro del grace
            // period). El UI usa este flag para renderizar el sello rotado y
            // grayscale + bloquear el formulario de contacto.
            deactivation_reason: (meta as any).deactivation_reason || null,
            deactivated_at: (meta as any).deactivated_at || null,
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
        const supabase = await getPublicTenantClient();
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
        const supabase = await getPublicTenantClient();

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
        const { VIDAHOME_TENANT_ID } = await import('@/lib/tenant');

        // Replace this tenant's featured list. supabaseAdmin uses the service role,
        // which bypasses RLS, so the tenant_id column's DEFAULT app.current_tenant_id()
        // would resolve to NULL — we must scope the delete and stamp the insert with the
        // VidaHome tenant_id explicitly (single-tenant interim, see @/lib/tenant).
        const { error: deleteError } = await supabaseAdmin
            .from('featured_properties')
            .delete()
            .eq('tenant_id', VIDAHOME_TENANT_ID);
        if (deleteError) throw deleteError;

        if (ids.length > 0) {
            const inserts = ids.map(id => ({ cod_ofer: id, tenant_id: VIDAHOME_TENANT_ID }));
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
                const supabase = await getPublicTenantClient();
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
        const { VIDAHOME_TENANT_ID } = await import('@/lib/tenant');
        if (process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)) {
            await supabase.from('leads').insert([{
                ...formData,
                tenant_id: VIDAHOME_TENANT_ID,
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

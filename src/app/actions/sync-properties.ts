'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { InmovillaWebApiService } from '@/lib/api/web-service';

const { INMOVILLA_LANG, INMOVILLA_NUMAGENCIA, INMOVILLA_PASSWORD, INMOVILLA_ADDNUMAGENCIA } = process.env;

// Parse env vars to correct types
const inmoLang = parseInt(INMOVILLA_LANG || '1', 10); // Default to 1 (Spanish)
const addnumagencia = INMOVILLA_ADDNUMAGENCIA || '';

/**
 * Sync a single new property from Inmovilla to property_metadata
 * Called when a new property is created in the CRM
 */
export async function syncSinglePropertyAction(propertyId: number) {
    try {
        if (!INMOVILLA_NUMAGENCIA || !INMOVILLA_PASSWORD) {
            throw new Error('Inmovilla credentials not configured');
        }

        // Fetch the single property from Inmovilla API
        const api = new InmovillaWebApiService(
            INMOVILLA_NUMAGENCIA,
            INMOVILLA_PASSWORD,
            addnumagencia,
            inmoLang,
            '127.0.0.1',
            'vidahome.es'
        );

        const result = await api.getPropertyDetails(propertyId);
        if (!result || result.nodisponible) {
            throw new Error(`Property ${propertyId} not found or not available`);
        }

        // Save to property_metadata
        const upsertData = {
            cod_ofer: result.cod_ofer,
            ref: result.ref,
            descriptions: {
                description_es: result.descripciones || '',
                description_en: '',
                description_fr: '',
                description_de: '',
                description_it: '',
                description_pl: '',
            },
            full_data: result,
            updated_at: new Date().toISOString()
        };

        const { error } = await supabaseAdmin
            .from('property_metadata')
            .upsert([upsertData], { onConflict: 'cod_ofer' });

        if (error) throw error;

        console.log(`[Sync] ✅ Property ${propertyId} synced to property_metadata`);
        return { success: true, message: `Property ${propertyId} synced successfully` };
    } catch (error: any) {
        console.error('[Sync] Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Sync ALL properties from Inmovilla to property_metadata
 * Call this periodically or manually to keep everything in sync
 */
export async function syncAllPropertiesAction() {
    try {
        if (!INMOVILLA_NUMAGENCIA || !INMOVILLA_PASSWORD) {
            throw new Error('Inmovilla credentials not configured');
        }

        const api = new InmovillaWebApiService(
            INMOVILLA_NUMAGENCIA,
            INMOVILLA_PASSWORD,
            addnumagencia,
            inmoLang,
            '127.0.0.1',
            'vidahome.es'
        );

        // Fetch all properties (paginated)
        let allProperties = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
            const properties = await api.getProperties({ page });
            
            if (!properties || properties.length === 0) {
                hasMore = false;
            } else {
                allProperties.push(...properties);
                page++;
            }
        }

        // Deduplicate by cod_ofer — API can return same property on multiple pages
        const seenIds = new Set<number>();
        allProperties = allProperties.filter((p: any) => {
            if (seenIds.has(p.cod_ofer)) return false;
            seenIds.add(p.cod_ofer);
            return true;
        });
        console.log(`[Sync] After dedup: ${allProperties.length} unique properties`);

        // IDs currently active in Inmovilla
        const activeIds = new Set(allProperties.map((p: any) => p.cod_ofer));

        // Get all cod_ofer currently in our DB
        const { data: existing } = await supabaseAdmin
            .from('property_metadata')
            .select('cod_ofer');

        const existingIds: number[] = (existing || []).map((r: any) => r.cod_ofer);

        // Mark properties no longer in Inmovilla as nodisponible
        const toDeactivate = existingIds.filter(id => !activeIds.has(id));
        if (toDeactivate.length > 0) {
            await supabaseAdmin
                .from('property_metadata')
                .update({ nodisponible: true, updated_at: new Date().toISOString() })
                .in('cod_ofer', toDeactivate);
            console.log(`[Sync] ⚠️  Marked ${toDeactivate.length} properties as nodisponible:`, toDeactivate);
        }

        // Load ALL existing descriptions so we don't overwrite translations
        const { data: existingDescs } = await supabaseAdmin
            .from('property_metadata')
            .select('cod_ofer, descriptions');
        const existingDescMap = new Map(
            (existingDescs || []).map((r: any) => [r.cod_ofer, r.descriptions || {}])
        );

        // Load descriptions from the `properties` backup table (source of truth for translations)
        const { data: propBackup } = await supabaseAdmin
            .from('properties')
            .select('property_id, description_es, description_en, description_fr, description_de, description_it, description_pl');
        const propBackupMap = new Map(
            (propBackup || []).map((r: any) => [r.property_id, r])
        );

        // Prepare batch upsert — preserve existing translations, only update description_es if non-empty
        // Load existing full_data so we don't overwrite rich ficha data with limited paginacion data
        const { data: existingFullData } = await supabaseAdmin
            .from('property_metadata')
            .select('cod_ofer, full_data');
        const existingFullDataMap = new Map(
            (existingFullData || []).map((r: any) => [r.cod_ofer, r.full_data])
        );

        const upsertBatch = allProperties.map((p: any) => {
            const existingMeta = existingDescMap.get(p.cod_ofer) || {};
            const backup = propBackupMap.get(p.cod_ofer) || {};
            const newEs = p.descripciones || '';
            // Build descriptions: start from backup, overlay meta, set ES from API if non-empty
            const descriptions = {
                description_es: newEs || existingMeta.description_es || backup.description_es || '',
                description_en: existingMeta.description_en || backup.description_en || '',
                description_fr: existingMeta.description_fr || backup.description_fr || '',
                description_de: existingMeta.description_de || backup.description_de || '',
                description_it: existingMeta.description_it || backup.description_it || '',
                description_pl: existingMeta.description_pl || backup.description_pl || '',
            };
            // Prefer existing full_data (from ficha, has descriptions/coordinates)
            // only use paginacion data if no existing full_data
            const existingFd = existingFullDataMap.get(p.cod_ofer);
            return {
            cod_ofer: p.cod_ofer,
            ref: p.ref,
            poblacion: p.poblacion || '',
            nodisponible: false,
            descriptions,
            full_data: existingFd || p,   // keep rich ficha data if available
            updated_at: new Date().toISOString()
            };
        });

        // Upsert in batches to avoid timeout
        const batchSize = 20;
        let successCount = 0;

        for (let i = 0; i < upsertBatch.length; i += batchSize) {
            const batch = upsertBatch.slice(i, i + batchSize);
            const { error } = await supabaseAdmin
                .from('property_metadata')
                .upsert(batch, { onConflict: 'cod_ofer' });

            if (error) throw error;
            successCount += batch.length;
        }

        console.log(`[Sync] ✅ Synced ${successCount} properties to property_metadata`);

        // Also upsert to property_features for fast querying
        const featuresBatch = allProperties.map((p: any) => ({
            cod_ofer: p.cod_ofer,
            precio: p.precioinmo || 0,
            precioalq: p.precioalq || 0,
            outlet: p.outlet || 0,
            keyacci: p.keyacci || 1,
            habitaciones: p.habitaciones || 0,
            habitaciones_simples: p.habitaciones_simples || 0,
            habitaciones_dobles: p.habitaciones_dobles || 0,
            banos: p.banyos || 0,
            aseos: p.aseos || 0,
            superficie: p.m_cons || 0,
            m_utiles: p.m_utiles || 0,
            m_terraza: p.m_terraza || 0,
            m_parcela: p.m_parcela || 0,
            plantas: 0,
            ascensor: p.ascensor || false,
            parking: (p.parking_tipo || 0) > 0,
            parking_tipo: p.parking_tipo || 0,
            terraza: (p.m_terraza || 0) > 0,
            piscina_com: p.piscina_com || false,
            piscina_prop: p.piscina_prop || false,
            aire_con: p.aire_con || false,
            calefaccion: p.calefaccion || false,
            diafano: p.diafano || false,
            todoext: p.todoext || false,
            zona: p.zona || null,
            tipo: p.tipo_nombre || null,
            distmar: p.distmar || 0,
            synced_at: new Date().toISOString()
        }));

        for (let i = 0; i < featuresBatch.length; i += batchSize) {
            const batch = featuresBatch.slice(i, i + batchSize);
            const { error: featError } = await supabaseAdmin
                .from('property_features')
                .upsert(batch, { onConflict: 'cod_ofer' });
            if (featError) console.warn('[Sync] property_features batch error:', featError.message);
        }
        console.log(`[Sync] ✅ Also synced ${featuresBatch.length} rows to property_features`);

        return { 
            success: true, 
            message: `Synced ${successCount} properties. ${toDeactivate.length} marked as unavailable.`
        };
    } catch (error: any) {
        console.error('[Sync] Error syncing all properties:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Delta sync: only process differences between Inmovilla catalog and Supabase.
 * - New properties  → insert with paginacion data + fetch ficha for description_es
 * - Removed         → mark nodisponible = true
 * - Reactivated     → mark nodisponible = false, update price/location
 * - Unchanged       → skip entirely (no API calls wasted)
 */
export async function syncDeltaAction(): Promise<{
    success: boolean;
    added: number;
    removed: number;
    reactivated: number;
    unchanged: number;
    error?: string;
}> {
    const EMPTY = { success: false, added: 0, removed: 0, reactivated: 0, unchanged: 0 };

    try {
        if (!INMOVILLA_NUMAGENCIA || !INMOVILLA_PASSWORD) {
            return { ...EMPTY, error: 'Inmovilla credentials not configured' };
        }

        const api = new InmovillaWebApiService(
            INMOVILLA_NUMAGENCIA,
            INMOVILLA_PASSWORD,
            addnumagencia,
            inmoLang,
            '127.0.0.1',
            'vidahome.es'
        );

        // ── 1. Fetch full Inmovilla catalog (paginacion) ─────────────────────
        let allProperties: any[] = [];
        let page = 1;
        while (true) {
            const batch = await api.getProperties({ page });
            if (!batch || batch.length === 0) break;
            allProperties.push(...batch);
            page++;
        }

        // Deduplicate
        const seen = new Set<number>();
        allProperties = allProperties.filter((p: any) => {
            if (seen.has(p.cod_ofer)) return false;
            seen.add(p.cod_ofer);
            return true;
        });
        console.log(`[Delta] Inmovilla catalog: ${allProperties.length} properties`);

        const inmovMap = new Map(allProperties.map((p: any) => [p.cod_ofer, p]));
        const inmovIds = new Set(inmovMap.keys());

        // ── 2. Fetch Supabase state ───────────────────────────────────────────
        const { data: sbRows } = await supabaseAdmin
            .from('property_metadata')
            .select('cod_ofer, nodisponible, descriptions');

        const sbMap = new Map((sbRows || []).map((r: any) => [r.cod_ofer, r]));
        const sbIds = new Set(sbMap.keys());

        // ── 3. Compute diff ───────────────────────────────────────────────────
        const newIds        = [...inmovIds].filter(id => !sbIds.has(id));
        const removedIds    = [...sbIds].filter(id => !inmovIds.has(id) && !sbMap.get(id)?.nodisponible);
        const reactivatedIds = [...sbIds].filter(id => inmovIds.has(id) && sbMap.get(id)?.nodisponible);

        console.log(`[Delta] New: ${newIds.length}, Removed: ${removedIds.length}, Reactivated: ${reactivatedIds.length}`);

        const now = new Date().toISOString();

        // ── 4. Mark removed as nodisponible ───────────────────────────────────
        if (removedIds.length > 0) {
            await supabaseAdmin
                .from('property_metadata')
                .update({ nodisponible: true, updated_at: now })
                .in('cod_ofer', removedIds);
            // property_features may not have nodisponible column — best effort
            try {
                await supabaseAdmin
                    .from('property_features')
                    .delete()
                    .in('cod_ofer', removedIds);
            } catch { /* column missing or table missing — non-fatal */ }
        }

        // ── 5. Reactivate previously removed properties ───────────────────────
        if (reactivatedIds.length > 0) {
            const reactivatedUpserts = reactivatedIds.map(id => {
                const p = inmovMap.get(id)!;
                const existing = sbMap.get(id) || {};
                return {
                    cod_ofer: id,
                    ref: p.ref,
                    poblacion: p.poblacion || '',
                    nodisponible: false,
                    descriptions: existing.descriptions || {},
                    updated_at: now,
                };
            });
            await supabaseAdmin.from('property_metadata')
                .upsert(reactivatedUpserts, { onConflict: 'cod_ofer' });
        }

        // ── 6. Insert new properties ──────────────────────────────────────────
        if (newIds.length > 0) {
            // Try to get descriptions via ficha (only works if Arsys proxy is available)
            const fichaDescriptions = new Map<number, string>();
            const hasProxy = !!(process.env.ARSYS_PROXY_URL && process.env.ARSYS_PROXY_SECRET);

            if (hasProxy) {
                console.log(`[Delta] Fetching ficha for ${newIds.length} new properties...`);
                for (const id of newIds) {
                    try {
                        const detail = await api.getPropertyDetails(id);
                        if (detail?.descripciones) fichaDescriptions.set(id, detail.descripciones);
                    } catch {
                        // non-fatal — we'll still insert without description
                    }
                }
            }

            // Load descriptions from backup for any of the new IDs that previously existed
            const { data: backupRows } = await supabaseAdmin
                .from('properties')
                .select('property_id, description_es, description_en, description_fr, description_de, description_it, description_pl')
                .in('property_id', newIds);
            const backupMap = new Map((backupRows || []).map((r: any) => [r.property_id, r]));

            const newUpserts = newIds.map(id => {
                const p = inmovMap.get(id)!;
                const descEs = fichaDescriptions.get(id) || '';
                const backup = backupMap.get(id) || {} as any;
                return {
                    cod_ofer: id,
                    ref: p.ref,
                    poblacion: p.poblacion || '',
                    nodisponible: false,
                    descriptions: {
                        description_es: descEs || backup.description_es || '',
                        description_en: backup.description_en || '',
                        description_fr: backup.description_fr || '',
                        description_de: backup.description_de || '',
                        description_it: backup.description_it || '',
                        description_pl: backup.description_pl || '',
                    },
                    full_data: p,
                    updated_at: now,
                };
            });

            const batchSize = 20;
            for (let i = 0; i < newUpserts.length; i += batchSize) {
                await supabaseAdmin.from('property_metadata')
                    .upsert(newUpserts.slice(i, i + batchSize), { onConflict: 'cod_ofer' });
            }

            // Also write to property_features
            const newFeatures = newIds.map(id => {
                const p = inmovMap.get(id)!;
                return {
                    cod_ofer: id,
                    precio: p.precioinmo || 0,
                    precioalq: p.precioalq || 0,
                    outlet: p.outlet || 0,
                    keyacci: p.keyacci || 1,
                    habitaciones: p.habitaciones || 0,
                    habitaciones_simples: p.habitaciones_simples || 0,
                    habitaciones_dobles: p.habitaciones_dobles || 0,
                    banos: p.banyos || 0,
                    aseos: p.aseos || 0,
                    superficie: p.m_cons || 0,
                    m_utiles: p.m_utiles || 0,
                    m_terraza: p.m_terraza || 0,
                    m_parcela: p.m_parcela || 0,
                    plantas: 0,
                    ascensor: p.ascensor || false,
                    parking: (p.parking_tipo || 0) > 0,
                    parking_tipo: p.parking_tipo || 0,
                    terraza: (p.m_terraza || 0) > 0,
                    piscina_com: p.piscina_com || false,
                    piscina_prop: p.piscina_prop || false,
                    aire_con: p.aire_con || false,
                    calefaccion: p.calefaccion || false,
                    diafano: p.diafano || false,
                    todoext: p.todoext || false,
                    zona: p.zona || null,
                    tipo: p.tipo_nombre || null,
                    distmar: p.distmar || 0,
                    nodisponible: false,
                    synced_at: now,
                };
            });
            for (let i = 0; i < newFeatures.length; i += batchSize) {
                await supabaseAdmin.from('property_features')
                    .upsert(newFeatures.slice(i, i + batchSize), { onConflict: 'cod_ofer' });
            }
        }

        const unchanged = allProperties.length - newIds.length - reactivatedIds.length;

        console.log(`[Delta] ✅ Done — added:${newIds.length} removed:${removedIds.length} reactivated:${reactivatedIds.length} unchanged:${unchanged}`);

        return {
            success: true,
            added: newIds.length,
            removed: removedIds.length,
            reactivated: reactivatedIds.length,
            unchanged,
        };
    } catch (error: any) {
        console.error('[Delta] Error:', error);
        return { ...EMPTY, error: error.message };
    }
}

/**
 * Fetch ficha descriptions for properties that have empty description_es.
 * Calls the Inmovilla ficha endpoint for each ref (requires Arsys proxy).
 * Returns cod_ofers where a description was found.
 */
export async function fetchFichaDescriptionsAction(refs: string[]): Promise<{
    success: boolean;
    fetched: number;
    missing: number;
    updated: string[];
    updatedIds: number[];
    error?: string;
}> {
    try {
        if (!INMOVILLA_NUMAGENCIA || !INMOVILLA_PASSWORD) {
            return { success: false, fetched: 0, missing: 0, updated: [], updatedIds: [], error: 'Inmovilla credentials not configured' };
        }

        const api = new InmovillaWebApiService(
            INMOVILLA_NUMAGENCIA,
            INMOVILLA_PASSWORD,
            addnumagencia,
            inmoLang,
            '127.0.0.1',
            'vidahome.es'
        );

        // Load cod_ofers for the requested refs
        const { data: rows } = await supabaseAdmin
            .from('property_metadata')
            .select('cod_ofer, ref, tipo, precio, poblacion, descriptions')
            .in('ref', refs);

        if (!rows?.length) {
            return { success: false, fetched: 0, missing: refs.length, updated: [], updatedIds: [], error: 'No matching properties found' };
        }

        const updated: string[] = [];
        const updatedIds: number[] = [];
        const now = new Date().toISOString();

        for (const row of rows) {
            try {
                const detail = await api.getPropertyDetails(row.cod_ofer);
                const descEs = detail?.descripciones?.trim() || '';

                if (!descEs) continue;

                const existingDesc = row.descriptions || {};
                const merged = {
                    ...existingDesc,
                    description_es: descEs,
                };

                // Save to property_metadata
                await supabaseAdmin
                    .from('property_metadata')
                    .update({ descriptions: merged, updated_at: now })
                    .eq('cod_ofer', row.cod_ofer);

                // Save to properties backup
                await supabaseAdmin.from('properties').upsert({
                    property_id: row.cod_ofer,
                    ref: row.ref,
                    description_es: descEs,
                }, { onConflict: 'property_id' });

                updated.push(row.ref);
                updatedIds.push(row.cod_ofer);
            } catch (e: any) {
                console.warn(`[FetchFicha] Failed for ref ${row.ref}:`, e.message);
            }
        }

        return {
            success: true,
            fetched: updated.length,
            missing: rows.length - updated.length,
            updated,
            updatedIds,
        };
    } catch (error: any) {
        console.error('[FetchFicha] Error:', error);
        return { success: false, fetched: 0, missing: 0, updated: [], updatedIds: [], error: error.message };
    }
}

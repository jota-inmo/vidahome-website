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

        // Prepare batch upsert — preserve existing translations, only update description_es if non-empty
        // Load existing full_data so we don't overwrite rich ficha data with limited paginacion data
        const { data: existingFullData } = await supabaseAdmin
            .from('property_metadata')
            .select('cod_ofer, full_data');
        const existingFullDataMap = new Map(
            (existingFullData || []).map((r: any) => [r.cod_ofer, r.full_data])
        );

        const upsertBatch = allProperties.map((p: any) => {
            const existing = existingDescMap.get(p.cod_ofer) || {};
            const newEs = p.descripciones || '';
            // Prefer existing full_data (from ficha, has descriptions/coordinates)
            // only use paginacion data if no existing full_data
            const existingFd = existingFullDataMap.get(p.cod_ofer);
            return {
            cod_ofer: p.cod_ofer,
            ref: p.ref,
            poblacion: p.poblacion || '',
            nodisponible: false,
            descriptions: {
                ...existing,
                ...(newEs ? { description_es: newEs } : {}),
            },
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

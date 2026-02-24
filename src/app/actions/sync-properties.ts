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

        // Prepare batch upsert
        const upsertBatch = allProperties.map((p: any) => ({
            cod_ofer: p.cod_ofer,
            ref: p.ref,
            descriptions: {
                description_es: p.descripciones || '',
                description_en: '',
                description_fr: '',
                description_de: '',
                description_it: '',
                description_pl: '',
            },
            full_data: p,
            updated_at: new Date().toISOString()
        }));

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
        return { 
            success: true, 
            message: `Synced ${successCount} properties successfully`
        };
    } catch (error: any) {
        console.error('[Sync] Error syncing all properties:', error);
        return { success: false, error: error.message };
    }
}

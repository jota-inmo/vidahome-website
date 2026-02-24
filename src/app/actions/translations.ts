'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { revalidateTag } from 'next/cache';

export async function getPropertiesForTranslationAction() {
    try {
        // Step 1: Get properties from Inmovilla API (like the catalog does)
        const { InmovillaWebApiService } = await import('@/lib/api/web-service');
        const { INMOVILLA_LANG, INMOVILLA_NUMAGENCIA, INMOVILLA_PASSWORD, INMOVILLA_ADDNUMAGENCIA } = process.env;
        
        let properties = [];
        try {
            const api = new InmovillaWebApiService(
                INMOVILLA_NUMAGENCIA,
                INMOVILLA_PASSWORD,
                INMOVILLA_ADDNUMAGENCIA,
                INMOVILLA_LANG,
                '127.0.0.1',
                'vidahome.es'
            );
            const result = await api.getPropertyList(30, 1); // First 30 properties
            properties = result?.properties || [];
        } catch (apiError) {
            console.warn('[Translations] Inmovilla API fetch failed:', apiError);
            // Fallback to property_metadata if API fails
            const { data, error } = await supabaseAdmin
                .from('property_metadata')
                .select('*')
                .order('cod_ofer', { ascending: true })
                .limit(50);
            
            if (error) throw error;
            properties = data || [];
        }

        // Step 2: Enrich with Supabase translations (like the catalog does)
        try {
            const { data: metadata } = await supabaseAdmin
                .from('property_metadata')
                .select('cod_ofer, descriptions, full_data, ref');

            if (metadata && metadata.length > 0) {
                properties = properties.map((p: any) => {
                    const meta = metadata.find(m => m.cod_ofer === p.cod_ofer);
                    if (!meta) return p;

                    let descriptions = meta.descriptions as Record<string, string> || {};
                    
                    // Use full_data ref if available
                    const ref = meta.ref || (meta.full_data as any)?.ref || p.ref;

                    return {
                        ...p,
                        ref,
                        descriptions,
                        description_es: descriptions.description_es || descriptions.descripciones || p.descripciones || '',
                        description_en: descriptions.description_en || '',
                        description_fr: descriptions.description_fr || '',
                        description_de: descriptions.description_de || '',
                        description_it: descriptions.description_it || '',
                        description_pl: descriptions.description_pl || '',
                    };
                });
            }
        } catch (supaError) {
            console.warn('[Translations] Supabase enrichment failed:', supaError);
        }

        // Step 3: Transform for admin editor expectations
        const transformed = properties.map((prop: any) => ({
            property_id: prop.cod_ofer,
            cod_ofer: prop.cod_ofer,
            ref: prop.ref || `Property ${prop.cod_ofer}`,
            descripciones: prop.descripciones || prop.description_es || '',
            description_es: prop.description_es || prop.descripciones || '',
            description_en: prop.description_en || '',
            description_fr: prop.description_fr || '',
            description_de: prop.description_de || '',
            description_it: prop.description_it || '',
            description_pl: prop.description_pl || '',
        }));
        
        return { success: true, data: transformed };
    } catch (error) {
        console.error('[Translations] Error fetching properties:', error);
        return { success: false, error: 'Error al cargar propiedades' };
    }
}

export async function savePropertyTranslationAction(property_id: number, descriptions: Record<string, string>) {
    try {
        // Build descriptions JSON object
        const descriptionUpdates: Record<string, string> = {};
        if (descriptions.es) descriptionUpdates.description_es = descriptions.es;
        if (descriptions.en) descriptionUpdates.description_en = descriptions.en;
        if (descriptions.fr) descriptionUpdates.description_fr = descriptions.fr;
        if (descriptions.de) descriptionUpdates.description_de = descriptions.de;
        if (descriptions.it) descriptionUpdates.description_it = descriptions.it;
        if (descriptions.pl) descriptionUpdates.description_pl = descriptions.pl;

        // Fetch existing descriptions to merge
        const { data: existing } = await supabaseAdmin
            .from('property_metadata')
            .select('descriptions')
            .eq('cod_ofer', property_id)
            .single();

        const updatedDescriptions = {
            ...(existing?.descriptions || {}),
            ...descriptionUpdates,
            updated_at: new Date().toISOString()
        };

        const { error } = await supabaseAdmin
            .from('property_metadata')
            .update({ descriptions: updatedDescriptions })
            .eq('cod_ofer', property_id);

        if (error) throw error;

        // Log change
        await supabaseAdmin.from('translation_log').insert({
            property_id: String(property_id),
            status: 'success',
            source_language: 'manual_edit',
            target_languages: Object.keys(descriptionUpdates).map(k => k.replace('description_', '')),
            created_at: new Date().toISOString(),
        });

        // Revalidate tags to ensure the website reflects changes
        revalidateTag('inmovilla_property_list', {});

        return { success: true };
    } catch (error) {
        console.error('Error saving translation:', error);
        return { success: false, error: 'Error al guardar los cambios' };
    }
}

/**
 * Runs auto-translation using server-side action instead of Edge Function to avoid JWT issues
 */
export async function runAutoTranslationAction(propertyIds?: number[]) {
    try {
        // Import the server action
        const { translatePropertiesAction } = await import('@/app/actions/translate-perplexity');
        
        const result = await translatePropertiesAction(
            propertyIds?.map(String),
            propertyIds ? undefined : 10
        );

        // Revalidate to show updated content
        revalidateTag('inmovilla_property_list', {});

        return { success: true, ...result };
    } catch (error: any) {
        console.error('Error in auto-translation action:', error);
        return { success: false, error: error.message || 'Error al iniciar la traducción automática' };
    }
}

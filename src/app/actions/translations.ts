'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { revalidateTag } from 'next/cache';

export async function getPropertiesForTranslationAction() {
    try {
        const { data, error } = await supabaseAdmin
            .from('property_metadata')
            .select('cod_ofer, descriptions, ref')
            .order('cod_ofer', { ascending: true });

        if (error) throw error;
        
        // Transform data to match admin page expectations
        const transformed = data?.map((prop: any) => ({
            property_id: prop.cod_ofer,
            cod_ofer: prop.cod_ofer,
            ref: prop.ref || `Property ${prop.cod_ofer}`,
            description_es: prop.descriptions?.description_es || prop.descriptions?.descripciones || '',
            description_en: prop.descriptions?.description_en || '',
            description_fr: prop.descriptions?.description_fr || '',
            description_de: prop.descriptions?.description_de || '',
            description_it: prop.descriptions?.description_it || '',
            description_pl: prop.descriptions?.description_pl || '',
        })) || [];
        
        return { success: true, data: transformed };
    } catch (error) {
        console.error('Error fetching properties:', error);
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
        revalidateTag('inmovilla_property_list');

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
        revalidateTag('inmovilla_property_list');

        return { success: true, ...result };
    } catch (error: any) {
        console.error('Error in auto-translation action:', error);
        return { success: false, error: error.message || 'Error al iniciar la traducción automática' };
    }
}

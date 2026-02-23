'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { revalidateTag } from 'next/cache';

export async function getPropertiesForTranslationAction() {
    try {
        const { data, error } = await supabaseAdmin
            .from('property_metadata')
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error fetching property metadata:', error);
        return { success: false, error: 'Error al cargar propiedades' };
    }
}

export async function savePropertyTranslationAction(cod_ofer: number, descriptions: Record<string, string>) {
    try {
        // We also update the legacy 'description' field if 'es' is present
        const updateData: any = {
            descriptions,
            updated_at: new Date().toISOString()
        };

        if (descriptions.es) {
            updateData.description = descriptions.es;
        }

        const { error } = await supabaseAdmin
            .from('property_metadata')
            .update(updateData)
            .eq('cod_ofer', cod_ofer);

        if (error) throw error;

        // Revalidate tags to ensure the website reflects changes
        revalidateTag('inmovilla_property_list', {});

        return { success: true };
    } catch (error) {
        console.error('Error saving translation:', error);
        return { success: false, error: 'Error al guardar los cambios' };
    }
}

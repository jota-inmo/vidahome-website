'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { revalidateTag } from 'next/cache';

export async function getPropertiesForTranslationAction() {
    try {
        const { data, error } = await supabaseAdmin
            .from('properties')
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error fetching properties:', error);
        return { success: false, error: 'Error al cargar propiedades' };
    }
}

export async function savePropertyTranslationAction(property_id: number, descriptions: Record<string, string>) {
    try {
        const updateData: any = {
            description_es: descriptions.es,
            description_en: descriptions.en,
            description_fr: descriptions.fr,
            description_de: descriptions.de,
            description_it: descriptions.it,
            description_pl: descriptions.pl,
            updated_at: new Date().toISOString()
        };

        const { error } = await supabaseAdmin
            .from('properties')
            .update(updateData)
            .eq('property_id', property_id);

        if (error) throw error;

        // Revalidate tags to ensure the website reflects changes
        revalidateTag('inmovilla_property_list', {});

        return { success: true };
    } catch (error) {
        console.error('Error saving translation:', error);
        return { success: false, error: 'Error al guardar los cambios' };
    }
}

/**
 * Calls the Supabase Edge Function to run the auto-translation logic via Perplexity
 */
export async function runAutoTranslationAction(propertyIds?: number[]) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Supabase credentials not configured');
        }

        const response = await fetch(`${supabaseUrl}/functions/v1/translate-properties`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${supabaseAnonKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ property_ids: propertyIds }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error en la Edge Function');
        }

        const result = await response.json();

        // Revalidate to show updated content
        revalidateTag('inmovilla_property_list', {});

        return { success: true, ...result };
    } catch (error: any) {
        console.error('Error in auto-translation action:', error);
        return { success: false, error: error.message || 'Error al iniciar la traducción automática' };
    }
}

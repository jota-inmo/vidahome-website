'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';

export interface CompanySettings {
    phone: string;
    email: string;
    address: string;
    hours_week: string;
    hours_sat: string;
    instagram_url: string;
}

const DEFAULT_SETTINGS: CompanySettings = {
    phone: '+34 659 02 75 12',
    email: 'info@vidahome.es',
    address: 'Carrer Joan XXIII, 1, 46730 Grau i Platja, Gandia, Valencia',
    hours_week: 'Lunes - Viernes: 09:00 - 14:00 y 17:00 - 20:00',
    hours_sat: 'Sábado: 09:30 - 13:30',
    instagram_url: 'https://www.instagram.com/vidahome/'
};

export async function getCompanySettingsAction(): Promise<CompanySettings> {
    try {
        const { data, error } = await supabaseAdmin
            .from('company_settings')
            .select('key, value');

        if (error || !data || data.length === 0) {
            return DEFAULT_SETTINGS;
        }

        const settings = { ...DEFAULT_SETTINGS };
        data.forEach((item: { key: string; value: string }) => {
            if (item.key in settings) {
                (settings as any)[item.key] = item.value;
            }
        });

        return settings;
    } catch (e) {
        console.error('Error fetching company settings:', e);
        return DEFAULT_SETTINGS;
    }
}

export async function updateCompanySettingsAction(settings: Partial<CompanySettings>) {
    try {
        const entries = Object.entries(settings).map(([key, value]) => ({
            key,
            value: String(value),
            updated_at: new Date().toISOString()
        }));

        const { error } = await supabaseAdmin
            .from('company_settings')
            .upsert(entries, { onConflict: 'key' });

        if (error) throw error;

        revalidatePath('/');
        revalidatePath('/contacto');

        return { success: true };
    } catch (e: any) {
        console.error('Error updating company settings:', e);
        return { success: false, error: e.message };
    }
}

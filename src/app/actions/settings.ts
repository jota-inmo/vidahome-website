'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { VIDAHOME_TENANT_ID } from '@/lib/tenant';

export interface CompanySettings {
    phone: string;
    email: string;
    notifications_email: string;
    address: string;
    hours_week: string;
    hours_sat: string;
    instagram_url: string;
}

const DEFAULT_SETTINGS: CompanySettings = {
    phone: '+34 659 02 75 12',
    email: 'info@vidahome.es',
    notifications_email: 'info@vidahome.es',
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
        if (!(await requireAdmin())) return { success: false, error: 'No autorizado' };
        // Stamp the VidaHome tenant_id explicitly: supabaseAdmin uses the service role
        // (bypasses RLS), so the tenant_id DEFAULT app.current_tenant_id() would resolve
        // to NULL and the NOT NULL constraint would reject the upsert. Single-tenant
        // interim — see @/lib/tenant.
        const entries = Object.entries(settings).map(([key, value]) => ({
            key,
            value: String(value),
            tenant_id: VIDAHOME_TENANT_ID,
            updated_at: new Date().toISOString()
        }));

        // onConflict per-tenant (P3.1 key-readiness): la clave de negocio es ahora
        // (tenant_id, key), no `key` global — así un 2º tenant puede tener sus propias
        // settings. Casa con UNIQUE/PK compuesto company_settings_tenant_key_key /
        // company_settings_pkey(tenant_id,key). NO usar 'key' suelto: tras el CONTRACT
        // ese constraint ya no existe y el upsert fallaría.
        const { error } = await supabaseAdmin
            .from('company_settings')
            .upsert(entries, { onConflict: 'tenant_id,key' });

        if (error) throw error;

        revalidatePath('/');
        revalidatePath('/contacto');

        return { success: true };
    } catch (e: any) {
        console.error('Error updating company settings:', e);
        return { success: false, error: e.message };
    }
}

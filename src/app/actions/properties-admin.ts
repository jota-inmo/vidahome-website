"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from '@/lib/auth';

export interface PropertySummaryRow {
  cod_ofer: number;
  ref: string;
  tipo: string;
  poblacion: string;
  precio: number;
  nodisponible: boolean;
  superficie: number | null;
  habitaciones: number | null;
  habitaciones_simples: number | null;
  habitaciones_dobles: number | null;
  banos: number | null;
  description_es: string;
  description_en: string;
  description_fr: string;
  description_de: string;
  description_it: string;
  description_pl: string;
  main_photo: string | null;
  updated_at: string;
}

/**
 * Fetch all properties with merged data from property_metadata + property_features
 * Equivalent to the property_summary VIEW
 */
export async function getPropertiesSummaryAction(): Promise<{
  success: boolean;
  data?: PropertySummaryRow[];
  error?: string;
}> {
  try {
    const { data: metadata, error: metaError } = await supabaseAdmin
      .from("property_metadata")
      .select(
        "cod_ofer, ref, tipo, precio, poblacion, nodisponible, main_photo, descriptions, full_data, updated_at"
      )
      .order("cod_ofer", { ascending: true });

    if (metaError) throw new Error(metaError.message);

    const { data: features } = await supabaseAdmin
      .from("property_features")
      .select(
        "cod_ofer, superficie, habitaciones, habitaciones_simples, habitaciones_dobles, banos"
      );

    const featMap = new Map(
      (features || []).map((f: any) => [f.cod_ofer, f])
    );

    const rows: PropertySummaryRow[] = (metadata || []).map((m: any) => {
      const f = featMap.get(m.cod_ofer) as any;
      const d = (m.descriptions as Record<string, string>) || {};
      const fd = (m.full_data as Record<string, any>) || {};

      // Fallback chain: dedicated column → full_data field → default
      const tipo = m.tipo && m.tipo !== 'Property' ? m.tipo : (fd.tipo_nombre || fd.tipo || m.tipo || '');
      const poblacion = m.poblacion || fd.poblacion || fd.municipio || '';
      const precio = m.precio || fd.precioinmo || fd.precio || 0;
      const ref = m.ref || fd.ref || `#${m.cod_ofer}`;

      return {
        cod_ofer: m.cod_ofer,
        ref,
        tipo,
        poblacion,
        precio,
        nodisponible: m.nodisponible || false,
        main_photo: m.main_photo || null,
        updated_at: m.updated_at || "",
        superficie: f?.superficie ?? fd.m_cons ?? null,
        habitaciones: f?.habitaciones ?? (((Number(fd.habitaciones) || 0) + (Number(fd.habdobles) || 0)) || null),
        habitaciones_simples: f?.habitaciones_simples ?? fd.habitaciones ?? null,
        habitaciones_dobles: f?.habitaciones_dobles ?? fd.habdobles ?? null,
        banos: f?.banos ?? fd.banyos ?? null,
        description_es: d.description_es || "",
        description_en: d.description_en || "",
        description_fr: d.description_fr || "",
        description_de: d.description_de || "",
        description_it: d.description_it || "",
        description_pl: d.description_pl || "",
      };
    });

    return { success: true, data: rows };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Update property descriptions (all languages at once)
 */
export async function updatePropertyDescriptionsAction(
  cod_ofer: number,
  descriptions: {
    description_es: string;
    description_en: string;
    description_fr: string;
    description_de: string;
    description_it: string;
    description_pl: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!(await requireAdmin())) return { success: false, error: 'No autorizado' };
    const { data: existing } = await supabaseAdmin
      .from("property_metadata")
      .select("descriptions")
      .eq("cod_ofer", cod_ofer)
      .single();

    const merged = {
      ...(existing?.descriptions || {}),
      ...descriptions,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin
      .from("property_metadata")
      .update({ descriptions: merged })
      .eq("cod_ofer", cod_ofer);

    if (error) throw new Error(error.message);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Update property physical features
 */
export async function updatePropertyFeaturesAction(
  cod_ofer: number,
  features: {
    superficie?: number;
    habitaciones?: number;
    habitaciones_simples?: number;
    habitaciones_dobles?: number;
    banos?: number;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!(await requireAdmin())) return { success: false, error: 'No autorizado' };
    const { error } = await supabaseAdmin
      .from("property_features")
      .update({ ...features, updated_at: new Date().toISOString() })
      .eq("cod_ofer", cod_ofer);

    if (error) throw new Error(error.message);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Update property price from admin panel.
 * Writes to both property_metadata.precio AND admin_overrides.precio
 * so it persists over Inmovilla sync.
 */
export async function updatePropertyPrecioAction(
  cod_ofer: number,
  precio: number
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!(await requireAdmin())) return { success: false, error: 'No autorizado' };
    // Get existing overrides
    const { data: existing } = await supabaseAdmin
      .from("property_metadata")
      .select("admin_overrides")
      .eq("cod_ofer", cod_ofer)
      .single();

    const overrides = { ...(existing?.admin_overrides || {}), precio };

    // Update both precio and admin_overrides
    const { error } = await supabaseAdmin
      .from("property_metadata")
      .update({
        precio,
        admin_overrides: overrides,
        updated_at: new Date().toISOString(),
      })
      .eq("cod_ofer", cod_ofer);

    if (error) throw new Error(error.message);

    // Also update features table precio
    await supabaseAdmin
      .from("property_features")
      .update({ precio, updated_at: new Date().toISOString() })
      .eq("cod_ofer", cod_ofer);

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

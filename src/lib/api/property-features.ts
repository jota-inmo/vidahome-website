import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

export interface PropertyFeatures {
  cod_ofer: number;
  precio: number;
  habitaciones: number;
  habitaciones_simples: number;
  habitaciones_dobles: number;
  banos: number;
  superficie: number;
  plantas?: number;
  ascensor?: boolean;
  parking?: boolean;
  terraza?: boolean;
  piscina?: boolean;
  ano_construccion?: number;
  estado_conservacion?: string;
  clase_energetica?: string;
  synced_at?: string;
}

/**
 * Get enhanced property features data for fast queries
 * Used in property detail page to show room distinction
 */
export async function getPropertyFeatures(
  cod_ofer: number
): Promise<PropertyFeatures | null> {
  try {
    const { data, error } = await supabase
      .from("property_features")
      .select(
        "cod_ofer, precio, habitaciones, habitaciones_simples, habitaciones_dobles, banos, superficie, plantas, ascensor, parking, terraza, piscina, ano_construccion, estado_conservacion, clase_energetica, synced_at"
      )
      .eq("cod_ofer", cod_ofer)
      .single();

    if (error) {
      console.warn(`[getPropertyFeatures] Error fetching features for ${cod_ofer}:`, error.message);
      return null;
    }

    return data as PropertyFeatures;
  } catch (err) {
    console.error(`[getPropertyFeatures] Unexpected error for ${cod_ofer}:`, err);
    return null;
  }
}

/**
 * Get multiple properties' features
 */
export async function getPropertiesFeatures(
  cod_ofers: number[]
): Promise<PropertyFeatures[]> {
  try {
    const { data, error } = await supabase
      .from("property_features")
      .select(
        "cod_ofer, precio, habitaciones, habitaciones_simples, habitaciones_dobles, banos, superficie"
      )
      .in("cod_ofer", cod_ofers);

    if (error) {
      console.warn("[getPropertiesFeatures] Error fetching features:", error.message);
      return [];
    }

    return (data as PropertyFeatures[]) || [];
  } catch (err) {
    console.error("[getPropertiesFeatures] Unexpected error:", err);
    return [];
  }
}

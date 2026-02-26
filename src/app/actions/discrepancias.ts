"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from '@/lib/auth';

// ── Types ──────────────────────────────────────────────────────────────

export interface Discrepancia {
  ref: string;
  campo: string;        // 'precio' | 'tipo' | 'habitaciones' | 'baños'
  valorEncargo: string;
  valorWeb: string;
}

// ── Helpers ────────────────────────────────────────────────────────────

function normaliseRef(ref: string): string {
  return (ref || "").trim().replace(/\s+/g, "").toUpperCase();
}

function normaliseTipo(tipo: string | null): string {
  if (!tipo) return "";
  const t = tipo.trim().toLowerCase();
  const map: Record<string, string> = {
    piso: "piso", apartamento: "apartamento",
    "ático": "atico", atico: "atico", "ático dúplex": "atico duplex",
    "dúplex": "duplex", duplex: "duplex",
    villa: "villa", chalet: "chalet", casa: "casa",
    "casa adosada": "adosado", adosado: "adosado",
    bungalow: "bungalow", terreno: "terreno", solar: "solar",
    local: "local", "local comercial": "local comercial",
    garaje: "garaje", trastero: "trastero",
    nave: "nave industrial", "nave industrial": "nave industrial",
    finca: "finca rustica", "finca rústica": "finca rustica",
    edificio: "edificio",
  };
  return map[t] || t;
}

function toNum(v: unknown): number {
  return Number(v) || 0;
}

// ── Actions ────────────────────────────────────────────────────────────

/**
 * Compares encargos vs web data and returns active discrepancies
 * (excluding already-dismissed ones).
 */
export async function getDiscrepanciasAction(): Promise<{
  success: boolean;
  data?: Record<string, Discrepancia[]>;   // keyed by normalised ref
  error?: string;
}> {
  try {
    // 1. Fetch encargos (only sale/rental types)
    const ventaTypes = [
      "venta-sin-exclusiva", "venta-con-exclusiva",
      "encargo_venta_sin_exclusiva", "alquiler",
    ];
    const { data: encargos, error: encErr } = await supabaseAdmin
      .from("encargos")
      .select("ref, precio, precio_nuevo, tipo_vivienda, num_habitaciones, num_banos, estado, contractType")
      .in("contractType", ventaTypes);

    if (encErr) throw new Error(encErr.message);

    // 2. Fetch web properties
    const { data: webProps, error: webErr } = await supabaseAdmin
      .from("property_metadata")
      .select("cod_ofer, ref, tipo, precio, nodisponible, full_data");
    if (webErr) throw new Error(webErr.message);

    const { data: webFeatures } = await supabaseAdmin
      .from("property_features")
      .select("cod_ofer, habitaciones, banos");

    const featMap = new Map((webFeatures || []).map((f: any) => [f.cod_ofer, f]));

    // Build ref → web map
    const webByRef = new Map<string, any>();
    for (const wp of webProps || []) {
      const normRef = normaliseRef(wp.ref);
      webByRef.set(normRef, { ...wp, features: featMap.get(wp.cod_ofer) });
    }

    // 3. Fetch dismissed
    const { data: dismissed } = await supabaseAdmin
      .from("discrepancias_dismissed")
      .select("ref, campo, valor_encargo, valor_web");

    const dismissedSet = new Set(
      (dismissed || []).map((d: any) =>
        `${normaliseRef(d.ref)}|${d.campo}|${d.valor_encargo}|${d.valor_web}`
      )
    );

    // 4. Compare
    const result: Record<string, Discrepancia[]> = {};

    for (const enc of encargos || []) {
      const normRef = normaliseRef(enc.ref);
      const web = webByRef.get(normRef);
      if (!web || web.nodisponible) continue;

      const fd = web.full_data || {};
      const feat = web.features || {};
      const diffs: Discrepancia[] = [];

      // Precio
      const encPrecio = toNum(enc.precio_nuevo || enc.precio);
      const webPrecio = toNum(web.precio || fd.precioinmo);
      if (encPrecio > 0 && webPrecio > 0 && encPrecio !== webPrecio) {
        const key = `${normRef}|precio|${encPrecio}|${webPrecio}`;
        if (!dismissedSet.has(key)) {
          diffs.push({ ref: enc.ref.trim(), campo: "precio", valorEncargo: String(encPrecio), valorWeb: String(webPrecio) });
        }
      }

      // Tipo
      const encTipo = normaliseTipo(enc.tipo_vivienda);
      const webTipo = normaliseTipo(web.tipo);
      if (encTipo && webTipo && encTipo !== webTipo) {
        const key = `${normRef}|tipo|${enc.tipo_vivienda || ""}|${web.tipo || ""}`;
        if (!dismissedSet.has(key)) {
          diffs.push({ ref: enc.ref.trim(), campo: "tipo", valorEncargo: enc.tipo_vivienda || "", valorWeb: web.tipo || "" });
        }
      }

      // Habitaciones
      const encHab = toNum(enc.num_habitaciones);
      const webHab = toNum(feat.habitaciones ?? ((toNum(fd.habitaciones) + toNum(fd.habdobles))));
      if (encHab > 0 && webHab > 0 && encHab !== webHab) {
        const key = `${normRef}|habitaciones|${encHab}|${webHab}`;
        if (!dismissedSet.has(key)) {
          diffs.push({ ref: enc.ref.trim(), campo: "habitaciones", valorEncargo: String(encHab), valorWeb: String(webHab) });
        }
      }

      // Baños
      const encBan = toNum(enc.num_banos);
      const webBan = toNum(feat.banos ?? fd.banyos);
      if (encBan > 0 && webBan > 0 && encBan !== webBan) {
        const key = `${normRef}|baños|${encBan}|${webBan}`;
        if (!dismissedSet.has(key)) {
          diffs.push({ ref: enc.ref.trim(), campo: "baños", valorEncargo: String(encBan), valorWeb: String(webBan) });
        }
      }

      if (diffs.length > 0) {
        result[normRef] = diffs;
      }
    }

    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Dismiss a discrepancy so it won't show again for the same values.
 */
export async function dismissDiscrepanciaAction(d: Discrepancia): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (!(await requireAdmin())) return { success: false, error: 'No autorizado' };
    const { error } = await supabaseAdmin
      .from("discrepancias_dismissed")
      .upsert(
        {
          ref: normaliseRef(d.ref),
          campo: d.campo,
          valor_encargo: d.valorEncargo,
          valor_web: d.valorWeb,
        },
        { onConflict: "ref,campo,valor_encargo,valor_web" }
      );

    if (error) throw new Error(error.message);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

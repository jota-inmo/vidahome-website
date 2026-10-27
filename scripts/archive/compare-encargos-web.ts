/**
 * compare-encargos-web.ts
 * 
 * Compara los datos de la tabla `encargos` (app interna) contra lo que se muestra
 * en la web (property_metadata + property_features).
 *
 * Solo compara las referencias que están activas en la web (no retiradas).
 * 
 * Campos comparados:
 *   - precio
 *   - tipo de inmueble
 *   - nº habitaciones (encargos.num_habitaciones vs web simples+dobles)
 *   - nº baños
 *
 * Usage:
 *   npx tsx scripts/compare-encargos-web.ts
 *   npx tsx scripts/compare-encargos-web.ts --all        # incluir retiradas
 *   npx tsx scripts/compare-encargos-web.ts --ref 2888   # solo una ref
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Normalise helpers ───────────────────────────────────────────────────

function normaliseRef(ref: string): string {
  return (ref || "").trim().replace(/\s+/g, "").toUpperCase();
}

/** Map tipo_vivienda (encargos) → tipo (web) as close as possible */
function normaliseTipo(tipo: string | null): string {
  if (!tipo) return "";
  const t = tipo.trim().toLowerCase();
  const map: Record<string, string> = {
    piso: "piso",
    apartamento: "apartamento",
    ático: "atico",
    atico: "atico",
    "ático dúplex": "atico duplex",
    dúplex: "duplex",
    duplex: "duplex",
    villa: "villa",
    chalet: "chalet",
    casa: "casa",
    "casa adosada": "adosado",
    adosado: "adosado",
    bungalow: "bungalow",
    terreno: "terreno",
    solar: "solar",
    local: "local",
    "local comercial": "local comercial",
    garaje: "garaje",
    trastero: "trastero",
    nave: "nave industrial",
    "nave industrial": "nave industrial",
    finca: "finca rustica",
    "finca rústica": "finca rustica",
    edificio: "edificio",
  };
  return map[t] || t;
}

function normaliseNum(v: any): number {
  return Number(v) || 0;
}

// ── Main ────────────────────────────────────────────────────────────────

interface Diff {
  ref: string;
  campo: string;
  encargo: string | number;
  web: string | number;
}

async function main() {
  const args = process.argv.slice(2);
  const showAll = args.includes("--all");
  const refIdx = args.indexOf("--ref");
  const singleRef = refIdx !== -1 ? args[refIdx + 1] : null;

  // 1. Fetch encargos (venta types only – excl. cazador, oferta)
  const ventaTypes = [
    "venta-sin-exclusiva",
    "venta-con-exclusiva",
    "encargo_venta_sin_exclusiva",
    "alquiler",
  ];
  const { data: encargos, error: encErr } = await supabase
    .from("encargos")
    .select("ref, precio, precio_nuevo, tipo_vivienda, num_habitaciones, num_banos, estado, contractType")
    .in("contractType", ventaTypes);

  if (encErr) {
    console.error("❌ Error leyendo encargos:", encErr.message);
    return;
  }
  console.log(`📋 Encargos (venta/alquiler): ${encargos!.length}`);

  // 2. Fetch web properties
  const { data: webProps, error: webErr } = await supabase
    .from("property_metadata")
    .select("cod_ofer, ref, tipo, precio, nodisponible, full_data");

  if (webErr) {
    console.error("❌ Error leyendo property_metadata:", webErr.message);
    return;
  }

  const { data: webFeatures } = await supabase
    .from("property_features")
    .select("cod_ofer, habitaciones, habitaciones_simples, habitaciones_dobles, banos, superficie");

  const featMap = new Map((webFeatures || []).map((f: any) => [f.cod_ofer, f]));

  // Build ref → web prop map
  const webByRef = new Map<string, any>();
  for (const wp of webProps || []) {
    const normRef = normaliseRef(wp.ref);
    webByRef.set(normRef, { ...wp, features: featMap.get(wp.cod_ofer) });
  }

  console.log(`🌐 Propiedades en web: ${webByRef.size}`);

  // 3. Match & compare
  const diffs: Diff[] = [];
  let matched = 0;
  let noMatch = 0;
  const onlyInEncargos: string[] = [];
  const onlyInWeb: string[] = [];

  for (const enc of encargos!) {
    const normRef = normaliseRef(enc.ref);
    if (singleRef && normaliseRef(singleRef) !== normRef) continue;

    const web = webByRef.get(normRef);
    if (!web) {
      noMatch++;
      onlyInEncargos.push(`${enc.ref} (${enc.tipo_vivienda || "?"}, ${enc.estado})`);
      continue;
    }
    matched++;

    if (!showAll && web.nodisponible) continue; // skip retired unless --all

    const fd = web.full_data || {};
    const feat = web.features || {};

    // ── Precio ──
    const encPrecio = normaliseNum(enc.precio_nuevo || enc.precio);
    const webPrecio = normaliseNum(web.precio || fd.precioinmo);
    if (encPrecio > 0 && webPrecio > 0 && encPrecio !== webPrecio) {
      diffs.push({ ref: enc.ref.trim(), campo: "precio", encargo: encPrecio, web: webPrecio });
    }

    // ── Tipo ──
    const encTipo = normaliseTipo(enc.tipo_vivienda);
    const webTipo = (web.tipo || "").trim().toLowerCase();
    if (encTipo && webTipo && encTipo !== webTipo) {
      diffs.push({ ref: enc.ref.trim(), campo: "tipo", encargo: enc.tipo_vivienda || "", web: web.tipo || "" });
    }

    // ── Habitaciones ──
    const encHab = normaliseNum(enc.num_habitaciones);
    const webHab = normaliseNum(feat.habitaciones ?? ((Number(fd.habitaciones) || 0) + (Number(fd.habdobles) || 0)));
    if (encHab > 0 && webHab > 0 && encHab !== webHab) {
      diffs.push({ ref: enc.ref.trim(), campo: "habitaciones", encargo: encHab, web: webHab });
    }

    // ── Baños ──
    const encBan = normaliseNum(enc.num_banos);
    const webBan = normaliseNum(feat.banos ?? fd.banyos);
    if (encBan > 0 && webBan > 0 && encBan !== webBan) {
      diffs.push({ ref: enc.ref.trim(), campo: "baños", encargo: encBan, web: webBan });
    }
  }

  // Check for web props not in encargos
  const encRefsSet = new Set((encargos || []).map((e: any) => normaliseRef(e.ref)));
  for (const [normRef, wp] of webByRef) {
    if (!encRefsSet.has(normRef) && !wp.nodisponible) {
      onlyInWeb.push(`${wp.ref} (${wp.tipo || "?"})`);
    }
  }

  // ── Report ────────────────────────────────────────────────────────────
  console.log("\n" + "═".repeat(70));
  console.log("  COMPARACIÓN ENCARGOS vs WEB");
  console.log("═".repeat(70));
  console.log(`  Encargos con match en web: ${matched}`);
  console.log(`  Encargos SIN match en web: ${noMatch}`);
  console.log(`  Diferencias encontradas:   ${diffs.length}`);
  console.log("═".repeat(70));

  if (diffs.length > 0) {
    console.log("\n🔴 DIFERENCIAS:");
    console.log("─".repeat(70));
    console.log(
      "REF".padEnd(10) +
        "CAMPO".padEnd(16) +
        "ENCARGO".padEnd(22) +
        "WEB"
    );
    console.log("─".repeat(70));
    for (const d of diffs) {
      const refStr = d.ref.padEnd(10);
      const campoStr = d.campo.padEnd(16);
      const encStr = String(d.encargo).padEnd(22);
      const webStr = String(d.web);
      console.log(`${refStr}${campoStr}${encStr}${webStr}`);
    }
  } else {
    console.log("\n✅ No hay diferencias entre encargos y web.");
  }

  if (onlyInEncargos.length > 0) {
    console.log(`\n⚠️  Encargos SIN publicar en web (${onlyInEncargos.length}):`);
    onlyInEncargos.slice(0, 30).forEach((r) => console.log(`  - ${r}`));
    if (onlyInEncargos.length > 30) console.log(`  ... y ${onlyInEncargos.length - 30} más`);
  }

  if (onlyInWeb.length > 0) {
    console.log(`\n⚠️  En web PERO sin encargo (${onlyInWeb.length}):`);
    onlyInWeb.slice(0, 30).forEach((r) => console.log(`  - ${r}`));
    if (onlyInWeb.length > 30) console.log(`  ... y ${onlyInWeb.length - 30} más`);
  }

  // Summary by campo
  if (diffs.length > 0) {
    const byCampo: Record<string, number> = {};
    for (const d of diffs) {
      byCampo[d.campo] = (byCampo[d.campo] || 0) + 1;
    }
    console.log("\n📊 Resumen por campo:");
    for (const [campo, count] of Object.entries(byCampo)) {
      console.log(`  ${campo}: ${count} diferencias`);
    }
  }

  console.log("");
}

main().catch(console.error);

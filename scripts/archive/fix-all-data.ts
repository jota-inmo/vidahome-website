/**
 * fix-all-data.ts — Corrección masiva de datos
 * 
 * 1. property_metadata.precio → full_data.precioinmo (precio real sin comisión)
 * 2. property_features.precio → full_data.precioinmo
 * 3. Poblaciones incorrectas por CP mal mapeado
 * 4. Tipo incorrecto (tipo_nombre genérico "Property")
 *
 * Usage: npx tsx scripts/fix-all-data.ts
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Load tipos map
const tiposMap: Record<string, string> = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../src/lib/api/tipos_map.json"), "utf-8")
);

// CORRECT CP → municipio mapping (verified against Inmovilla CRM)
const cpMap: Record<string, string> = {
  "46702": "Gandía",
  "46700": "Gandía",
  "46701": "Gandía",
  "46703": "Gandía",
  "46730": "Gandía",
  "46713": "Bellreguard",
  "46712": "Piles",
  "46711": "Miramar",
  "46710": "Daimús",
  "46714": "Palmera",
  "46715": "Almoines",
  "46716": "Beniarjó",
  "46722": "Potries",
  "46723": "Palma de Gandía",
  "46724": "Real de Gandía",
  "46725": "Benifairó de la Valldigna",
  "46727": "Ador",
  "46760": "Tavernes de la Valldigna",
  "46790": "Xeresa",
  "46780": "Oliva",
  "46600": "Alzira",
  "46680": "Algemesí",
  "46868": "Bélgida",
  "46842": "Ontinyent",
  "46758": "Ador",
  "03788": "Pego",
  "02001": "Albacete",
  "16118": "Cuenca",
  "00000": "Gandía",
};

async function main() {
  const { data: props, error } = await supabase
    .from("property_metadata")
    .select("cod_ofer, ref, tipo, precio, poblacion, full_data")
    .order("ref");

  if (error) { console.error("ERROR:", error.message); return; }

  let fixedPrecio = 0;
  let fixedTipo = 0;
  let fixedPoblacion = 0;
  let fixedFeatPrecio = 0;
  let errors = 0;

  for (const p of props!) {
    const fd = p.full_data || {};
    const realPrecio = Number(fd.precioinmo) || 0;
    const colPrecio = Number(p.precio) || 0;
    const cp = String(fd.cp || "").padStart(5, "0");
    const correctPoblacion = cpMap[cp] || null;
    const mappedTipo = tiposMap[String(fd.key_tipo)] || null;
    const colTipo = (p.tipo || "").trim();
    const colPoblacion = (p.poblacion || "").trim();

    // ── Fix property_metadata ──
    const metaUpdates: Record<string, any> = {};

    // Fix precio
    if (realPrecio > 0 && colPrecio !== realPrecio) {
      metaUpdates.precio = realPrecio;
    }

    // Fix tipo (only if current is wrong/generic)
    if (mappedTipo && colTipo.toLowerCase() !== mappedTipo.toLowerCase()) {
      metaUpdates.tipo = mappedTipo;
    }

    // Fix poblacion
    if (correctPoblacion && colPoblacion.toLowerCase() !== correctPoblacion.toLowerCase()) {
      metaUpdates.poblacion = correctPoblacion;
    }

    if (Object.keys(metaUpdates).length > 0) {
      const { error: updErr } = await supabase
        .from("property_metadata")
        .update(metaUpdates)
        .eq("cod_ofer", p.cod_ofer);

      if (!updErr) {
        if (metaUpdates.precio) fixedPrecio++;
        if (metaUpdates.tipo) fixedTipo++;
        if (metaUpdates.poblacion) fixedPoblacion++;
        const changes = Object.entries(metaUpdates).map(([k, v]) => `${k}=${v}`).join(", ");
        console.log(`  ✅ ${p.ref}: metadata → ${changes}`);
      } else {
        errors++;
        console.log(`  ❌ ${p.ref}: ${updErr.message}`);
      }
    }

    // ── Fix property_features.precio ──
    if (realPrecio > 0) {
      const { error: featErr } = await supabase
        .from("property_features")
        .update({ precio: realPrecio })
        .eq("cod_ofer", p.cod_ofer);

      if (!featErr) {
        fixedFeatPrecio++;
      }
    }
  }

  console.log("\n" + "═".repeat(60));
  console.log("  RESULTADO DE CORRECCIÓN");
  console.log("═".repeat(60));
  console.log(`  Precio metadata corregido:   ${fixedPrecio}`);
  console.log(`  Tipo corregido:              ${fixedTipo}`);
  console.log(`  Población corregida:          ${fixedPoblacion}`);
  console.log(`  Features precio actualizado:  ${fixedFeatPrecio}`);
  console.log(`  Errores:                      ${errors}`);
  console.log("═".repeat(60));

  // Verify ref 2751
  console.log("\n🔍 Verificación ref 2751:");
  const { data: check } = await supabase
    .from("property_metadata")
    .select("ref, precio, tipo, poblacion")
    .eq("ref", "2751")
    .single();
  console.log(JSON.stringify(check, null, 2));
}

main().catch(console.error);

/**
 * deep-audit.ts — Auditoría profunda de TODAS las propiedades
 * 
 * Compara:
 *   1. precio (columna) vs full_data.precioinmo (real)
 *   2. tipo (columna) vs tipos_map[key_tipo]
 *   3. poblacion (columna) vs CP real (identifica errores de mapeo)
 *   4. tipo_nombre en full_data (¿es "Property" genérico?)
 *
 * Usage: npx tsx scripts/deep-audit.ts
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

// Correct CP → municipio mapping (manually verified)
const cpMap: Record<string, string> = {
  "46702": "Gandía",
  "46700": "Gandía",
  "46701": "Gandía",
  "46703": "Gandía",
  "46730": "Gandía",   // Playa de Gandía
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
    .select("cod_ofer, ref, tipo, precio, poblacion, nodisponible, full_data")
    .order("ref");

  if (error) { console.error("ERROR:", error.message); return; }

  const { data: features } = await supabase
    .from("property_features")
    .select("cod_ofer, precio, habitaciones, habitaciones_simples, habitaciones_dobles, banos, superficie");
  const featMap = new Map((features || []).map(f => [f.cod_ofer, f]));

  console.log(`\n📦 Total propiedades: ${props!.length}\n`);

  let priceMismatch = 0;
  let tipoMismatch = 0;
  let poblacionMismatch = 0;
  let tipoNombreGenerico = 0;

  const issues: any[] = [];

  for (const p of props!) {
    const fd = p.full_data || {};
    const feat = featMap.get(p.cod_ofer) || {};
    const propIssues: string[] = [];

    // 1. PRECIO: columna vs precioinmo
    const colPrecio = Number(p.precio) || 0;
    const realPrecio = Number(fd.precioinmo) || 0;
    if (realPrecio > 0 && colPrecio !== realPrecio) {
      priceMismatch++;
      propIssues.push(`PRECIO: columna=${colPrecio} vs precioinmo=${realPrecio} (diff=${realPrecio - colPrecio})`);
    }

    // 2. TIPO: columna vs tipos_map[key_tipo]
    const colTipo = (p.tipo || "").trim();
    const mappedTipo = tiposMap[String(fd.key_tipo)] || "";
    if (mappedTipo && colTipo.toLowerCase() !== mappedTipo.toLowerCase()) {
      tipoMismatch++;
      propIssues.push(`TIPO: columna="${colTipo}" vs map="${mappedTipo}" (key_tipo=${fd.key_tipo})`);
    }

    // 3. POBLACION: columna vs CP mapping
    const colPoblacion = (p.poblacion || "").trim();
    const cp = String(fd.cp || "").padStart(5, "0");
    const correctPoblacion = cpMap[cp] || null;
    if (correctPoblacion && colPoblacion.toLowerCase() !== correctPoblacion.toLowerCase()) {
      poblacionMismatch++;
      propIssues.push(`POBLACION: columna="${colPoblacion}" vs CP${cp}="${correctPoblacion}"`);
    }

    // 4. tipo_nombre genérico
    if (fd.tipo_nombre === "Property" || fd.tipo_nombre === "property") {
      tipoNombreGenerico++;
    }

    // 5. Features precio vs metadata precio
    const featPrecio = Number((feat as any).precio) || 0;
    if (featPrecio > 0 && realPrecio > 0 && featPrecio !== realPrecio) {
      propIssues.push(`FEAT_PRECIO: features=${featPrecio} vs precioinmo=${realPrecio}`);
    }

    if (propIssues.length > 0) {
      issues.push({ ref: p.ref, cod_ofer: p.cod_ofer, nodisponible: p.nodisponible, issues: propIssues });
    }
  }

  // Report
  console.log("═".repeat(80));
  console.log("  AUDITORÍA PROFUNDA DE DATOS");
  console.log("═".repeat(80));
  console.log(`  Precio incorrecto (col vs precioinmo):  ${priceMismatch}`);
  console.log(`  Tipo incorrecto (col vs tipos_map):     ${tipoMismatch}`);
  console.log(`  Población incorrecta (col vs CP):       ${poblacionMismatch}`);
  console.log(`  tipo_nombre genérico ("Property"):       ${tipoNombreGenerico}`);
  console.log(`  Total propiedades con problemas:         ${issues.length}`);
  console.log("═".repeat(80));

  if (issues.length > 0) {
    console.log("\n🔴 DETALLE DE PROBLEMAS:");
    for (const i of issues) {
      const retired = i.nodisponible ? " [RETIRADA]" : "";
      console.log(`\n  REF ${i.ref}${retired}:`);
      for (const iss of i.issues) {
        console.log(`    ❌ ${iss}`);
      }
    }
  }

  console.log("");
}

main().catch(console.error);

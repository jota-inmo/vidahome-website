/**
 * Extract unique key_loca values from Supabase full_data
 * and generate the localidades_map.json using CP → municipio mapping
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Mapeo código postal → municipio para zona de Gandía/Valencia
// Fuente: Correos de España / INE
const CP_MUNICIPIO: Record<string, string> = {
  "46700": "Gandía",
  "46701": "Gandía",
  "46702": "Gandía",
  "46710": "Daimús",
  "46711": "Miramar",
  "46712": "Piles",
  "46713": "Bellreguard",
  "46714": "Alquería de la Condesa",
  "46715": "Palmera",
  "46716": "Rafelcofer",
  "46717": "La Font d'En Carròs",
  "46718": "Villalonga",
  "46719": "Potries",
  "46720": "Vilallonga",
  "46721": "Ador",
  "46722": "Beniarjó",
  "46723": "Palma de Gandía",
  "46724": "Real de Gandía",
  "46725": "Benifairó de la Valldigna",
  "46726": "Tavernes de la Valldigna",
  "46727": "Simat de la Valldigna",
  "46728": "Gandía Playa",
  "46729": "Ador",
  "46730": "Gandía",
  "46740": "Carcaixent",
  "46750": "Simat de la Valldigna",  
  "46758": "Ador",
  "46760": "Tavernes de la Valldigna",
  "46770": "Xeraco",
  "46780": "Oliva",
  "46790": "Benifairó de la Valldigna",
  "46800": "Xàtiva",
  "46810": "Enguera",
  "46820": "L'Ènova",
  "46830": "Benigànim",
  "46840": "Ontinyent",
  "46842": "Ontinyent",
  "46850": "L'Olleria",
  "46860": "Albaida",
  "46868": "L'Olleria",
  "03780": "Pego",
  "03788": "Pego",
  "03700": "Dénia",
  "03730": "Xàbia / Jávea",
  "03710": "Calp / Calpe",
  "03720": "Benissa",
  "03740": "Gata de Gorgos",
  "46400": "Cullera",
  "46410": "Sueca",
  "46500": "Sagunto",
  "46600": "Alzira",
  "46610": "Guadassuar",
  "46620": "Ayora",
  "46630": "La Font de la Figuera",
  "46640": "Mogente",
  "03750": "Ondara",
  "03760": "El Verger",
  "03770": "El Verger",
  "03790": "Orba",
  "46540": "El Puig",
  "46550": "Sagunto",
  "46703": "Gandía",
  "00000": "Gandía",
  "02001": "Albacete",
  "16118": "Cuenca",
};

async function buildLocalidadesMap() {
  console.log("🔍 Building localidades_map from Supabase full_data + CP mapping\n");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data, error } = await supabase
    .from("property_metadata")
    .select("cod_ofer, ref, full_data")
    .not("full_data", "is", null);

  if (error) {
    console.error("❌ Error:", error.message);
    return;
  }

  console.log(`📦 ${data.length} properties with full_data\n`);

  // Extract unique key_loca + cp combinations
  const keyLocaCp: Map<string, { cp: string; refs: string[] }> = new Map();

  data.forEach((p: any) => {
    const fd = p.full_data;
    const keyLoca = String(fd.key_loca || "");
    const cp = String(fd.cp || "");

    if (keyLoca && keyLoca !== "0") {
      if (!keyLocaCp.has(keyLoca)) {
        keyLocaCp.set(keyLoca, { cp, refs: [] });
      }
      keyLocaCp.get(keyLoca)!.refs.push(p.ref);
    }
  });

  console.log(`📊 Unique key_loca values: ${keyLocaCp.size}\n`);

  // Build localidades_map
  const localidadesMap: Record<string, string> = {};
  const unmapped: { keyLoca: string; cp: string; refs: string[] }[] = [];

  keyLocaCp.forEach(({ cp, refs }, keyLoca) => {
    const municipio = CP_MUNICIPIO[cp];
    if (municipio) {
      localidadesMap[keyLoca] = municipio;
      console.log(`  ✅ ${keyLoca} → ${municipio} (CP: ${cp}, refs: ${refs.join(", ")})`);
    } else {
      unmapped.push({ keyLoca, cp, refs });
      console.log(`  ❌ ${keyLoca} → ? (CP: ${cp}, refs: ${refs.join(", ")})`);
    }
  });

  if (unmapped.length > 0) {
    console.log(`\n⚠️  ${unmapped.length} key_loca SIN MAPEAR:`);
    unmapped.forEach(({ keyLoca, cp, refs }) => {
      console.log(`  key_loca=${keyLoca}  cp=${cp}  refs=${refs.slice(0, 3).join(", ")}`);
    });
  }

  // Save
  const mapPath = path.resolve(__dirname, "../src/lib/api/localidades_map.json");
  fs.writeFileSync(mapPath, JSON.stringify(localidadesMap, null, 2));
  console.log(`\n✅ Saved ${Object.keys(localidadesMap).length} localidades to localidades_map.json`);

  // Also update Supabase directly
  console.log("\n📝 Updating tipo + poblacion in Supabase...\n");

  // Read tipos_map
  const tiposMapPath = path.resolve(__dirname, "../src/lib/api/tipos_map.json");
  const tiposMap: Record<string, string> = JSON.parse(fs.readFileSync(tiposMapPath, "utf-8"));

  let updatedTipo = 0;
  let updatedPob = 0;

  for (const p of data) {
    const fd = p.full_data;
    const keyTipo = String(fd.key_tipo || "");
    const keyLoca = String(fd.key_loca || "");
    const cp = String(fd.cp || "");

    const tipo = tiposMap[keyTipo] || null;
    const poblacion = localidadesMap[keyLoca] || CP_MUNICIPIO[cp] || null;

    const updates: Record<string, any> = {};
    if (tipo) updates.tipo = tipo;
    if (poblacion) updates.poblacion = poblacion;

    if (Object.keys(updates).length > 0) {
      const { error: updErr } = await supabase
        .from("property_metadata")
        .update(updates)
        .eq("cod_ofer", p.cod_ofer);

      if (!updErr) {
        if (tipo) updatedTipo++;
        if (poblacion) updatedPob++;
      } else {
        console.error(`  ❌ ${p.ref}: ${updErr.message}`);
      }
    }
  }

  console.log(`\n📊 RESULTADO:`);
  console.log(`  ✅ tipo actualizado:     ${updatedTipo}/${data.length}`);
  console.log(`  ✅ poblacion actualizado: ${updatedPob}/${data.length}`);
}

buildLocalidadesMap().catch(console.error);

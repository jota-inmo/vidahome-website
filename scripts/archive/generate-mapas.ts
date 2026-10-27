import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { createInmovillaApi } from "../src/lib/api/properties";
import tiposMap from "../src/lib/api/tipos_map.json";
import fs from "fs";
import path from "path";

async function generateLocalidadesMap() {
  console.log("🔍 Generating localidades_map.json from Inmovilla API\n");

  const INMOVILLA_TOKEN = process.env.INMOVILLA_TOKEN;
  const authType = (process.env.INMOVILLA_AUTH_TYPE as 'Token' | 'Bearer') || 'Bearer';

  if (!INMOVILLA_TOKEN) {
    console.error("❌ Missing INMOVILLA_TOKEN");
    process.exit(1);
  }

  const api = createInmovillaApi(INMOVILLA_TOKEN, authType);

  try {
    // Fetch first page to see what data we get
    console.log("📥 Fetching properties from Inmovilla API...");
    const properties = await api.getProperties({ page: 1 });

    if (!properties || properties.length === 0) {
      console.error("❌ No properties returned");
      return;
    }

    // Extract unique key_loca values and build a map
    const localidadesSet = new Map<string, string>();
    const tiposSet = new Map<string, string>();

    properties.forEach((prop: any) => {
      const keyLoca = String(prop.key_loca);
      const keyTipo = String(prop.key_tipo);
      
      // Try multiple field names for población
      const poblacion = prop.poblacion || prop.municipio || '';
      const tipoNombre = prop.tipo_nombre || prop.tipo || '';

      if (poblacion && keyLoca) {
        localidadesSet.set(keyLoca, poblacion);
      }
      if (tipoNombre && keyTipo) {
        tiposSet.set(keyTipo, tipoNombre);
      }
    });

    console.log(`\n✅ Found ${localidadesSet.size} unique localidades`);
    console.log(`✅ Found ${tiposSet.size} unique tipos\n`);

    // Show samples
    if (localidadesSet.size > 0) {
      console.log("📋 Sample localidades:");
      Array.from(localidadesSet.entries())
        .slice(0, 5)
        .forEach(([key, val]) => console.log(`  ${key}: ${val}`));
    }

    if (tiposSet.size > 0) {
      console.log("\n📋 Sample tipos from API:");
      Array.from(tiposSet.entries())
        .slice(0, 5)
        .forEach(([key, val]) => console.log(`  ${key}: ${val}`));
    }

    // Show what we already have in tipos_map.json
    console.log(`\n📊 tipos_map.json has ${Object.keys(tiposMap).length} entries`);

    // Export localidades
    const localidadesObj: Record<string, string> = {};
    localidadesSet.forEach((val, key) => {
      localidadesObj[key] = val;
    });

    const mapPath = path.resolve(__dirname, "../src/lib/api/localidades_map.json");
    fs.writeFileSync(mapPath, JSON.stringify(localidadesObj, null, 2));
    console.log(`\n✅ Written ${Object.keys(localidadesObj).length} entries to localidades_map.json`);

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

generateLocalidadesMap().catch(console.error);

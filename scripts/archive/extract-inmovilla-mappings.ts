import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { createInmovillaApi } from "../src/lib/api/properties";
import fs from "fs";
import path from "path";

async function extractLocalidadeMappings() {
  console.log("🔍 Extracting localidades mapping from Inmovilla API\n");
  console.log("⚠️  Will fetch only 1 page (~30 properties) to respect API limits\n");

  const INMOVILLA_TOKEN = process.env.INMOVILLA_TOKEN;
  const authType = (process.env.INMOVILLA_AUTH_TYPE as 'Token' | 'Bearer') || 'Bearer';

  if (!INMOVILLA_TOKEN) {
    console.error("❌ Missing INMOVILLA_TOKEN");
    process.exit(1);
  }

  const api =createInmovillaApi(INMOVILLA_TOKEN, authType);

  try {
    console.log("📥 Fetching first page (respecting API limits)...\n");
    const properties = await api.getProperties({ page: 1, limit: 30 });

    if (!properties || properties.length === 0) {
      console.error("❌ No properties returned");
      return;
    }

    console.log(`✅ Got ${properties.length} properties\n`);

    // Inspect structure
    const sample = properties[0];
    console.log("📋 Sample property fields:");
    Object.keys(sample)
      .slice(0, 20)
      .forEach((key) => {
        const val = (sample as any)[key];
        const display =
          typeof val === "string"
            ? `"${val.substring(0, 30)}..."`
            : JSON.stringify(val).substring(0, 30);
        console.log(`  ${key}: ${display}`);
      });

    // Try to extract mappings
    const localidadesMap: Record<string, string> = {};
    const tiposMap: Record<string, string> = {};

    const missing = {
      poblacion: [] as string[],
      tipo_nombre: [] as string[],
      key_loca: [] as number[],
      key_tipo: [] as number[],
    };

    properties.forEach((prop: any) => {
      // Try to get poblacion
      if (prop.poblacion) {
        const keyLoca = String(prop.key_loca);
        if (prop.key_loca && !localidadesMap[keyLoca]) {
          localidadesMap[keyLoca] = prop.poblacion;
        }
      } else if (prop.key_loca) {
        if (!missing.poblacion.includes(String(prop.key_loca))) {
          missing.poblacion.push(String(prop.key_loca));
        }
      }

      // Try to get tipo_nombre
      if (prop.tipo_nombre) {
        const keyTipo = String(prop.key_tipo);
        if (prop.key_tipo && !tiposMap[keyTipo]) {
          tiposMap[keyTipo] = prop.tipo_nombre;
        }
      } else if (prop.key_tipo) {
        if (!missing.tipo_nombre.includes(String(prop.key_tipo))) {
          missing.tipo_nombre.push(String(prop.key_tipo));
        }
      }
    });

    console.log("\n\n📊 RESULTADOS:\n");
    console.log(
      `✅ Poblaciones encontradas:    ${Object.keys(localidadesMap).length}`
    );
    if (Object.keys(localidadesMap).length > 0) {
      console.log("   Ejemplos:");
      Object.entries(localidadesMap)
        .slice(0, 3)
        .forEach(([key, val]) => console.log(`     ${key}: ${val}`));
    }

    console.log(`\n✅ Tipos encontrados:          ${Object.keys(tiposMap).length}`);
    if (Object.keys(tiposMap).length > 0) {
      console.log("   Ejemplos:");
      Object.entries(tiposMap)
        .slice(0, 3)
        .forEach(([key, val]) => console.log(`     ${key}: ${val}`));
    }

    // Report missing
    if (missing.poblacion.length > 0) {
      console.log(
        `\n⚠️  Falta poblacion para ${missing.poblacion.length} key_loca `
      );
      console.log(
        `   IDs ausentes: ${missing.poblacion.slice(0, 5).join(", ")}`
      );
    }

    if (missing.tipo_nombre.length > 0) {
      console.log(
        `\n⚠️  Falta tipo_nombre para ${missing.tipo_nombre.length} key_tipo`
      );
      console.log(`   IDs ausentes: ${missing.tipo_nombre.slice(0, 5).join(", ")}`);
    }

    // Save whatever we extracted
    if (Object.keys(localidadesMap).length > 0) {
      const mapPath = path.resolve(
        __dirname,
        "../src/lib/api/localidades_map.json"
      );
      fs.writeFileSync(mapPath, JSON.stringify(localidadesMap, null, 2));
      console.log(
        `\n✅ Saved ${Object.keys(localidadesMap).length} localidades to localidades_map.json`
      );
    }

    console.log(
      `\n💡 Conclusion: API response structure needs inspection. Check if missing fields can be fetched differently.`
    );
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

extractLocalidadeMappings().catch(console.error);

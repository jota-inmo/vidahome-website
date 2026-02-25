/**
 * Fetch 'tipos' and 'ciudades' from Inmovilla Web API
 * Uses the built-in 'tipos' and 'ciudades' processes
 * Single API call, minimal impact on rate limits
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { createInmovillaWebClient } from "../src/lib/api/web-client";
import fs from "fs";
import path from "path";

async function fetchMasterData() {
  console.log("🔍 Fetching master data (tipos + ciudades) from Inmovilla Web API\n");
  console.log("⚠️  Single API call with 2 processes — minimal rate limit impact\n");

  const numagencia = process.env.INMOVILLA_NUMAGENCIA || process.env.INMOVILLA_AGENCY_ID || "";
  const password = process.env.INMOVILLA_PASSWORD || "";
  const addnumagencia = process.env.INMOVILLA_ADDNUMAGENCIA || "";

  if (!numagencia || !password) {
    console.error("❌ Missing INMOVILLA_AGENCY_ID or INMOVILLA_WEB_PASSWORD in .env.local");
    console.log("\n📋 Available env vars:");
    Object.keys(process.env)
      .filter((k) => k.includes("INMOVILLA"))
      .forEach((k) => console.log(`  ${k}=${process.env[k]?.substring(0, 20)}...`));
    process.exit(1);
  }

  console.log(`📦 Agency: ${numagencia}`);
  console.log(`📦 Password: ${"*".repeat(Math.min(password.length, 8))}...\n`);

  const client = createInmovillaWebClient({
    numagencia,
    addnumagencia,
    password,
    idioma: 1,
    domain: "vidahome.es",
  });

  // Queue both processes in a single call
  client.addProcess("tipos", "1", "200", "", "");
  client.addProcess("ciudades", "1", "200", "", "");

  try {
    const result = await client.execute();

    console.log("✅ API Response received\n");
    console.log("📋 Response keys:", Object.keys(result));

    // Process TIPOS
    const tipos = result.tipos || result.lostipos || [];
    console.log(`\n📊 TIPOS: ${Array.isArray(tipos) ? tipos.length : "not an array"} entries`);

    if (Array.isArray(tipos) && tipos.length > 0) {
      console.log("   Sample:");
      tipos.slice(0, 5).forEach((t: any) => {
        console.log(`     ${JSON.stringify(t)}`);
      });

      // Build map: key_tipo -> nombre
      const tiposMap: Record<string, string> = {};
      tipos.forEach((t: any) => {
        const key = t.key_tipo || t.keytipo || t.id || t.key;
        const name = t.tipo_nombre || t.nombre || t.tipo || t.descripcion;
        if (key && name) {
          tiposMap[String(key)] = name;
        }
      });

      if (Object.keys(tiposMap).length > 0) {
        const tiposPath = path.resolve(__dirname, "../src/lib/api/tipos_map.json");
        fs.writeFileSync(tiposPath, JSON.stringify(tiposMap, null, 2));
        console.log(`\n   ✅ Saved ${Object.keys(tiposMap).length} tipos to tipos_map.json`);
      } else {
        console.log("\n   ⚠️  Could not build tipos map - inspect structure above");
      }
    } else {
      console.log("   Raw tipos data:", JSON.stringify(tipos).substring(0, 300));
    }

    // Process CIUDADES
    const ciudades = result.ciudades || result.localidades || [];
    console.log(`\n📊 CIUDADES: ${Array.isArray(ciudades) ? ciudades.length : "not an array"} entries`);

    if (Array.isArray(ciudades) && ciudades.length > 0) {
      console.log("   Sample:");
      ciudades.slice(0, 5).forEach((c: any) => {
        console.log(`     ${JSON.stringify(c)}`);
      });

      // Build map: key_loca -> nombre
      const localidadesMap: Record<string, string> = {};
      ciudades.forEach((c: any) => {
        const key = c.key_loca || c.keyloca || c.id || c.key;
        const name = c.poblacion || c.nombre || c.ciudad || c.localidad || c.municipio;
        if (key && name) {
          localidadesMap[String(key)] = name;
        }
      });

      if (Object.keys(localidadesMap).length > 0) {
        const locaPath = path.resolve(__dirname, "../src/lib/api/localidades_map.json");
        fs.writeFileSync(locaPath, JSON.stringify(localidadesMap, null, 2));
        console.log(`\n   ✅ Saved ${Object.keys(localidadesMap).length} localidades to localidades_map.json`);
      } else {
        console.log("\n   ⚠️  Could not build localidades map - inspect structure above");
      }
    } else {
      console.log("   Raw ciudades data:", JSON.stringify(ciudades).substring(0, 300));
    }

    // Also dump full raw response for inspection
    const debugPath = path.resolve(__dirname, "../output-webapi-master.json");
    fs.writeFileSync(debugPath, JSON.stringify(result, null, 2).substring(0, 5000));
    console.log(`\n📄 Raw response (first 5KB) saved to output-webapi-master.json`);

  } catch (error: any) {
    console.error("❌ Error:", error.message);
    
    if (error.message.includes("IP no autorizada")) {
      console.log("\n💡 Necesitas ejecutar desde Vercel o configurar ARSYS_PROXY_URL + ARSYS_PROXY_SECRET");
    }
    process.exit(1);
  }
}

fetchMasterData().catch(console.error);

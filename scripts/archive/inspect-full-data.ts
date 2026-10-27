import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function inspectFullData() {
  console.log("🔍 Inspeccionando full_data structure\n");

  // Get one property to inspect
  const { data, error } = await supabase
    .from("property_metadata")
    .select("cod_ofer, ref, tipo, poblacion, full_data")
    .eq("cod_ofer", 26286553)
    .single();

  if (error) {
    console.error("❌ Error:", error.message);
    return;
  }

  console.log(`📦 COD ${data.cod_ofer} · REF ${data.ref}\n`);
  console.log(`📄 DB Columns:`);
  console.log(`  tipo:     ${JSON.stringify(data.tipo)}`);
  console.log(`  poblacion: ${JSON.stringify(data.poblacion)}\n`);

  console.log(`📦 full_data keys:`);
  if (data.full_data) {
    Object.keys(data.full_data).forEach((key) => {
      const val = data.full_data[key];
      const display =
        typeof val === "string"
          ? `"${val.substring(0, 40)}..."`
          : JSON.stringify(val).substring(0, 40);
      console.log(`  ${key}: ${display}`);
    });
  }

  // Now get all properties and count how many have type info in full_data
  console.log("\n\n📊 Analizando todos los properties...\n");

  const { data: allProps, error: allError } = await supabase
    .from("property_metadata")
    .select("cod_ofer, ref, tipo, poblacion, full_data")
    .order("cod_ofer", { ascending: true });

  if (allError) {
    console.error("❌ Error:", allError.message);
    return;
  }

  let tiposFound = 0;
  let poblacionesFound = 0;
  let sampleTipos: string[] = [];
  let samplePoblaciones: string[] = [];

  (allProps || []).forEach((p: any) => {
    const fd = p.full_data || {};
    const tipoFromFd = fd.tipo_nombre || fd.tipo || fd.TipoObjeto || fd.descripcionTipo;
    const pobFromFd = fd.poblacion || fd.municipio || fd.Municipio || fd.Poblacion;

    if (tipoFromFd) {
      tiposFound++;
      if (sampleTipos.length < 3) sampleTipos.push(`${p.ref}: ${tipoFromFd}`);
    }

    if (pobFromFd) {
      poblacionesFound++;
      if (samplePoblaciones.length < 3) samplePoblaciones.push(`${p.ref}: ${pobFromFd}`);
    }
  });

  console.log(`✅ Propiedades con tipo en full_data:     ${tiposFound}/${allProps.length}`);
  console.log(`   Ejemplos: ${sampleTipos.join(" | ")}\n`);

  console.log(`✅ Propiedades con población en full_data: ${poblacionesFound}/${allProps.length}`);
  console.log(`   Ejemplos: ${samplePoblaciones.join(" | ")}\n`);

  // Show raw full_data for 3 properties
  console.log("\n📋 Contenido raw de full_data (primeras 3 propiedades):\n");
  (allProps || [])
    .slice(0, 3)
    .forEach((p: any) => {
      console.log(`COD ${p.cod_ofer} · ${p.ref}:`);
      console.log(JSON.stringify(p.full_data, null, 2).substring(0, 400));
      console.log("");
    });
}

inspectFullData().catch(console.error);

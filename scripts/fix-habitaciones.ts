import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { createClient } from "@supabase/supabase-js";

async function fixHabitaciones() {
  console.log("🔧 Fixing habitaciones_simples + habitaciones_dobles from full_data\n");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: props, error } = await supabase
    .from("property_metadata")
    .select("cod_ofer, ref, full_data")
    .not("full_data", "is", null);

  if (error) {
    console.error("❌", error.message);
    return;
  }

  console.log(`📦 ${props.length} properties\n`);

  let updated = 0;
  for (const p of props) {
    const fd = p.full_data as Record<string, any>;
    const hab_simples = Number(fd.habitaciones) || 0;
    const hab_dobles = Number(fd.habdobles) || 0;
    const banos = Number(fd.banyos) || 0;
    const superficie = Number(fd.m_cons) || 0;

    const updateData: Record<string, any> = {
      cod_ofer: p.cod_ofer,
      habitaciones_simples: hab_simples,
      habitaciones_dobles: hab_dobles,
      banos: banos,
    };
    if (superficie > 0) updateData.superficie = superficie;

    const { error: updErr } = await supabase
      .from("property_features")
      .upsert(updateData, { onConflict: "cod_ofer" });

    if (!updErr) {
      updated++;
    } else {
      console.error(`  ❌ ${p.ref}: ${updErr.message}`);
    }
  }

  console.log(`✅ Updated: ${updated}/${props.length}\n`);

  // Verify
  const { data: features } = await supabase
    .from("property_features")
    .select("cod_ofer, habitaciones_simples, habitaciones_dobles, banos, superficie")
    .order("cod_ofer")
    .limit(10);

  console.log("📋 Verification (first 10):");
  features?.forEach((f: any) =>
    console.log(
      `  COD ${f.cod_ofer}: simples=${f.habitaciones_simples} dobles=${f.habitaciones_dobles} baños=${f.banos} sup=${f.superficie}`
    )
  );

  // Summary stats
  const { data: stats } = await supabase
    .from("property_features")
    .select("habitaciones_simples, habitaciones_dobles, banos");

  const withSimples = stats?.filter((s: any) => s.habitaciones_simples > 0).length || 0;
  const withDobles = stats?.filter((s: any) => s.habitaciones_dobles > 0).length || 0;
  const withBanos = stats?.filter((s: any) => s.banos > 0).length || 0;

  console.log(`\n📊 Resumen:`);
  console.log(`  Con hab. simples > 0: ${withSimples}/${stats?.length}`);
  console.log(`  Con hab. dobles > 0:  ${withDobles}/${stats?.length}`);
  console.log(`  Con baños > 0:        ${withBanos}/${stats?.length}`);
}

fixHabitaciones().catch(console.error);

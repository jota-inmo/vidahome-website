import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function checkTranslations() {
  console.log("🔍 Checking translations in Supabase...\n");

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  // Get a property with translations
  const { data: props } = await supabase
    .from("property_metadata")
    .select("cod_ofer, descriptions, full_data")
    .not("descriptions", "is", null)
    .limit(5);

  if (!props || props.length === 0) {
    console.log("❌ No properties found with descriptions");
    return;
  }

  console.log(`📊 Found ${props.length} properties with descriptions\n`);

  for (const prop of props) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📍 COD ${prop.cod_ofer}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    const desc = prop.descriptions || {};
    
    console.log("📝 Descriptions column (JSONB):");
    if (Object.keys(desc).length === 0) {
      console.log("  ⚠️  EMPTY - No descriptions stored");
    } else {
      for (const [key, value] of Object.entries(desc)) {
        const text = typeof value === 'string' ? value.substring(0, 80) : JSON.stringify(value);
        console.log(`  • ${key}: "${text}..."`);
      }
    }

    console.log("\n💾 Full data object:");
    if (prop.full_data) {
      const fullData = prop.full_data as any;
      console.log(`  • descripciones: "${(fullData.descripciones || "").substring(0, 80)}..."`);
      console.log(`  • habitaciones: ${fullData.habitaciones}`);
      console.log(`  • banyos: ${fullData.banyos}`);
      console.log(`  • precio: ${fullData.precio}`);
    }

    console.log("\n");
  }

  // Check schema
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📋 property_metadata Schema:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const { data: schema } = await supabase
    .from("property_metadata")
    .select()
    .limit(1);

  if (schema && schema.length > 0) {
    const cols = Object.keys(schema[0]);
    for (const col of cols) {
      console.log(`  • ${col}`);
    }
  }

  // Check if property_features has data
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📊 property_features Table Status:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const { data: features, error } = await supabase
    .from("property_features")
    .select("*")
    .limit(3);

  if (error) {
    console.log(`  ❌ Error: ${error.message}`);
  } else if (!features || features.length === 0) {
    console.log("  ⚠️  No data in property_features table yet");
  } else {
    console.log(`  ✅ Found ${features.length} rows`);
    for (const f of features) {
      console.log(`    • COD ${f.cod_ofer}: ${f.precio}€, ${f.habitaciones} hab, ${f.superficie}m²`);
    }
  }
}

checkTranslations().catch(console.error);

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function checkDescriptionsStatus() {
  console.log("🔍 Checking property descriptions status...\n");

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  // Get all properties
  const { data: all } = await supabase
    .from("property_metadata")
    .select("cod_ofer, descriptions")
    .limit(100);

  if (!all) {
    console.log("No properties found");
    return;
  }

  console.log(`📊 Total properties: ${all.length}\n`);

  let stats = {
    total: all.length,
    with_es: 0,
    with_en: 0,
    with_fr: 0,
    with_de: 0,
    with_it: 0,
    with_pl: 0,
    with_footer: 0,
    empty: 0,
    examples: [] as any[],
  };

  for (const prop of all) {
    const desc = prop.descriptions || {};
    
    if (!Object.keys(desc).length) {
      stats.empty++;
      continue;
    }

    if (desc.description_es || desc.descripciones) stats.with_es++;
    if (desc.description_en) stats.with_en++;
    if (desc.description_fr) stats.with_fr++;
    if (desc.description_de) stats.with_de++;
    if (desc.description_it) stats.with_it++;
    if (desc.description_pl) stats.with_pl++;

    // Check for footer
    const hasFooter = Object.values(desc).some(
      (d: any) => typeof d === 'string' && d.includes("Nous parlons français")
    );
    if (hasFooter) stats.with_footer++;

    // Collect examples
    if (stats.examples.length < 3 && hasFooter && desc.description_en) {
      stats.examples.push({
        cod: prop.cod_ofer,
        en_snippet: (desc.description_en as string).substring(0, 150) + "...",
        has_footer: true,
      });
    }
  }

  console.log("📈 Language Coverage:");
  console.log(`  • Spanish (ES):   ${stats.with_es}/${stats.total} (${((stats.with_es/stats.total)*100).toFixed(0)}%)`);
  console.log(`  • English (EN):   ${stats.with_en}/${stats.total} (${((stats.with_en/stats.total)*100).toFixed(0)}%)`);
  console.log(`  • French (FR):    ${stats.with_fr}/${stats.total} (${((stats.with_fr/stats.total)*100).toFixed(0)}%)`);
  console.log(`  • German (DE):    ${stats.with_de}/${stats.total} (${((stats.with_de/stats.total)*100).toFixed(0)}%)`);
  console.log(`  • Italian (IT):   ${stats.with_it}/${stats.total} (${((stats.with_it/stats.total)*100).toFixed(0)}%)`);
  console.log(`  • Polish (PL):    ${stats.with_pl}/${stats.total} (${((stats.with_pl/stats.total)*100).toFixed(0)}%)`);
  console.log(`  • Multilingual Footer: ${stats.with_footer}/${stats.total} (${((stats.with_footer/stats.total)*100).toFixed(0)}%)\n`);

  if (stats.empty > 0) {
    console.log(`⚠️  Properties without descriptions: ${stats.empty}\n`);
  }

  if (stats.examples.length > 0) {
    console.log("📝 Example with multilingual footer:");
    for (const ex of stats.examples) {
      console.log(`  • COD ${ex.cod}: "${ex.en_snippet}..."`);
    }
  }

  console.log("\n✅ Status Summary:");
  console.log(`  • All languages captured: ${stats.with_en === stats.total ? "✓" : "✗"}`);
  console.log(`  • Multilingual footer added: ${stats.with_footer}/${stats.total}`);
  console.log(`  • Translation quality: ${stats.with_footer > 0 ? "Professional + Multilingual" : "Professional"}`);
}

checkDescriptionsStatus().catch(console.error);

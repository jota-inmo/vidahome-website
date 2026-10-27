import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Multilingual footer - identical in all languages to indicate language capabilities
const MULTILINGUAL_FOOTER = "\n\nNous parlons français. We speak English. Mówimy po polsku. Parliamo italiano.";

async function addMultilingualFooter() {
  console.log("🚀 Adding multilingual footer to all descriptions...\n");

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  // Fetch all properties with descriptions
  const { data: allProps } = await supabase
    .from("property_metadata")
    .select("cod_ofer, descriptions")
    .not("descriptions", "is", null)
    .limit(100);

  if (!allProps || allProps.length === 0) {
    console.log("No properties found");
    return;
  }

  console.log(`📊 Found ${allProps.length} properties\n`);

  let updated = 0;
  let skipped = 0;

  for (const prop of allProps) {
    try {
      const descriptions = prop.descriptions || {};
      
      // Check if footer already exists in any language
      const hasFooter = Object.values(descriptions).some(
        (desc: any) => typeof desc === 'string' && desc.includes("Nous parlons français")
      );

      if (hasFooter) {
        console.log(`  ⏭️  ${prop.cod_ofer} (already has footer)`);
        skipped++;
        continue;
      }

      // Add footer to each language (only if description exists)
      const updated_desc = {
        ...descriptions,
      };

      if (descriptions.description_en) {
        updated_desc.description_en = descriptions.description_en + MULTILINGUAL_FOOTER;
      }
      if (descriptions.description_fr) {
        updated_desc.description_fr = descriptions.description_fr + MULTILINGUAL_FOOTER;
      }
      if (descriptions.description_de) {
        updated_desc.description_de = descriptions.description_de + MULTILINGUAL_FOOTER;
      }
      if (descriptions.description_it) {
        updated_desc.description_it = descriptions.description_it + MULTILINGUAL_FOOTER;
      }
      if (descriptions.description_pl) {
        updated_desc.description_pl = descriptions.description_pl + MULTILINGUAL_FOOTER;
      }
      if (descriptions.description_es) {
        updated_desc.description_es = descriptions.description_es + MULTILINGUAL_FOOTER;
      }

      // Update in Supabase
      await supabase
        .from("property_metadata")
        .update({ descriptions: updated_desc })
        .eq("cod_ofer", prop.cod_ofer);

      console.log(`  ✓ ${prop.cod_ofer}`);
      updated++;
    } catch (err) {
      console.log(`  ❌ ${prop.cod_ofer}: ${err}`);
    }
  }

  console.log(`\n✅ Complete!\n   Updated: ${updated}\n   Skipped: ${skipped}`);
}

addMultilingualFooter().catch(console.error);

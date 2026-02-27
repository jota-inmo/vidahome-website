import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const refs = ["2960","2959","A2958","A2884","2664","2703","2726","2734","2723","2737","2724","2751","2762","2742","2774","2783","2788","2784","2790","2798","2801","2771","2813","2819","2821","2882","2826"];
  const { data } = await sb.from("property_metadata").select("cod_ofer,ref,descriptions,full_data").in("ref", refs);
  for (const p of data || []) {
    const desc = p.descriptions || {};
    const es = (desc.description_es || "").slice(0, 40) || "EMPTY";
    const fd = (p.full_data?.descripciones || "").slice(0, 40) || "EMPTY";
    console.log(`${p.ref} | es=${es} | fd=${fd}`);
  }
  console.log(`\nTotal found: ${data?.length}`);
}
main().catch(console.error);


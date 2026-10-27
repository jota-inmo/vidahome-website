import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const { data } = await sb.from("hero_slides").select("id,title,video_path,order").order("order");
  for (const s of data || []) {
    console.log(`${s.order} | ${s.video_path} | ${s.title}`);
  }
}
main().catch(console.error);


import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function inspect() {
  // Get 1 row to see columns
  const { data, error } = await supabase.from("encargos").select("*").limit(2);
  if (error) {
    console.log("ERROR:", error.message);
    return;
  }
  if (!data || data.length === 0) {
    console.log("Table encargos is empty or not accessible");
    return;
  }

  console.log("COLUMNS:", Object.keys(data[0]).join(", "));
  console.log("\nROW 1:", JSON.stringify(data[0], null, 2));

  // Count total
  const { count } = await supabase
    .from("encargos")
    .select("*", { count: "exact", head: true });
  console.log("\nTOTAL ROWS:", count);
}

inspect().catch(console.error);

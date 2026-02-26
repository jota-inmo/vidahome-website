import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createTable() {
  // Try inserting into the table to check if it exists
  const { error: checkErr } = await supabase
    .from("discrepancias_dismissed")
    .select("id")
    .limit(1);

  if (checkErr && checkErr.message.includes("does not exist")) {
    console.log("Table does not exist. Please run this SQL in Supabase Dashboard:");
    console.log(`
CREATE TABLE IF NOT EXISTS discrepancias_dismissed (
  id SERIAL PRIMARY KEY,
  ref TEXT NOT NULL,
  campo TEXT NOT NULL,
  valor_encargo TEXT NOT NULL,
  valor_web TEXT NOT NULL,
  dismissed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ref, campo, valor_encargo, valor_web)
);
CREATE INDEX IF NOT EXISTS idx_discrepancias_dismissed_ref ON discrepancias_dismissed(ref);
    `);
  } else {
    console.log("✅ Table discrepancias_dismissed already exists");
  }
}

createTable().catch(console.error);

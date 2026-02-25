import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function setupPriceAudit() {
  console.log('🔧 Setting up price audit table...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  // Try to verify if table exists
  try {
    const { data: test, error: testError } = await supabase
      .from('price_audit')
      .select('id', { count: 'exact', head: true });

    if (!testError) {
      console.log('✅ Price audit table already exists!');
      console.log('✅ Table is ready for use');
      console.log('\n✨ Price audit system ready!\n');
      return;
    }
  } catch (e) {
    // Table doesn't exist
  }

  // If we get here, table doesn't exist
  console.log('❌ Table price_audit not found\n');
  console.log('📋 To create the table, please run this SQL in Supabase:\n');
  console.log('1. Go to: https://supabase.com/dashboard/project → SQL Editor');
  console.log('2. Click: "New Query"');
  console.log('3. Copy and paste this SQL:\n');
  console.log('=' .repeat(70));
  
  // Read and display the SQL
  const sqlPath = path.join(__dirname, '..', 'migrations', 'create_price_audit_table.sql');
  if (fs.existsSync(sqlPath)) {
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    console.log(sql);
  } else {
    console.log(`
CREATE TABLE IF NOT EXISTS public.price_audit (
    id BIGSERIAL PRIMARY KEY,
    cod_ofer INTEGER NOT NULL REFERENCES property_metadata(cod_ofer) ON DELETE CASCADE,
    old_price INTEGER,
    new_price INTEGER NOT NULL,
    price_change INTEGER,
    percentage_change NUMERIC(5,2),
    changed_by TEXT DEFAULT 'system',
    changed_at TIMESTAMPTZ DEFAULT now(),
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_price_audit_cod_ofer ON public.price_audit(cod_ofer DESC);
CREATE INDEX IF NOT EXISTS idx_price_audit_changed_at ON public.price_audit(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_audit_price_change ON public.price_audit(price_change);

ALTER TABLE public.price_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow all read price_audit" ON public.price_audit FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Allow service role insert price_audit" ON public.price_audit 
  FOR INSERT 
  WITH CHECK (true);
    `);
  }
  
  console.log('=' .repeat(70));
  console.log('\n4. Click: "Run"');
  console.log('5. After success, run: npm run check:price-audit\n');
}

setupPriceAudit().catch(console.error);

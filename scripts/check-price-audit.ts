import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function checkPriceAudit() {
  console.log('📊 Price Audit Report\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  // First, check if table exists
  const { count: auditCount, error: tableError } = await supabase
    .from('price_audit')
    .select('*', { count: 'exact', head: true });

  if (tableError) {
    console.log('❌ Table price_audit not found');
    console.log('   Run: npm run setup:price-audit');
    return;
  }

  // Table exists, now get the actual records
  if (!auditCount || auditCount === 0) {
    console.log('✅ Table price_audit exists (empty)');
    console.log('⚠️  No price changes recorded yet');
    console.log('   Changes will appear after first sync with price changes');
    return;
  }

  // Get actual data if table has records
  const { data: auditData, error: auditError } = await supabase
    .from('price_audit')
    .select('*')
    .order('changed_at', { ascending: false })
    .limit(20);

  if (auditError || !auditData) {
    console.log('⚠️  Could not fetch price audit records');
    console.log('   But table exists with ' + auditCount + ' records');
    return;
  }

  console.log(`✅ Found ${auditData.length} price change records\n`);

  // Summary statistics
  const increases = auditData.filter((a: any) => a.price_change && a.price_change > 0).length;
  const decreases = auditData.filter((a: any) => a.price_change && a.price_change < 0).length;
  const new_props = auditData.filter((a: any) => a.old_price === null).length;

  console.log('📈 Summary (Last 20 changes):');
  console.log(`  • Increases: ${increases}`);
  console.log(`  • Decreases: ${decreases}`);
  console.log(`  • New properties: ${new_props}`);
  console.log('');

  // Recent changes
  console.log('🕐 Recent Price Changes:');
  console.log('');
  console.log(
    '┌────────────┬──────────┬──────────┬──────────┬─────────┬────────────────┐'
  );
  console.log(
    '│ Propiedad  │ Precio   │ Anterior │ Cambio   │   %     │ Cuándo         │'
  );
  console.log(
    '├────────────┼──────────┼──────────┼──────────┼─────────┼────────────────┤'
  );

  for (const record of auditData.slice(0, 10)) {
    const cod = String(record.cod_ofer).padEnd(10);
    const new_p = `€${record.new_price || 0}`.padEnd(8);
    const old_p = record.old_price ? `€${record.old_price}`.padEnd(8) : '(NEW)'.padEnd(8);
    const change = record.price_change
      ? `€${record.price_change > 0 ? '+' : ''}${record.price_change}`.padEnd(8)
      : '  -  '.padEnd(8);
    const pct = record.percentage_change
      ? `${record.percentage_change > 0 ? '+' : ''}${record.percentage_change.toFixed(1)}%`.padEnd(7)
      : '  -  '.padEnd(7);
    const date = new Date(record.changed_at).toLocaleString('es-ES').padEnd(14);

    console.log(`│ ${cod} │ ${new_p} │ ${old_p} │ ${change} │ ${pct} │ ${date} │`);
  }

  console.log(
    '└────────────┴──────────┴──────────┴──────────┴─────────┴────────────────┘'
  );

  // Stats by property
  console.log('\n📊 Most Active Properties (price changes):');
  const propChanges: Record<number, number> = {};
  for (const record of auditData) {
    propChanges[record.cod_ofer] = (propChanges[record.cod_ofer] || 0) + 1;
  }

  const sorted = Object.entries(propChanges)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  for (const [cod, count] of sorted) {
    console.log(`  • Property ${cod}: ${count} changes`);
  }
}

checkPriceAudit().catch(console.error);
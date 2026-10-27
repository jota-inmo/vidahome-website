// Copy description_es (and other langs) from `properties` table → `property_metadata.descriptions`
// Run: node scripts/copy-descriptions-from-properties.mjs

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load .env.local manually
const envFile = readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(
  envFile.split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()]; })
);

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

// 1. Fetch all rows from `properties` table
const { data: props, error: e1 } = await sb
  .from('properties')
  .select('property_id, ref, description_es, description_en, description_fr, description_de, description_it')
  .limit(500);

if (e1 || !props) { console.error('❌ Error fetching properties:', e1); process.exit(1); }
console.log(`📦 ${props.length} rows in properties table`);

// 2. Fetch existing descriptions from property_metadata (keyed by cod_ofer)
const { data: metas, error: e2 } = await sb
  .from('property_metadata')
  .select('cod_ofer, descriptions')
  .limit(500);

if (e2 || !metas) { console.error('❌ Error fetching property_metadata:', e2); process.exit(1); }

const metaMap = new Map(metas.map(m => [m.cod_ofer, m.descriptions || {}]));
console.log(`🗄️  ${metas.length} rows in property_metadata\n`);

let ok = 0, skip = 0, errCount = 0;

for (const p of props) {
  const es = (p.description_es || '').trim();
  if (!es) { skip++; continue; }

  if (!metaMap.has(p.property_id)) {
    console.log(`  ⚠️  ref ${p.ref} (${p.property_id}) not found in property_metadata — skip`);
    skip++;
    continue;
  }

  const existing = metaMap.get(p.property_id);

  // Only fill fields that are currently empty
  const newDesc = {
    description_es: (existing.description_es || '').trim() || p.description_es || '',
    description_en: (existing.description_en || '').trim() || p.description_en || '',
    description_fr: (existing.description_fr || '').trim() || p.description_fr || '',
    description_de: (existing.description_de || '').trim() || p.description_de || '',
    description_it: (existing.description_it || '').trim() || p.description_it || '',
    description_pl: (existing.description_pl || '').trim() || '',
  };

  const { error } = await sb
    .from('property_metadata')
    .update({ descriptions: newDesc })
    .eq('cod_ofer', p.property_id);

  if (error) {
    console.log(`  ✗ ref ${p.ref}: ${error.message}`);
    errCount++;
  } else {
    const langs = ['en','fr','de','it'].filter(l => newDesc[`description_${l}`]);
    console.log(`  ✓ ref ${p.ref} — ES ✓ ${langs.length ? `| también: ${langs.join(',')}` : ''}`);
    ok++;
  }
}

console.log(`\n✅ Copiadas: ${ok} | Saltadas: ${skip} | Errores: ${errCount}`);
console.log('\nAhora ejecuta: npx tsx scripts/fix-and-translate.ts');

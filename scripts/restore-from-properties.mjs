/**
 * restore-from-properties.mjs
 *
 * "Nuclear restore" — repopulates property_metadata.descriptions from the
 * permanent backup in the `properties` table.
 *
 * Use when a full sync has wiped descriptions and you need to get them back:
 *   node scripts/restore-from-properties.mjs
 *
 * Safe to run multiple times (only overwrites if backup has data).
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Load .env.local from project root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

async function main() {
  console.log('🔄 Restoring descriptions from properties backup table...\n');

  // Load all backup rows
  const { data: backupRows, error: bErr } = await sb
    .from('properties')
    .select('property_id, description_es, description_en, description_fr, description_de, description_it, description_pl');

  if (bErr) { console.error('Failed to read properties table:', bErr.message); process.exit(1); }
  if (!backupRows?.length) { console.log('No rows found in properties table.'); return; }

  console.log(`📚 ${backupRows.length} backup rows loaded`);

  // Build a map
  const backupMap = new Map(backupRows.map(r => [r.property_id, r]));

  // Load current property_metadata descriptions
  const { data: metas, error: mErr } = await sb
    .from('property_metadata')
    .select('cod_ofer, descriptions');

  if (mErr) { console.error('Failed to read property_metadata:', mErr.message); process.exit(1); }
  if (!metas?.length) { console.log('No rows in property_metadata.'); return; }

  console.log(`🗄️  ${metas.length} property_metadata rows loaded\n`);

  let updated = 0;
  let skipped = 0;

  for (const meta of metas) {
    const backup = backupMap.get(meta.cod_ofer);
    if (!backup) { skipped++; continue; }

    const existing = meta.descriptions || {};

    // Only restore fields that are currently blank
    const merged = {
      description_es: existing.description_es || backup.description_es || '',
      description_en: existing.description_en || backup.description_en || '',
      description_fr: existing.description_fr || backup.description_fr || '',
      description_de: existing.description_de || backup.description_de || '',
      description_it: existing.description_it || backup.description_it || '',
      description_pl: existing.description_pl || backup.description_pl || '',
    };

    // Skip if nothing changed
    const changed = Object.keys(merged).some(k => merged[k] !== (existing[k] || ''));
    if (!changed) { skipped++; continue; }

    const { error } = await sb
      .from('property_metadata')
      .update({ descriptions: merged })
      .eq('cod_ofer', meta.cod_ofer);

    if (error) {
      console.error(`  ❌ ${meta.cod_ofer}: ${error.message}`);
    } else {
      updated++;
      process.stdout.write('.');
    }
  }

  console.log(`\n\n✅ Done! Updated: ${updated} | Skipped (no backup or unchanged): ${skipped}`);
}

main().catch(console.error);

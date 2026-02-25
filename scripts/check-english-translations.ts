import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function checkEnglishTranslations() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  console.log('🔍 Checking English translations in database...\n');

  // Get all properties with descriptions
  const { data: props, error } = await supabase
    .from('property_metadata')
    .select('cod_ofer, ref, descriptions')
    .limit(100);

  if (error) {
    console.log('❌ Error fetching properties:', error.message);
    return;
  }

  if (!props) {
    console.log('❌ No properties found');
    return;
  }

  const stats = {
    total: props.length,
    have_spanish: 0,
    have_english: 0,
    both_es_and_en: 0,
    only_es: 0,
    only_en: 0,
    empty: 0,
  };

  const examples = [];

  for (const prop of props) {
    const desc = prop.descriptions as Record<string, string> || {};
    const has_es = !!(desc.description_es || desc.descripciones);
    const has_en = !!desc.description_en;

    if (!has_es && !has_en) {
      stats.empty++;
      continue;
    }

    if (has_es) stats.have_spanish++;
    if (has_en) stats.have_english++;

    if (has_es && has_en) {
      stats.both_es_and_en++;
      if (examples.length < 5) {
        examples.push({
          cod_ofer: prop.cod_ofer,
          ref: prop.ref,
          es_sample: (desc.description_es || desc.descripciones || '').substring(0, 80),
          en_sample: (desc.description_en || '').substring(0, 80),
        });
      }
    } else if (has_es && !has_en) {
      stats.only_es++;
    } else if (!has_es && has_en) {
      stats.only_en++;
    }
  }

  console.log('📊 TRANSLATION COVERAGE:');
  console.log(`  Total properties: ${stats.total}`);
  console.log(`  With Spanish: ${stats.have_spanish} (${((stats.have_spanish / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  With English: ${stats.have_english} (${((stats.have_english / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  Both ES+EN: ${stats.both_es_and_en} (${((stats.both_es_and_en / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  Only Spanish: ${stats.only_es}`);
  console.log(`  Only English: ${stats.only_en}`);
  console.log(`  Empty: ${stats.empty}\n`);

  if (examples.length > 0) {
    console.log('📋 EXAMPLES (with both ES+EN):');
    for (const ex of examples) {
      console.log(`\n  Property ${ex.cod_ofer} (${ex.ref}):`);
      console.log(`    ES: ${ex.es_sample}...`);
      console.log(`    EN: ${ex.en_sample}...`);
    }
  }
}

checkEnglishTranslations().catch(console.error);

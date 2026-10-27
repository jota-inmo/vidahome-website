import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const { data } = await sb.from('property_metadata').select('cod_ofer, descriptions, full_data').eq('nodisponible', false).limit(200);

let withEs = 0, noEs = 0, withEn = 0, noEn = 0, withFr = 0, withDe = 0, fullDataHasDesc = 0;
for (const p of data || []) {
    const d = p.descriptions || {};
    const es = (d.description_es || '').trim();
    const fdEs = (p.full_data?.descripciones || '').trim();
    if (es) withEs++; else noEs++;
    if ((d.description_en || '').trim()) withEn++; else noEn++;
    if ((d.description_fr || '').trim()) withFr++;
    if ((d.description_de || '').trim()) withDe++;
    if (fdEs) fullDataHasDesc++;
}
console.log('Total active:', (data || []).length);
console.log('description_es populated:', withEs, '| missing:', noEs);
console.log('description_en populated:', withEn, '| missing:', noEn);
console.log('description_fr populated:', withFr);
console.log('description_de populated:', withDe);
console.log('full_data.descripciones populated:', fullDataHasDesc);

const missing = (data || []).filter((p: any) => !(p.descriptions?.description_es || '').trim()).slice(0, 3);
for (const p of missing) {
    console.log(`  cod_ofer=${p.cod_ofer} | full_data.descripciones="${(p.full_data?.descripciones||'').substring(0,80)}"`);
}
}
main().catch(console.error);

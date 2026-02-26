import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import localidades from '../src/lib/api/localidades_map.json';
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

(async () => {
  // Check all properties with null poblacion
  const { data } = await s.from('property_metadata').select('ref, poblacion, full_data');
  const missing: any[] = [];
  for (const p of data || []) {
    const fd = (p.full_data as any) || {};
    const kl = String(fd.key_loca || '');
    const mapped = (localidades as Record<string, string>)[kl];
    if (!p.poblacion || p.poblacion.trim() === '') {
      missing.push({ ref: p.ref, key_loca: kl, cp: fd.cp, mapped, poblacion_fd: fd.poblacion });
    }
  }
  console.log('Properties with null/empty poblacion:', missing.length);
  missing.forEach(m => console.log(JSON.stringify(m)));
})();

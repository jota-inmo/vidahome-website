/**
 * audit-vs-inmovilla.ts
 *
 * MODE A (default, works locally):
 *   Compares Supabase dedicated columns vs the raw full_data JSON stored at last sync.
 *   Shows which properties have stale/missing column data.
 *
 * MODE B (--live, needs ARSYS proxy in .env.local):
 *   Fetches live data from Inmovilla API and compares against Supabase.
 *   Detects updates since last sync.
 *
 * Usage:
 *   npx tsx scripts/audit-vs-inmovilla.ts          (Mode A)
 *   npx tsx scripts/audit-vs-inmovilla.ts --live   (Mode B)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const AGENCIA      = process.env.INMOVILLA_AGENCIA!;
const ADDAGENCIA   = process.env.INMOVILLA_ADDAGENCIA || '';
const PASSWORD     = process.env.INMOVILLA_PASSWORD!;
const DOMAIN       = process.env.INMOVILLA_DOMAIN || 'vidahome.es';
const PROXY_URL    = process.env.ARSYS_PROXY_URL;
const PROXY_SECRET = process.env.ARSYS_PROXY_SECRET;
const LIVE_MODE    = process.argv.includes('--live');

// ─── API call ────────────────────────────────────────────────────────────────

async function callInmovilla(proceso: string, pos: number, num: number, where = '', orden = '') {
  const texto  = `${AGENCIA}${ADDAGENCIA};${PASSWORD};1;lostipos;${proceso};${pos};${num};${where};${orden}`;
  const encode = (s: string) => encodeURIComponent(s).replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  const body   = `param=${encode(texto)}&elDominio=${encode(DOMAIN)}&ia=127.0.0.1&laIP=127.0.0.1&json=1`;
  const BASE   = 'https://apiweb.inmovilla.com/apiweb/apiweb.php';

  const response = PROXY_URL && PROXY_SECRET
    ? await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Proxy-Secret': PROXY_SECRET },
        body: JSON.stringify({ body }),
      })
    : await fetch(BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0 (Windows; U; Windows NT 5.1)' },
        body,
      });

  const text = await response.text();
  if (text.includes('IP NO VALIDADA')) throw new Error('IP NO VALIDADA — añade ARSYS_PROXY_URL y ARSYS_PROXY_SECRET a .env.local');
  return JSON.parse(text);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const n = (v: any): number => Number(v) || 0;
const s = (v: any): string => (v == null || v === '') ? '' : String(v).trim();
const fmt = (v: any): string => (v == null || v === '' || v === 0) ? '—' : String(v);

function diffField(label: string, fromSource: any, fromDB: any): string | null {
  if (s(fromSource) === s(fromDB)) return null;
  return `    ⚠  ${label.padEnd(20)}  fuente: ${fmt(fromSource).padEnd(22)}  DB: ${fmt(fromDB)}`;
}

// ─── Mode A: columns vs full_data ──────────────────────────────────────────

async function modeA(supabase: ReturnType<typeof createClient>) {
  console.log('📋  MODO A — Columnas Supabase vs full_data (último sync)\n');
  console.log('    Para comparar contra la API en vivo: npx tsx scripts/audit-vs-inmovilla.ts --live\n');

  const { data: meta, error } = await supabase
    .from('property_metadata')
    .select('cod_ofer, ref, tipo, precio, poblacion, full_data')
    .order('cod_ofer');
  if (error) throw new Error('Supabase: ' + error.message);

  const { data: feats } = await supabase
    .from('property_features')
    .select('cod_ofer, superficie, habitaciones, habitaciones_simples, habitaciones_dobles, banos');

  const featMap = new Map((feats || []).map((f: any) => [Number(f.cod_ofer), f]));

  let perfect = 0, wrong = 0;
  const lines: string[] = [];

  for (const row of (meta || []) as any[]) {
    const cod = Number(row.cod_ofer);
    const fd  = (row.full_data as any) || {};
    const f   = featMap.get(cod) as any;

    const fdTipo   = fd.tipo_nombre || fd.tipo || '';
    const dbTipo   = row.tipo && row.tipo !== 'Property' ? row.tipo : '';
    const fdPrecio = n(fd.precioinmo) || n(fd.precio);
    const dbPrecio = n(row.precio);
    const fdPob    = fd.poblacion || fd.municipio || '';
    const dbPob    = row.poblacion || '';
    const fdSup    = n(fd.m_cons);
    const fdHabS   = n(fd.habitaciones);
    const fdHabD   = n(fd.habdobles);
    const fdBanos  = n(fd.banyos);

    const diffs: string[] = [
      diffField('tipo',         fdTipo,  dbTipo),
      fdPrecio > 0 && Math.abs(fdPrecio - dbPrecio) > 0
        ? `    ⚠  ${'precio'.padEnd(20)}  fuente: ${String(fdPrecio).padEnd(22)}  DB: ${fmt(dbPrecio)}${Math.abs(fdPrecio - dbPrecio) > 5000 ? '  ⚡ GRAN DIF' : ''}`
        : null,
      diffField('poblacion',    fdPob,   dbPob),
      fdSup  > 0 && fdSup  !== n(f?.superficie)         ? `    ⚠  ${'superficie m²'.padEnd(20)}  fuente: ${String(fdSup).padEnd(22)}  DB: ${fmt(f?.superficie)}` : null,
      fdHabS > 0 && fdHabS !== n(f?.habitaciones_simples) ? `    ⚠  ${'hab_simples'.padEnd(20)}  fuente: ${String(fdHabS).padEnd(22)}  DB: ${fmt(f?.habitaciones_simples)}` : null,
      fdHabD > 0 && fdHabD !== n(f?.habitaciones_dobles)  ? `    ⚠  ${'hab_dobles'.padEnd(20)}  fuente: ${String(fdHabD).padEnd(22)}  DB: ${fmt(f?.habitaciones_dobles)}` : null,
      fdBanos > 0 && fdBanos !== n(f?.banos)              ? `    ⚠  ${'banos'.padEnd(20)}  fuente: ${String(fdBanos).padEnd(22)}  DB: ${fmt(f?.banos)}` : null,
    ].filter(Boolean) as string[];

    if (diffs.length === 0) {
      perfect++;
    } else {
      wrong++;
      const ref      = row.ref || fd.ref || `#${cod}`;
      const tipo     = fdTipo || dbTipo || '?';
      const pob      = fdPob || dbPob || '?';
      const precio   = fdPrecio ? fdPrecio.toLocaleString('es-ES') + ' €' : '—';
      lines.push(`\n  📋  COD ${String(cod).padEnd(6)} · ${String(ref).padEnd(10)} · ${tipo.padEnd(16)} · ${pob.padEnd(16)} · ${precio}`);
      diffs.forEach(d => lines.push(d));
    }
  }

  if (lines.length) {
    console.log('─'.repeat(72));
    lines.forEach(l => console.log(l));
    console.log('\n' + '─'.repeat(72));
  }

  console.log('\n📊  RESUMEN\n');
  console.log(`  ✅  Datos coherentes:            ${perfect}`);
  console.log(`  ⚠   Columnas desfasadas:         ${wrong}`);
  console.log(`  📦  Total propiedades:            ${(meta || []).length}\n`);

  if (wrong > 0) {
    console.log('💡  Para actualizar las columnas ejecuta:  npm run sync:manual\n');
  }
}

// ─── Mode B: vs live API ──────────────────────────────────────────────────

async function modeB(supabase: ReturnType<typeof createClient>) {
  console.log('🌐  MODO B — Supabase vs API Inmovilla en vivo\n');

  const { data: meta } = await supabase
    .from('property_metadata')
    .select('cod_ofer, ref, tipo, precio, poblacion, full_data');

  const { data: feats } = await supabase
    .from('property_features')
    .select('cod_ofer, superficie, habitaciones_simples, habitaciones_dobles, banos');

  const featMap = new Map((feats || []).map((f: any) => [Number(f.cod_ofer), f]));

  const PAGE = 50;
  const allInmo: any[] = [];
  let page = 0;

  while (true) {
    const pos = page * PAGE + 1;
    process.stdout.write(`\r📡  Obteniendo ${pos}–${pos + PAGE - 1}...`);
    const raw   = await callInmovilla('paginacion', pos, PAGE, '', 'cod_ofer');
    const props: any[] = raw?.anuncios || raw?.propiedades || raw?.paginacion || [];
    if (props.length === 0) break;
    allInmo.push(...props);
    if (props.length < PAGE) break;
    page++;
    await new Promise(r => setTimeout(r, 800));
  }
  console.log(`\n✅  API: ${allInmo.length} propiedades\n`);

  const inmoMap  = new Map(allInmo.map((p: any) => [Number(p.cod_ofer), p]));
  const metaSet  = new Set((meta || []).map((r: any) => Number(r.cod_ofer)));

  let perfect = 0, diffs = 0, onlyDB = 0, onlyAPI = 0;
  const lines: string[] = [];

  for (const row of (meta || []) as any[]) {
    const cod = Number(row.cod_ofer);
    const api = inmoMap.get(cod);
    const fd  = (row.full_data as any) || {};
    const f   = featMap.get(cod) as any;

    if (!api) {
      lines.push(`  ❓  COD ${cod} (${row.ref || fd.ref || '?'}) — en DB pero NO en API (eliminado?)`);
      onlyDB++;
      continue;
    }

    const priceDiff = Math.abs(n(api.precioinmo) - (n(row.precio) || n(fd.precioinmo)));
    const rowDiffs: string[] = [
      diffField('tipo',       api.tipo_nombre || '',  fd.tipo_nombre || row.tipo || ''),
      priceDiff > 0 ? `    ⚠  ${'precio'.padEnd(20)}  API: ${String(n(api.precioinmo)).padEnd(22)}  DB: ${n(row.precio) || n(fd.precioinmo)}${priceDiff > 5000 ? '  ⚡' : ''}` : null,
      diffField('poblacion',  api.poblacion || '',    row.poblacion || fd.poblacion || ''),
      diffField('superficie', n(api.m_cons),          n(f?.superficie) || n(fd.m_cons)),
      diffField('hab_simples',n(api.habitaciones),    n(f?.habitaciones_simples)),
      diffField('hab_dobles', n(api.habdobles),       n(f?.habitaciones_dobles)),
      diffField('banos',      n(api.banyos),          n(f?.banos) || n(fd.banyos)),
    ].filter(Boolean) as string[];

    if (rowDiffs.length === 0) { perfect++; }
    else {
      diffs++;
      lines.push(`\n  📋  COD ${cod}  REF: ${row.ref || fd.ref || '?'}`);
      rowDiffs.forEach(d => lines.push(d));
    }
  }

  for (const [cod] of inmoMap) {
    if (!metaSet.has(cod)) {
      lines.push(`  🆕  COD ${cod} — en API pero NO en DB (pendiente sync)`);
      onlyAPI++;
    }
  }

  if (lines.length) {
    console.log('─'.repeat(72));
    lines.forEach(l => console.log(l));
    console.log('\n' + '─'.repeat(72));
  }

  console.log('\n📊  RESUMEN\n');
  console.log(`  ✅  Sin diferencias:       ${perfect}`);
  console.log(`  ⚠   Con diferencias:        ${diffs}`);
  console.log(`  ❓  Solo en DB:             ${onlyDB}`);
  console.log(`  🆕  Solo en API:            ${onlyAPI}`);
  console.log(`  📦  Total DB / API:         ${(meta || []).length} / ${allInmo.length}\n`);

  if (diffs > 0 || onlyAPI > 0) console.log('💡  Ejecuta npm run sync:manual para actualizar\n');
}

// ─── Entry ────────────────────────────────────────────────────────────────────

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
  console.log('\n🔍  Auditoría Inmovilla\n' + '='.repeat(72) + '\n');

  if (LIVE_MODE) {
    if (!PROXY_URL || !PROXY_SECRET) {
      console.error('❌  --live requiere ARSYS_PROXY_URL y ARSYS_PROXY_SECRET en .env.local\n');
      process.exit(1);
    }
    await modeB(supabase);
  } else {
    await modeA(supabase);
  }
}

main().catch(e => { console.error('\n❌', e.message); process.exit(1); });

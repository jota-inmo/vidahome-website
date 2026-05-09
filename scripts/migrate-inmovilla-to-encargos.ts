/**
 * migrate-inmovilla-to-encargos.ts
 *
 * Importa propiedades de Inmovilla a la tabla `encargos` de Supabase.
 * Solo inserta propiedades que NO existen ya en encargos (compara por `ref`).
 *
 * Los detalles (tipo, precio, hab, baños) se obtienen de property_metadata
 * y property_features (ya sincronizadas en Supabase) sin llamadas extra a la API.
 *
 * Uso:
 *   npx tsx scripts/migrate-inmovilla-to-encargos.ts              # dry-run
 *   npx tsx scripts/migrate-inmovilla-to-encargos.ts --insert      # inserta en BD
 *   npx tsx scripts/migrate-inmovilla-to-encargos.ts --insert --with-owners
 *   npx tsx scripts/migrate-inmovilla-to-encargos.ts --insert --ref 2888
 *
 * Lee credenciales del .env del CRM (vida-home---encargo-de-gestión).
 */

import * as dotenv from "dotenv";
import * as path from "path";

const CRM_ENV = path.resolve(
  __dirname,
  "../../vida-home---encargo-de-gestión (1)/.env"
);
dotenv.config({ path: CRM_ENV, quiet: true } as any);

import { createClient } from "@supabase/supabase-js";

// ─── Config ───────────────────────────────────────────────────────────────────

const INMOVILLA_BASE = "https://procesos.inmovilla.com/api/v1";
const TOKEN = process.env.INMOVILLA_TOKEN;
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

const args = process.argv.slice(2);
const DRY_RUN    = !args.includes("--insert");
const WITH_OWNERS = args.includes("--with-owners");
const SINGLE_REF  = (() => { const i = args.indexOf("--ref"); return i !== -1 ? args[i + 1] : null; })();
const RATE_LIMIT_MS = 6500; // propiedades: 10/min

// ─── Inmovilla API ────────────────────────────────────────────────────────────

function inmoHeaders() {
  if (!TOKEN) throw new Error("INMOVILLA_TOKEN no definido");
  return { "Content-Type": "application/json", Token: TOKEN };
}

interface InmoProperty {
  cod_ofer: number | string;
  ref: string;
  keyacci?: number | string;
  tipo_nombre?: string;
  precioinmo?: number | string;
  precioalq?: number | string;
  habitaciones?: number | string;
  habdobles?: number | string;
  banyos?: number | string;
  calle?: string;
  poblacion?: string;
  nodisponible?: boolean | number | string;
  ascensor?: boolean | number | string;
  terraza?: boolean | number | string;
}

interface InmoPropietario {
  cod_cli?: string | number;
  nombre?: string;
  apellidos?: string;
  email?: string;
  telefono1?: string | number;
  telefono2?: string | number;
  movil?: string | number;
  nif?: string;
}

async function getListado(): Promise<InmoProperty[]> {
  const res = await fetch(`${INMOVILLA_BASE}/propiedades/?listado`, {
    headers: inmoHeaders(),
  });
  if (!res.ok) throw new Error(`Inmovilla listado ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return (Array.isArray(data) ? data : (data?.propiedades ?? [])) as InmoProperty[];
}

async function getPropietario(cod_ofer: number | string): Promise<InmoPropietario | null> {
  const res = await fetch(`${INMOVILLA_BASE}/propietarios/?cod_ofer=${cod_ofer}`, {
    headers: inmoHeaders(),
  });
  if (res.status === 404) return null;
  if (!res.ok) { console.warn(`  ⚠  propietarios ${cod_ofer} → ${res.status}`); return null; }
  const data = await res.json();
  return Array.isArray(data) ? (data[0] ?? null) : data;
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

// ─── Mapeo Inmovilla → encargos ───────────────────────────────────────────────

const TIPO_MAP: Record<string, string> = {
  "adosado": "Adosado", "bungalow": "Bungalow", "bungalow planta alta": "Bungalow",
  "bungalow planta baja": "Bungalow", "casa": "Casa", "casa de campo": "Casa",
  "chalet": "Chalet", "cortijo": "Casa", "hacienda": "Casa", "pareado": "Adosado",
  "despacho": "Local", "local comercial": "Local", "oficina": "Local",
  "almacén": "Local", "nave industrial": "Local", "nave logística": "Local",
  "garaje": "Garaje", "parking": "Garaje",
  "trastero": "Trastero",
  "apartamento": "Apartamento",
  "ático": "Ático", "ático dúplex": "Ático", "semiatico": "Ático",
  "dúplex": "Dúplex", "casa tipo dúplex": "Dúplex",
  "estudio": "Estudio", "buhardilla": "Estudio",
  "piso": "Piso", "planta baja": "Piso", "entresuelo": "Piso",
  "tríplex": "Dúplex",
  "finca rústica": "Finca", "finca mediterránea": "Finca",
  "solar": "Solar", "terreno": "Terreno", "terreno urbano": "Solar",
  "terreno rural": "Terreno", "terreno industrial": "Local",
  "terreno urbanizable": "Solar",
  "edificio": "Edificio",
  "villa": "Villa", "villa de lujo": "Villa",
};

function mapTipo(t?: string): string {
  if (!t) return "";
  return TIPO_MAP[t.trim().toLowerCase()] || t.trim();
}

function mapContractType(keyacci: any): string {
  return Number(keyacci) === 2 ? "alquiler" : "venta-sin-exclusiva";
}

function mapEstado(nodisponible: any): string {
  return (nodisponible === true || nodisponible === 1 || nodisponible === "1")
    ? "finalizado" : "pendiente";
}

function mapPrecio(prop: InmoProperty): string {
  const k = Number(prop.keyacci);
  const p = k === 2
    ? Number(prop.precioalq)
    : Number(prop.precioinmo);
  return p > 0 ? String(p) : "";
}

function buildEncargoRow(prop: InmoProperty, propietario: InmoPropietario | null) {
  const hab = (Number(prop.habitaciones) || 0) + (Number(prop.habdobles) || 0);
  const dir = [prop.calle, prop.poblacion].filter(Boolean).join(", ");
  const row: Record<string, any> = {
    ref:              prop.ref,
    contractType:     mapContractType(prop.keyacci),
    fecha:            new Date().toISOString().split("T")[0],
    tipo_vivienda:    mapTipo(prop.tipo_nombre),
    precio:           mapPrecio(prop),
    num_habitaciones: hab > 0 ? String(hab) : "",
    num_banos:        String(Number(prop.banyos) || ""),
    dir,
    estado:           mapEstado(prop.nodisponible),
    categoria:        "normal",
    res_asc:          (prop.ascensor === true || prop.ascensor === 1 || prop.ascensor === "1") ? "Sí" : "No",
    res_ter:          (prop.terraza  === true || prop.terraza  === 1 || prop.terraza  === "1") ? "Sí" : "No",
    obs_otro:         `Importado desde Inmovilla. cod_ofer: ${prop.cod_ofer}`,
  };
  if (propietario) {
    const nombre = [propietario.nombre, propietario.apellidos].filter(Boolean).join(" ").trim();
    if (nombre) {
      row.owners = [{ nombre, telefono: String(propietario.movil || propietario.telefono1 || ""), email: propietario.email || "", dni: propietario.nif || "" }];
      row.owners_count = "1";
    }
  }
  return row;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!TOKEN) { console.error(`❌  INMOVILLA_TOKEN no encontrado en:\n    ${CRM_ENV}`); process.exit(1); }
  if (!SUPABASE_URL || !SUPABASE_KEY) { console.error(`❌  Faltan credenciales Supabase en:\n    ${CRM_ENV}`); process.exit(1); }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

  console.log("\n🏠  Migración Inmovilla → encargos");
  console.log("═".repeat(80));
  console.log(`  Modo:         ${DRY_RUN ? "DRY-RUN (solo muestra, sin escritura)" : "INSERT REAL"}`);
  console.log(`  Propietarios: ${WITH_OWNERS ? "Sí (llamadas API extra, lento)" : "No"}`);
  if (SINGLE_REF) console.log(`  Filtro ref:   ${SINGLE_REF}`);
  console.log("═".repeat(80) + "\n");

  // 1. Encargos existentes
  console.log("📋  Leyendo encargos existentes...");
  const { data: existingRows, error: encErr } = await supabase.from("encargos").select("ref");
  if (encErr) { console.error("❌", encErr.message); process.exit(1); }
  const existingRefs = new Set((existingRows || []).map((r: any) => (r.ref || "").trim().toUpperCase()));
  console.log(`  → ${existingRefs.size} encargos en BD`);

  // 2. Listado Inmovilla (ref + cod_ofer + nodisponible)
  console.log("📡  Consultando Inmovilla API...");
  let allProps: InmoProperty[];
  try { allProps = await getListado(); }
  catch (e: any) { console.error("❌  Inmovilla error:", e.message); process.exit(1); }
  console.log(`  → ${allProps.length} propiedades en Inmovilla`);

  // 3. Detalles desde property_metadata + property_features (ya en Supabase)
  console.log("🗄️   Leyendo property_metadata y property_features...");
  const { data: metaRows } = await supabase
    .from("property_metadata")
    .select("cod_ofer, ref, tipo, precio, poblacion, full_data, nodisponible");
  const { data: featRows } = await supabase
    .from("property_features")
    .select("cod_ofer, habitaciones, habitaciones_simples, habitaciones_dobles, banos, ascensor, terraza");

  const metaByRef = new Map<string, any>();
  const metaByCod = new Map<number, any>();
  for (const m of metaRows || []) {
    if (m.ref) metaByRef.set(m.ref.trim().toUpperCase(), m);
    if (m.cod_ofer) metaByCod.set(Number(m.cod_ofer), m);
  }
  const featByCod = new Map<number, any>();
  for (const f of featRows || []) { if (f.cod_ofer) featByCod.set(Number(f.cod_ofer), f); }
  console.log(`  → ${metaByRef.size} propiedades en property_metadata\n`);

  // 4. Filtrar las que no están en encargos
  let toProcess = allProps.filter((p) => p.ref && !existingRefs.has(p.ref.trim().toUpperCase()));
  if (SINGLE_REF) toProcess = toProcess.filter((p) => p.ref.trim().toUpperCase() === SINGLE_REF.trim().toUpperCase());

  const alreadyIn = allProps.length - toProcess.length;
  console.log(`  Total Inmovilla:          ${allProps.length}`);
  console.log(`  Ya en encargos (skip):    ${alreadyIn}`);
  console.log(`  Sin encargo (a importar): ${toProcess.length}\n`);

  if (toProcess.length === 0) { console.log("🎉  Nada nuevo que importar.\n"); return; }

  // 5. Enriquecer cada propiedad con datos de Supabase y mostrar tabla
  console.log(
    "  " + "REF".padEnd(14) + "TIPO".padEnd(18) + "PRECIO".padEnd(15) +
    "HAB".padEnd(5) + "BAÑ".padEnd(5) + "ESTADO".padEnd(12) + "EN WEB"
  );
  console.log("  " + "─".repeat(78));

  let inserted = 0, errors = 0;
  const errorLog: string[] = [];

  for (const prop of toProcess) {
    const normRef = prop.ref.trim().toUpperCase();
    const meta    = metaByRef.get(normRef) || metaByCod.get(Number(prop.cod_ofer));
    const feat    = meta ? featByCod.get(Number(meta.cod_ofer)) : null;
    const fd      = meta?.full_data || {};

    // Enriquecer prop con datos de Supabase
    if (meta) {
      prop.tipo_nombre  = meta.tipo || fd.tipo_nombre || "";
      prop.keyacci      = fd.keyacci ?? prop.keyacci;
      prop.precioinmo   = meta.precio || fd.precioinmo || "";
      prop.precioalq    = fd.precioalq || "";
      prop.nodisponible = meta.nodisponible ?? prop.nodisponible;
      prop.calle        = fd.calle || "";
      prop.poblacion    = meta.poblacion || fd.poblacion || "";
    }
    if (feat) {
      const hab = (Number(feat.habitaciones_simples) || 0) + (Number(feat.habitaciones_dobles) || 0);
      prop.habitaciones = feat.habitaciones || hab || fd.habitaciones || "";
      prop.banyos       = feat.banos || fd.banyos || "";
      prop.ascensor     = feat.ascensor;
      prop.terraza      = feat.terraza;
    } else {
      prop.habitaciones = fd.habitaciones || "";
      prop.banyos       = fd.banyos || "";
    }

    const tipo   = mapTipo(prop.tipo_nombre) || prop.tipo_nombre || "—";
    const precio = mapPrecio(prop) ? `${Number(mapPrecio(prop)).toLocaleString("es-ES")} €` : "—";
    const hab    = prop.habitaciones ? String(prop.habitaciones) : "—";
    const ban    = prop.banyos ? String(prop.banyos) : "—";
    const estado = mapEstado(prop.nodisponible);
    const enWeb  = meta ? "✅" : "❌ sin sync";

    console.log(
      "  " + prop.ref.padEnd(14) + tipo.padEnd(18) + precio.padEnd(15) +
      hab.padEnd(5) + ban.padEnd(5) + estado.padEnd(12) + enWeb
    );

    if (DRY_RUN) continue;

    let propietario: InmoPropietario | null = null;
    if (WITH_OWNERS) { await sleep(RATE_LIMIT_MS); propietario = await getPropietario(prop.cod_ofer); }

    const row = buildEncargoRow(prop, propietario);
    const { error } = await supabase.from("encargos").insert([row]);
    if (error) { errors++; errorLog.push(`ref ${prop.ref}: ${error.message}`); }
    else inserted++;
    await sleep(100);
  }

  // 6. Resumen
  const pendientes   = toProcess.filter(p => mapEstado(p.nodisponible) === "pendiente").length;
  const finalizados  = toProcess.filter(p => mapEstado(p.nodisponible) === "finalizado").length;
  console.log("\n" + "═".repeat(80));
  console.log("  RESUMEN");
  console.log("═".repeat(80));
  console.log(`  Sin encargo total:       ${toProcess.length}`);
  console.log(`    · Activas (pendiente): ${pendientes}`);
  console.log(`    · Retiradas:           ${finalizados}`);

  if (DRY_RUN) {
    console.log(`\n  🔍  DRY-RUN — nada escrito.`);
    console.log(`  ▶   Importar todo:             npm run migrate:encargos:insert`);
    console.log(`  ▶   Importar con propietarios: npm run migrate:encargos:full\n`);
  } else {
    console.log(`\n  ✅  Insertados: ${inserted}`);
    console.log(`  ❌  Errores:    ${errors}`);
    if (errorLog.length) errorLog.forEach(e => console.log(`    · ${e}`));
    if (inserted > 0) console.log("\n  ℹ️   Rellena agente, honorarios y owners desde el CRM.\n");
  }
}

main().catch((e) => { console.error("\n❌", e.message); process.exit(1); });

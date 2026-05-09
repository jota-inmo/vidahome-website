/**
 * migrate-photos-to-fotos-inmuebles.ts
 *
 * Para cada propiedad en property_metadata que tenga fotos disponibles
 * (array `photos` o construidas desde full_data), inserta los registros
 * en la tabla `fotos_inmuebles` — siempre que exista un encargo con ese ref.
 *
 * Las URLs almacenadas son del CDN de Inmovilla (fotos15.inmovilla.com).
 * Más adelante el CRM puede procesarlas a Cloudinary desde su panel.
 *
 * Uso:
 *   npx tsx scripts/migrate-photos-to-fotos-inmuebles.ts              # dry-run
 *   npx tsx scripts/migrate-photos-to-fotos-inmuebles.ts --insert      # inserta en BD
 *   npx tsx scripts/migrate-photos-to-fotos-inmuebles.ts --insert --ref V260301
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
const FORCE      = args.includes("--force");   // borra fotos existentes y reprocesa
const SINGLE_REF = (() => { const i = args.indexOf("--ref"); return i !== -1 ? args[i + 1] : null; })();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Construye array de URLs desde full_data si photos[] está vacío */
function buildPhotosFromFullData(cod_ofer: number, full_data: any): string[] {
  const fd = full_data || {};
  const numFotos = parseInt(fd.numfotos) || 0;
  const numAgencia = fd.numagencia || "";
  const fotoLetra = fd.fotoletra || "";
  if (numFotos === 0 || !numAgencia || !fotoLetra) return [];
  const urls: string[] = [];
  for (let i = 1; i <= numFotos; i++) {
    urls.push(`https://fotos15.inmovilla.com/${numAgencia}/${cod_ofer}/${fotoLetra}-${i}.jpg`);
  }
  return urls;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error(`❌  Faltan credenciales Supabase en:\n    ${CRM_ENV}`);
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });

  console.log("\n📷  Migración fotos Inmovilla → fotos_inmuebles");
  console.log("═".repeat(80));
  console.log(`  Fuente:  property_metadata (todos los registros con fotos)`);
  console.log(`  Destino: fotos_inmuebles (solo si existe encargo con ese ref)`);
  console.log(`  Modo:    ${DRY_RUN ? "DRY-RUN (solo muestra, sin escritura)" : "INSERT REAL"}${FORCE ? " + FORCE (borra existentes)" : ""}`);
  if (SINGLE_REF) console.log(`  Filtro ref: ${SINGLE_REF}`);
  console.log("═".repeat(80) + "\n");

  // 1. Todos los refs que existen en encargos
  console.log("📋  Leyendo encargos existentes...");
  const { data: encargos, error: encErr } = await supabase
    .from("encargos")
    .select("ref");
  if (encErr) { console.error("❌", encErr.message); process.exit(1); }
  const encargoRefs = new Set((encargos || []).map((e: any) => (e.ref || "").trim().toUpperCase()));
  console.log(`  → ${encargoRefs.size} encargos en BD\n`);

  // 2. Refs que ya tienen fotos en fotos_inmuebles
  console.log("🔍  Comprobando fotos_inmuebles existentes...");
  const { data: existingFotos } = await supabase
    .from("fotos_inmuebles")
    .select("ref");
  const refsConFotos = new Set((existingFotos || []).map((f: any) => (f.ref || "").trim().toUpperCase()));
  console.log(`  → ${refsConFotos.size} refs ya tienen fotos\n`);

  // 3. Cargar property_metadata (fuente de las fotos)
  console.log("🗄️   Cargando property_metadata...");
  let metaQuery = supabase
    .from("property_metadata")
    .select("cod_ofer, ref, photos, full_data");
  if (SINGLE_REF) metaQuery = metaQuery.eq("ref", SINGLE_REF.trim().toUpperCase());

  const { data: metaRows, error: metaErr } = await metaQuery;
  if (metaErr) { console.error("❌", metaErr.message); process.exit(1); }
  console.log(`  → ${metaRows?.length ?? 0} propiedades en property_metadata\n`);

  // 4. Procesar cada propiedad de property_metadata
  console.log(
    "  " + "REF".padEnd(16) + "COD_OFER".padEnd(12) + "FOTOS".padEnd(8) + "ESTADO"
  );
  console.log("  " + "─".repeat(68));

  let inserted = 0, skipped = 0, sinEncargo = 0, sinFotos = 0, errors = 0;
  const errorLog: string[] = [];
  const now = new Date().toISOString();

  for (const meta of metaRows || []) {
    const normRef = (meta.ref || "").trim().toUpperCase();
    const cod = Number(meta.cod_ofer);

    // ¿Existe encargo con este ref?
    if (!encargoRefs.has(normRef)) {
      console.log("  " + (normRef || "—").padEnd(16) + String(cod || "—").padEnd(12) + "—".padEnd(8) + "⏭  sin encargo (solo web)");
      sinEncargo++;
      continue;
    }

    // ¿Ya tiene fotos?
    if (refsConFotos.has(normRef)) {
      if (!FORCE) {
        console.log("  " + normRef.padEnd(16) + String(cod).padEnd(12) + "—".padEnd(8) + "✅ ya tiene fotos (skip)");
        skipped++;
        continue;
      }
      // --force: borrar existentes y reinsertar
      if (!DRY_RUN) {
        await supabase.from("fotos_inmuebles").delete().eq("ref", meta.ref);
      }
      console.log("  " + normRef.padEnd(16) + String(cod).padEnd(12) + "—".padEnd(8) + "🗑  fotos previas borradas (--force)");
    }

    // Obtener URLs
    const photoUrls: string[] = Array.isArray(meta.photos) && meta.photos.length > 0
      ? meta.photos
      : buildPhotosFromFullData(cod, meta.full_data);

    if (photoUrls.length === 0) {
      console.log("  " + normRef.padEnd(16) + String(cod).padEnd(12) + "0".padEnd(8) + "⚠️  sin fotos disponibles");
      sinFotos++;
      continue;
    }

    console.log(
      "  " + normRef.padEnd(16) + String(cod).padEnd(12) +
      String(photoUrls.length).padEnd(8) + (DRY_RUN ? "🔍 dry-run" : "⬆️  insertando...")
    );

    if (DRY_RUN) continue;

    // Insertar batch en fotos_inmuebles
    const rows = photoUrls.map((url, idx) => ({
      ref:            meta.ref,          // ref original (case sensitivo)
      url_cloudinary: url,               // URL Inmovilla CDN — temporal hasta Cloudinary
      orden:          idx + 1,
      procesada_en:   now,
      visible:        true,
    }));

    const { error } = await supabase
      .from("fotos_inmuebles")
      .insert(rows);

    if (error) {
      errors++;
      errorLog.push(`ref ${meta.ref}: ${error.message}`);
      console.log("    ❌ " + error.message);
    } else {
      inserted += photoUrls.length;
    }
  }

  // 5. Resumen
  console.log("\n" + "═".repeat(80));
  console.log("  RESUMEN");
  console.log("═".repeat(80));
  console.log(`  Propiedades en property_metadata: ${metaRows?.length ?? 0}`);
  console.log(`  Sin encargo (solo web):           ${sinEncargo}`);
  console.log(`  Ya tenían fotos (skip):           ${skipped}`);
  console.log(`  Sin fotos disponibles:            ${sinFotos}`);

  if (DRY_RUN) {
    const pendientes = (metaRows?.length ?? 0) - sinEncargo - skipped - sinFotos;
    console.log(`\n  🔍  DRY-RUN — nada escrito.`);
    console.log(`  ▶   Propiedades a migrar: ${pendientes}`);
    console.log(`  ▶   Ejecutar inserción:   npm run migrate:fotos:insert\n`);
  } else {
    console.log(`\n  ✅  Filas insertadas: ${inserted}`);
    console.log(`  ❌  Errores:         ${errors}`);
    if (errorLog.length) errorLog.forEach((e) => console.log(`    · ${e}`));
    if (inserted > 0) {
      console.log("\n  ℹ️   Las URLs son del CDN de Inmovilla (fotos15.inmovilla.com).");
      console.log("  ℹ️   Para migrar a Cloudinary usa el panel del CRM → procesar fotos.\n");
    }
  }
}

main().catch((e) => { console.error("\n❌", e.message); process.exit(1); });

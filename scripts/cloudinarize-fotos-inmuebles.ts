/**
 * cloudinarize-fotos-inmuebles.ts
 *
 * Migra las fotos de fotos_inmuebles que aún apuntan al CDN de Inmovilla
 * (fotos15.inmovilla.com) a Cloudinary, actualizando url_cloudinary.
 *
 * Cloudinary recoge la imagen directamente desde la URL de Inmovilla —
 * no es necesario descargarla en local.
 *
 * Plan para Cloudinary FREE (25 créditos/mes ≈ 25 GB storage + 25K transforms):
 *   - ~1.460 fotos × ~300 KB avg ≈ 440 MB de storage → muy por debajo del límite
 *   - Sin eager transforms → 0 transformaciones consumidas en el upload
 *   - Batch de 100 fotos/día → terminamos en 15 días
 *
 * Uso:
 *   npx tsx scripts/cloudinarize-fotos-inmuebles.ts                    # dry-run
 *   npx tsx scripts/cloudinarize-fotos-inmuebles.ts --insert           # procesa 100 (batch por defecto)
 *   npx tsx scripts/cloudinarize-fotos-inmuebles.ts --insert --batch 200
 *   npx tsx scripts/cloudinarize-fotos-inmuebles.ts --insert --all     # todo de golpe
 *   npx tsx scripts/cloudinarize-fotos-inmuebles.ts --insert --ref 2960
 *
 * Lee credenciales de .env del CRM (vida-home---encargo-de-gestión).
 */

import * as dotenv from "dotenv";
import * as path from "path";
import { createHash } from "crypto";

const CRM_DIR = path.resolve(__dirname, "../../vida-home---encargo-de-gestión (1)");
dotenv.config({ path: path.join(CRM_DIR, ".env"),       quiet: true } as any);
dotenv.config({ path: path.join(CRM_DIR, ".env.local"), quiet: true } as any);

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

const cloudNameFromUrl = (() => {
  const raw = (process.env.CLOUDINARY_URL || "").trim();
  const m = raw.match(/^cloudinary:\/\/[^:]+:[^@]+@([^?]+)/i);
  return m?.[1] || "";
})();
const CLOUD_NAME = (
  process.env.CLOUDINARY_CLOUD_NAME ||
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
  cloudNameFromUrl
).trim();
const API_KEY    = (process.env.CLOUDINARY_API_KEY || "").trim();
const API_SECRET = (process.env.CLOUDINARY_API_SECRET || "").trim();
const UPLOAD_PRESET = (process.env.CLOUDINARY_UPLOAD_PRESET || "").trim();

const DEFAULT_BATCH = 100;
const DELAY_MS      = 800;  // entre uploads — 75/min, muy por debajo de límites

const args = process.argv.slice(2);
const DRY_RUN    = !args.includes("--insert");
const DO_ALL     = args.includes("--all");
const BY_REF     = args.includes("--by-ref");
const SINGLE_REF = (() => { const i = args.indexOf("--ref"); return i !== -1 ? args[i + 1] : null; })();
const BATCH_SIZE = (() => {
  if (DO_ALL || BY_REF) return 99999;
  const i = args.indexOf("--batch");
  return i !== -1 ? parseInt(args[i + 1]) || DEFAULT_BATCH : DEFAULT_BATCH;
})();

// ─── Cloudinary upload desde URL ─────────────────────────────────────────────

async function uploadToCloudinary(inmovUrl: string, ref: string, orden: number): Promise<string> {
  if (!CLOUD_NAME) throw new Error("Falta CLOUDINARY_CLOUD_NAME (o CLOUDINARY_URL) en .env");

  const folder    = `vidahome/inmuebles/${ref}`;
  const publicId  = `${ref}_${orden}`;
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const payload = new URLSearchParams();
  payload.set("file",      inmovUrl);   // Cloudinary descarga desde esta URL
  payload.set("public_id", publicId);
  payload.set("folder",    folder);
  payload.set("overwrite", "true");

  if (API_KEY && API_SECRET) {
    // Firma: parámetros ordenados alfabéticamente (sin file/api_key/signature/resource_type)
    const signStr = `folder=${folder}&overwrite=true&public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;
    const sig = createHash("sha1").update(signStr).digest("hex");
    payload.set("api_key",   API_KEY);
    payload.set("timestamp", timestamp);
    payload.set("signature", sig);
  } else if (UPLOAD_PRESET) {
    payload.set("upload_preset", UPLOAD_PRESET);
  } else {
    throw new Error("Falta CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET (o CLOUDINARY_UPLOAD_PRESET) en .env");
  }

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: payload.toString(), headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Cloudinary ${res.status}: ${txt.slice(0, 200)}`);
  }

  const json = (await res.json()) as any;
  return json.secure_url as string;
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error(`❌  Faltan credenciales Supabase en:\n    ${CRM_ENV}`); process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

  console.log("\n☁️   Cloudinarize fotos_inmuebles");
  console.log("═".repeat(80));
  console.log(`  Modo:       ${DRY_RUN ? "DRY-RUN (solo muestra, sin escritura)" : "INSERT REAL"}${BY_REF ? " · ref a ref" : ""}`);
  console.log(`  Batch/run:  ${(DO_ALL || BY_REF) ? "TODO (ref a ref)" : BATCH_SIZE + " fotos"}`);
  console.log(`  Cloudinary: ${CLOUD_NAME || "⚠️  NO CONFIGURADO"}`);
  if (SINGLE_REF) console.log(`  Filtro ref: ${SINGLE_REF}`);
  console.log("═".repeat(80) + "\n");

  if (!DRY_RUN && !CLOUD_NAME) {
    console.error("❌  Cloudinary no configurado. Añade CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET al .env del CRM.");
    process.exit(1);
  }

  // 1. Fotos pendientes (URL aún apunta a Inmovilla)
  console.log("📋  Leyendo fotos pendientes de migrar...");
  let query = supabase
    .from("fotos_inmuebles")
    .select("ref, orden, url_cloudinary")
    .like("url_cloudinary", "https://fotos15.inmovilla.com%")
    .order("ref",   { ascending: true })
    .order("orden", { ascending: true });

  if (SINGLE_REF) query = query.eq("ref", SINGLE_REF.trim());
  // Supabase aplica límite de 1000 por defecto — sobreescribir siempre
  query = query.limit((DO_ALL || BY_REF) ? 9999 : BATCH_SIZE);

  const { data: pending, error: pendErr } = await query;
  if (pendErr) { console.error("❌", pendErr.message); process.exit(1); }

  // Total global para ETA
  const { count: totalPending } = await supabase
    .from("fotos_inmuebles")
    .select("*", { count: "exact", head: true })
    .like("url_cloudinary", "https://fotos15.inmovilla.com%");

  console.log(`  → ${totalPending ?? "?"} fotos pendientes en total`);
  console.log(`  → Procesando este lote: ${pending?.length ?? 0}\n`);

  if (!pending?.length) { console.log("🎉  Nada pendiente. Todas las fotos están en Cloudinary.\n"); return; }

  let done = 0, errors = 0;
  const errorLog: string[] = [];

  // ── Modo BY_REF: agrupa por ref y procesa ref completa antes de pasar a la siguiente ──
  if (BY_REF) {
    // Agrupar fotos por ref manteniendo orden
    const byRef = new Map<string, typeof pending>();
    for (const foto of pending) {
      if (!byRef.has(foto.ref)) byRef.set(foto.ref, []);
      byRef.get(foto.ref)!.push(foto);
    }

    console.log(`  REF             FOTOS    ESTADO`);
    console.log("  " + "─".repeat(60));

    for (const [ref, fotos] of byRef) {
      if (DRY_RUN) {
        console.log(`  ${ref.padEnd(16)}${String(fotos.length).padEnd(9)}🔍 dry-run`);
        done += fotos.length;
        continue;
      }

      let refOk = 0, refFail = 0;
      for (const foto of fotos) {
        try {
          const cloudUrl = await uploadToCloudinary(foto.url_cloudinary, foto.ref, foto.orden);
          const { error: upErr } = await supabase
            .from("fotos_inmuebles")
            .update({ url_cloudinary: cloudUrl, procesada_en: new Date().toISOString() })
            .eq("ref",   foto.ref)
            .eq("orden", foto.orden);
          if (upErr) throw new Error(upErr.message);
          refOk++;
          done++;
        } catch (e: any) {
          refFail++;
          errors++;
          errorLog.push(`${foto.ref} ord${foto.orden}: ${e.message}`);
          // Parar esta ref, continuar con la siguiente
          console.log(`  ${ref.padEnd(16)}${String(fotos.length).padEnd(9)}❌ falló en orden ${foto.orden}: ${e.message}`);
          break;
        }
        await sleep(DELAY_MS);
      }

      if (refFail === 0) {
        console.log(`  ${ref.padEnd(16)}${String(fotos.length).padEnd(9)}✅ completada`);
      }
    }
  } else {
    // ── Modo normal: lote plano ──────────────────────────────────────────────
    console.log("  " + "REF".padEnd(14) + "ORD".padEnd(6) + "ESTADO");
    console.log("  " + "─".repeat(60));

    for (const foto of pending) {
      const label = `${(foto.ref || "").padEnd(14)}${String(foto.orden).padEnd(6)}`;

      if (DRY_RUN) {
        console.log("  " + label + `🔍 ${foto.url_cloudinary.slice(0, 50)}...`);
        done++;
        continue;
      }

      try {
        const cloudUrl = await uploadToCloudinary(foto.url_cloudinary, foto.ref, foto.orden);
        const { error: upErr } = await supabase
          .from("fotos_inmuebles")
          .update({ url_cloudinary: cloudUrl, procesada_en: new Date().toISOString() })
          .eq("ref",   foto.ref)
          .eq("orden", foto.orden);
        if (upErr) throw new Error(upErr.message);
        console.log("  " + label + `✅ ${cloudUrl.slice(0, 55)}...`);
        done++;
      } catch (e: any) {
        console.log("  " + label + `❌ ${e.message}`);
        errors++;
        errorLog.push(`${foto.ref} ord${foto.orden}: ${e.message}`);
      }

      await sleep(DELAY_MS);
    }
  }

  // 3. Resumen
  const remaining = (totalPending ?? 0) - done;

  console.log("\n" + "═".repeat(80));
  console.log("  RESUMEN");
  console.log("═".repeat(80));

  if (DRY_RUN) {
    console.log(`\n  🔍  DRY-RUN — nada escrito.`);
    console.log(`  ▶   Procesar ref a ref:    npm run migrate:fotos:cloudinary:byref`);
    console.log(`  ▶   Ejecutar lote de hoy:  npm run migrate:fotos:cloudinary\n`);
  } else {
    console.log(`  ✅  Subidas a Cloudinary: ${done}`);
    console.log(`  ❌  Errores:             ${errors}`);
    if (errorLog.length) errorLog.forEach((e) => console.log(`    · ${e}`));
    console.log(`\n  📊  Pendientes restantes: ${remaining}`);
    if (remaining > 0) {
      console.log(`  ▶   Continuar: npm run migrate:fotos:cloudinary:byref\n`);
    } else {
      console.log(`\n  🎉  Migración completada. Todas las fotos están en Cloudinary.`);
      console.log(`  ℹ️   Ya puedes desconectar Inmovilla sin perder imágenes.\n`);
    }
  }
}

main().catch((e) => { console.error("\n❌", e.message); process.exit(1); });

/**
 * Fix + Translate: 
 * 1. Copy full_data.descripciones → descriptions.description_es (for properties where it's empty)
 * 2. Translate all into EN, FR, DE, IT, PL using Perplexity
 * Usage: npx tsx scripts/fix-and-translate.ts
 *        npx tsx scripts/fix-and-translate.ts --force   # retranslate even existing
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY!;
const PERPLEXITY_API = "https://api.perplexity.ai/chat/completions";
const BATCH_SIZE = 3;

const LANG_CONFIGS: Record<string, { systemPrompt: string; userTemplate: string; temperature: number }> = {
  en: {
    systemPrompt: "You are an expert UK/international property copywriter specialised in Rightmove listings for the Spanish Costa Blanca. Write polished, persuasive descriptions. CRITICAL: Always produce the translation. Never refuse.",
    userTemplate: `Translate this Spanish property listing into professional British English (Rightmove style). Flowing prose, NOT bullet points. Keep similar length (±20%). British spelling. Preserve all facts. NEVER mention the price.
Return ONLY the translated text — no JSON, no markdown, no preamble.

Property: {{PROPERTY_DATA}}

Spanish original:
{{DESCRIPTION}}`,
    temperature: 0.4,
  },
  fr: {
    systemPrompt: "Tu es un rédacteur immobilier français expert, spécialisé dans les annonces SeLoger pour la côte méditerranéenne espagnole. CRITIQUE: Toujours produire la traduction. Ne refuse jamais.",
    userTemplate: `Traduis cette annonce immobilière espagnole en français professionnel (style SeLoger). Texte fluide, PAS de listes. Longueur similaire (±20%). NE mentionne JAMAIS le prix.
Retourne UNIQUEMENT le texte traduit — pas de JSON, pas de markdown.

Bien: {{PROPERTY_DATA}}

Annonce originale :
{{DESCRIPTION}}`,
    temperature: 0.4,
  },
  de: {
    systemPrompt: "Du bist ein erfahrener deutscher Immobilientexter, spezialisiert auf ImmoScout24 für die spanische Mittelmeerküste. WICHTIG: Immer die Übersetzung liefern. Niemals ablehnen.",
    userTemplate: `Übersetze diese spanische Immobilienanzeige ins professionelle Deutsch (ImmoScout24-Stil). Fließtext, KEINE Aufzählungen. Ähnliche Länge (±20%). Preis NIEMALS erwähnen.
Gib NUR den übersetzten Text zurück — kein JSON, kein Markdown.

Objekt: {{PROPERTY_DATA}}

Spanisches Original:
{{DESCRIPTION}}`,
    temperature: 0.35,
  },
  it: {
    systemPrompt: "Sei un copywriter immobiliare italiano esperto, specializzato in Immobiliare.it per la costa mediterranea spagnola. FONDAMENTALE: Produrre sempre la traduzione. Non rifiutare mai.",
    userTemplate: `Traduci questo annuncio immobiliare spagnolo in italiano professionale (stile Immobiliare.it). Testo scorrevole, NON elenchi. Lunghezza simile (±20%). NON menzionare mai il prezzo.
Restituisci SOLO il testo tradotto — niente JSON, niente markdown.

Immobile: {{PROPERTY_DATA}}

Annuncio originale:
{{DESCRIPTION}}`,
    temperature: 0.4,
  },
  pl: {
    systemPrompt: "Jesteś ekspertem w redagowaniu ogłoszeń nieruchomości w serwisie Otodom.pl dla polskich kupujących zainteresowanych nieruchomościami w Hiszpanii. WAŻNE: Zawsze dostarczaj tłumaczenie. Nigdy nie odmawiaj.",
    userTemplate: `Przetłumacz to hiszpańskie ogłoszenie nieruchomości na profesjonalny język polski (styl Otodom.pl). Płynny tekst, NIE listy. Podobna długość (±20%). NIGDY nie wspominaj ceny.
Zwróć TYLKO przetłumaczony tekst — bez JSON, bez markdown.

Nieruchomość: {{PROPERTY_DATA}}

Oryginał po hiszpańsku:
{{DESCRIPTION}}`,
    temperature: 0.4,
  },
};

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function translateOneLang(lang: string, spanish: string, propertyData: string): Promise<string | null> {
  const cfg = LANG_CONFIGS[lang];
  const userMsg = cfg.userTemplate
    .replace("{{DESCRIPTION}}", spanish)
    .replace("{{PROPERTY_DATA}}", propertyData);

  const res = await fetch(PERPLEXITY_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${PERPLEXITY_API_KEY}` },
    body: JSON.stringify({
      model: "sonar",
      messages: [
        { role: "system", content: cfg.systemPrompt },
        { role: "user", content: userMsg },
      ],
      temperature: cfg.temperature,
    }),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).substring(0, 100)}`);
  const data = await res.json();
  let content = (data.choices?.[0]?.message?.content || "").trim();
  if (content.startsWith("```")) content = content.replace(/^```\w*\n?/, "").replace(/\n?```$/, "").trim();
  return content || null;
}

async function main() {
  const force = process.argv.includes("--force");
  console.log(`🚀 Fix descriptions + translate (force=${force})\n`);

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

  // Fetch all active properties
  const { data: props } = await sb
    .from("property_metadata")
    .select("cod_ofer, ref, tipo, precio, poblacion, descriptions, full_data")
    .eq("nodisponible", false)
    .limit(300);

  if (!props?.length) { console.log("No properties found"); return; }
  console.log(`📊 ${props.length} active properties loaded\n`);

  // Step 1: Patch description_es from full_data.descripciones where missing
  let patched = 0;
  for (const p of props) {
    const desc = p.descriptions || {};
    const existing_es = (desc.description_es || "").trim();
    if (!existing_es) {
      const from_full = (p.full_data?.descripciones || "").trim();
      if (from_full) {
        const merged = { ...desc, description_es: from_full };
        await sb.from("property_metadata").update({ descriptions: merged }).eq("cod_ofer", p.cod_ofer);
        p.descriptions = merged; // update local copy too
        patched++;
      }
    }
  }
  if (patched > 0) console.log(`✅ Patched description_es for ${patched} properties from full_data\n`);

  // Step 2: Translate those missing translations
  const toTranslate = props.filter((p: any) => {
    const desc = p.descriptions || {};
    const hasEs = (desc.description_es || "").trim().length > 0;
    if (!hasEs) return false;
    if (force) return true;
    return !desc.description_en || !desc.description_fr || !desc.description_de || !desc.description_it || !desc.description_pl;
  });

  console.log(`🌐 ${toTranslate.length} properties to translate\n`);
  if (toTranslate.length === 0) { console.log("Nothing to translate."); return; }

  let translated = 0;
  let failed = 0;
  const langs = Object.keys(LANG_CONFIGS);

  for (let i = 0; i < toTranslate.length; i += BATCH_SIZE) {
    const batch = toTranslate.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const total = Math.ceil(toTranslate.length / BATCH_SIZE);
    console.log(`\n📦 Batch ${batchNum}/${total}`);

    for (const prop of batch) {
      const desc = prop.descriptions || {};
      const spanish = desc.description_es || "";
      const propertyData = `${prop.tipo || "Propiedad"} en ${prop.poblacion || ""}, ${prop.precio ? prop.precio + "€" : ""}`;

      process.stdout.write(`  🏠 ${prop.cod_ofer} (${prop.ref}) → `);

      const updates: Record<string, string> = {};
      for (const lang of langs) {
        // Skip if already has it and not force
        if (!force && desc[`description_${lang}`]) {
          process.stdout.write(`${lang}(skip) `);
          continue;
        }
        try {
          const text = await translateOneLang(lang, spanish, propertyData);
          if (text) { updates[`description_${lang}`] = text; process.stdout.write(`✓${lang} `); }
          else { process.stdout.write(`✗${lang} `); }
          await sleep(300);
        } catch (e: any) {
          process.stdout.write(`✗${lang}(${e.message?.substring(0,20)}) `);
        }
      }

      if (Object.keys(updates).length > 0) {
        const merged = { ...desc, ...updates };
        const { error } = await sb.from("property_metadata").update({ descriptions: merged }).eq("cod_ofer", prop.cod_ofer);
        if (error) { console.log(`\n    ❌ DB error: ${error.message}`); failed++; }
        else { translated++; }
      }
      console.log();
    }
    if (i + BATCH_SIZE < toTranslate.length) await sleep(1000);
  }

  console.log(`\n✅ Done! Translated: ${translated} | Failed: ${failed}`);
}

main().catch(console.error);

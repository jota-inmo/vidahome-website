import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY!;
const PERPLEXITY_API = "https://api.perplexity.ai/chat/completions";
const BATCH_SIZE = 3; // Smaller batches — each property now makes 5 API calls

// Multilingual footer
const MULTILINGUAL_FOOTER = "\n\nNous parlons français. We speak English. Mówimy po polsku. Parliamo italiano.";

console.log(`✓ Supabase configured`);
if (!PERPLEXITY_API_KEY) {
  console.error("❌ PERPLEXITY_API_KEY not found in environment");
  process.exit(1);
}
console.log(`✓ Perplexity API key loaded (${PERPLEXITY_API_KEY.substring(0, 10)}...)`);

// ---------------------------------------------------------------------------
// Per-language prompt configs (mirrors src/config/translation-prompts.ts)
// Duplicated here because this script runs via tsx, not Next.js
// ---------------------------------------------------------------------------

interface LangConfig {
  code: string;
  portal: string;
  systemPrompt: string;
  /** Use {{DESCRIPTION}} and {{PROPERTY_DATA}} as placeholders */
  userPromptTemplate: string;
  temperature: number;
}

const LANG_CONFIGS: Record<string, LangConfig> = {
  en: {
    code: "en",
    portal: "Rightmove",
    systemPrompt: "You are an expert UK/international property copywriter specialised in Rightmove and Zoopla listings for the Spanish Costa Blanca and inland Valencia markets. You write polished, persuasive descriptions that appeal to British and international buyers.",
    userPromptTemplate: `Translate the following Spanish property listing into professional British English, following Rightmove best practices:

- Opening hook highlighting the headline feature
- Property overview with key facts woven naturally
- Interior description room-by-room
- Exterior & extras (terrace, pool, garage, energy rating)
- Location selling points (beaches, golf, airport, lifestyle)
- Closing call to action mentioning Vidahome

RULES: Flowing prose, NOT bullet points. Keep similar length (±20%). British spelling. Preserve all facts exactly. NEVER mention the price in the text — it is shown separately and may change. Sound like an experienced estate agent.
Return ONLY the translated text — no JSON, no markdown, no preamble.

{{PROPERTY_DATA}}

Spanish original:
{{DESCRIPTION}}`,
    temperature: 0.4,
  },

  fr: {
    code: "fr",
    portal: "SeLoger",
    systemPrompt: "Tu es un rédacteur immobilier français expert, spécialisé dans les annonces SeLoger et Green-Acres pour les biens de prestige sur la côte méditerranéenne espagnole.",
    userPromptTemplate: `Traduis cette annonce immobilière espagnole en français professionnel, style SeLoger / Green-Acres :

- Accroche avec le point fort principal
- Présentation générale (type, surface, chambres, état)
- Intérieur détaillé (séjour, cuisine, chambres, SdB)
- Extérieur et prestations (terrasse, piscine, garage)
- Atouts de la localisation (plages, golf, aéroport)
- Appel à l'action mentionnant Vidahome

RÈGLES : Texte fluide et élégant, PAS de listes. Longueur similaire (±20%). Préserver tous les faits. NE mentionne JAMAIS le prix dans le texte. Ton raffiné.
Retourne UNIQUEMENT le texte traduit — pas de JSON, pas de markdown.

{{PROPERTY_DATA}}

Annonce originale :
{{DESCRIPTION}}`,
    temperature: 0.4,
  },

  de: {
    code: "de",
    portal: "ImmoScout24",
    systemPrompt: "Du bist ein erfahrener deutscher Immobilientexter, spezialisiert auf ImmoScout24- und Immowelt-Anzeigen für hochwertige Immobilien an der spanischen Mittelmeerküste.",
    userPromptTemplate: `Übersetze diese spanische Immobilienanzeige ins professionelle Deutsch (ImmoScout24-Stil):

- Einleitung mit Hauptvorteil
- Objektübersicht (Typ, Fläche, Zimmer, Zustand)
- Innenausstattung detailliert
- Außenbereich & Ausstattung
- Lage & Infrastruktur
- Einladung zur Besichtigung, Vidahome erwähnen

REGELN: Fließtext, KEINE Aufzählungen. Ähnliche Länge (±20%). Alle Fakten exakt. Den Preis NIEMALS im Text erwähnen. Sachlicher, seriöser Ton.
Gib NUR den übersetzten Text zurück — kein JSON, kein Markdown.

{{PROPERTY_DATA}}

Spanisches Original:
{{DESCRIPTION}}`,
    temperature: 0.35,
  },

  it: {
    code: "it",
    portal: "Immobiliare.it",
    systemPrompt: "Sei un copywriter immobiliare italiano esperto, specializzato in annunci Immobiliare.it per immobili di pregio sulla costa mediterranea spagnola.",
    userPromptTemplate: `Traduci questo annuncio immobiliare spagnolo in italiano professionale (stile Immobiliare.it):

- Apertura con il punto di forza principale
- Panoramica (tipologia, superficie, camere, stato)
- Interni dettagliati
- Esterni e dotazioni
- Posizione e lifestyle mediterraneo
- Invito alla visita, menzionare Vidahome

REGOLE: Testo scorrevole, NON elenchi. Lunghezza simile (±20%). Dati esatti. NON menzionare MAI il prezzo nel testo. Tono professionale e coinvolgente.
Restituisci SOLO il testo tradotto — niente JSON, niente markdown.

{{PROPERTY_DATA}}

Annuncio originale:
{{DESCRIPTION}}`,
    temperature: 0.4,
  },

  pl: {
    code: "pl",
    portal: "Otodom.pl",
    systemPrompt: "Jesteś ekspertem w redagowaniu ogłoszeń nieruchomości w Polsce, specjalizującym się w serwisie Otodom.pl. Tłumaczysz ogłoszenia domów z hiszpańskiego na polski, zachowując profesjonalny, uporządkowany i przekonujący styl typowy dla Otodom.",
    userPromptTemplate: `Eres un experto redactor inmobiliario polaco especializado en Otodom.pl. Traduce este anuncio de casa desde español a polaco manteniendo un estilo profesional, estructurado y persuasivo típico de Otodom:

1. Título corto y atractivo (máx. 50 caracteres)
2. Introducción breve con datos clave
3. Descripción del interior (distribución, estado, iluminación)
4. Atributos de la ubicación
5. Extras y servicios (garaje, jardín, eficiencia energética)
6. Información práctica
7. Llamada a acción mencionando Vidahome

REGLAS: Texto fluido y persuasivo, NO como lista con headers visibles. Longitud similar (±20%). Lenguaje positivo, concreto. Datos exactos. NUNCA menciones el precio en el texto — se muestra aparte.
Devuelve SOLO el texto traducido — sin JSON, sin markdown.

{{PROPERTY_DATA}}

Anuncio original:
{{DESCRIPTION}}`,
    temperature: 0.4,
  },
};

// ---------------------------------------------------------------------------

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function translateOneLang(
  lang: string,
  spanishText: string,
  propertyData: string
): Promise<{ text: string | null; tokens: number }> {
  const cfg = LANG_CONFIGS[lang];
  if (!cfg) return { text: null, tokens: 0 };

  const userMessage = cfg.userPromptTemplate
    .replace("{{DESCRIPTION}}", spanishText)
    .replace("{{PROPERTY_DATA}}", propertyData);

  const response = await fetch(PERPLEXITY_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [
        { role: "system", content: cfg.systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: cfg.temperature,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API ${response.status}: ${err.substring(0, 150)}`);
  }

  const data = await response.json();
  const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0 };
  let content = (data.choices?.[0]?.message?.content || "").trim();

  // Strip markdown wrappers
  if (content.startsWith("```")) {
    content = content.replace(/^```\w*\n?/, "").replace(/\n?```$/, "").trim();
  }

  return { text: content || null, tokens: usage.prompt_tokens + usage.completion_tokens };
}

async function translateProperties() {
  console.log("🚀 Starting Per-Language Translation with Perplexity...\n");

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  // Fetch properties needing translation
  const { data: allProps } = await supabase
    .from("property_metadata")
    .select("cod_ofer, ref, tipo, precio, poblacion, descriptions")
    .not("descriptions", "is", null)
    .limit(100);

  if (!allProps) {
    console.log("No properties found");
    return;
  }

  // Filter those needing translation
  const needsTranslation = allProps.filter((p: any) => {
    const desc = p.descriptions || {};
    const hasEs = desc.description_es || desc.descripciones;
    const needsLang = !desc.description_en || !desc.description_fr || !desc.description_de;
    return hasEs && needsLang;
  });

  console.log(`📊 Found ${needsTranslation.length} properties needing translation\n`);

  // Fetch features for context
  const codOfers = needsTranslation.map((p: any) => p.cod_ofer);
  const { data: features } = await supabase
    .from("property_features")
    .select("cod_ofer, superficie, habitaciones, banos")
    .in("cod_ofer", codOfers);

  const featMap: Record<number, any> = {};
  for (const f of features || []) featMap[f.cod_ofer] = f;

  // Process in batches
  let translated = 0;
  let failed = 0;
  const langs = Object.keys(LANG_CONFIGS);

  for (let i = 0; i < needsTranslation.length; i += BATCH_SIZE) {
    const batch = needsTranslation.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(needsTranslation.length / BATCH_SIZE);

    console.log(`\n📦 Batch ${batchNum}/${totalBatches} (${batch.length} properties)...`);

    for (const prop of batch) {
      const desc = prop.descriptions || {};
      const spanish = (desc.description_es || desc.descripciones || "").substring(0, 600);
      if (!spanish) { failed++; continue; }

      const feat = featMap[prop.cod_ofer] || {};
      const dataParts: string[] = [];
      if (prop.ref) dataParts.push(`Ref: ${prop.ref}`);
      if (prop.tipo) dataParts.push(`Tipo: ${prop.tipo}`);
      // Price intentionally excluded — displayed separately on the listing page
      if (feat.superficie) dataParts.push(`Superficie: ${feat.superficie}m²`);
      if (feat.habitaciones) dataParts.push(`Hab: ${feat.habitaciones}`);
      if (feat.banos) dataParts.push(`Baños: ${feat.banos}`);
      if (prop.poblacion) dataParts.push(`Ubicación: ${prop.poblacion}`);
      const propertyData = dataParts.length > 0 ? `\nDatos: ${dataParts.join(" | ")}\n` : "";

      console.log(`  🏠 ${prop.cod_ofer} (${prop.ref || "?"}) →`, langs.join(", "));

      const newDesc: Record<string, string> = {};

      for (const lang of langs) {
        try {
          const { text } = await translateOneLang(lang, spanish, propertyData);
          if (text) {
            newDesc[`description_${lang}`] = text + MULTILINGUAL_FOOTER;
            process.stdout.write(`    ✓ ${lang}`);
          } else {
            process.stdout.write(`    ✗ ${lang}`);
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          process.stdout.write(`    ✗ ${lang}(${msg.substring(0, 40)})`);
        }
        // Small delay between languages to respect rate limits
        await sleep(800);
      }
      console.log();

      if (Object.keys(newDesc).length > 0) {
        try {
          const { data: existing } = await supabase
            .from("property_metadata")
            .select("descriptions")
            .eq("cod_ofer", prop.cod_ofer)
            .single();

          const updated = { ...(existing?.descriptions || {}), ...newDesc };

          await supabase
            .from("property_metadata")
            .update({ descriptions: updated })
            .eq("cod_ofer", prop.cod_ofer);

          translated++;
        } catch (err) {
          console.log(`    ❌ DB error: ${err}`);
          failed++;
        }
      } else {
        failed++;
      }
    }

    // Delay between batches
    if (i + BATCH_SIZE < needsTranslation.length) {
      console.log("  ⏳ Waiting 3s between batches...");
      await sleep(3000);
    }
  }

  console.log(`\n✅ Complete!\n   Translated: ${translated}\n   Failed: ${failed}`);
}

translateProperties().catch(console.error);

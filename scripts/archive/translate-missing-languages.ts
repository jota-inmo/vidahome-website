import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY!;
const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";

const BATCH_SIZE = 5;
const DELAY_BETWEEN_BATCHES = 1000; // 1 second between batches
const LANGUAGES = ['en', 'fr', 'de', 'it', 'pl'];

async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

interface TranslationResult {
    en?: string;
    fr?: string;
    de?: string;
    it?: string;
    pl?: string;
}

async function translateWithPerplexity(spanishText: string, languages: string[]): Promise<TranslationResult> {
    const languageMap: Record<string, string> = {
        'en': 'English',
        'fr': 'French',
        'de': 'German',
        'it': 'Italian',
        'pl': 'Polish'
    };

    const prompt = `You are a professional luxury real estate translator. Translate this Spanish property description to the following languages: ${languages.map(l => languageMap[l]).join(', ')}.

Requirements:
- Maintain luxury tone and marketing appeal
- Keep the translation length similar to the original
- Adapt culturally for each market
- Return ONLY valid JSON with these keys: ${languages.map(l => `"${l}"`).join(', ')}

Spanish text:
"${spanishText.substring(0, 300)}"

Return ONLY valid JSON, no markdown, no explanation.`;

    const response = await fetch(PERPLEXITY_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'sonar-pro',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 500,
        }),
    });

    if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    const content = data.choices?.[0]?.message?.content || '{}';
    
    try {
        return JSON.parse(content);
    } catch {
        console.error('Failed to parse JSON:', content);
        return {};
    }
}

async function main() {
    console.log('\n╔════════════════════════════════════╗');
    console.log('║ TRANSLATING MISSING LANGUAGES      ║');
    console.log('╚════════════════════════════════════╝\n');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
        auth: { persistSession: false },
    });

    // Get properties missing English
    const { data: props } = await supabase
        .from('property_metadata')
        .select('cod_ofer, descriptions, full_data')
        .not('descriptions', 'is', null);

    if (!props) {
        console.log('❌ No properties found');
        return;
    }

    const needsTranslation = props
        .filter((prop: any) => {
            const desc = prop.descriptions || {};
            const spanish = desc.description_es || prop.full_data?.descripciones || '';
            const missingLanguages = LANGUAGES.filter(lang => !desc[`description_${lang}`]);
            return spanish && missingLanguages.length > 0;
        })
        .map((prop: any) => ({
            cod_ofer: prop.cod_ofer,
            spanish: prop.descriptions?.description_es || prop.full_data?.descripciones || '',
            current: prop.descriptions || {},
            missingLanguages: LANGUAGES.filter(lang => !prop.descriptions?.[`description_${lang}`])
        }));

    console.log(`Found ${needsTranslation.length} properties needing translations\n`);

    if (needsTranslation.length === 0) {
        console.log('✅ All properties are fully translated!');
        return;
    }

    let translated = 0;
    let failed = 0;

    for (let i = 0; i < needsTranslation.length; i += BATCH_SIZE) {
        const batch = needsTranslation.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(needsTranslation.length / BATCH_SIZE);

        console.log(`\n📦 Batch ${batchNum}/${totalBatches} (${batch.length} properties):`);

        for (const prop of batch) {
            try {
                console.log(`  ⏳ Translating ${prop.cod_ofer} (missing: ${prop.missingLanguages.join(', ')})`);

                const translations = await translateWithPerplexity(prop.spanish, prop.missingLanguages);

                // Merge with existing translations
                const merged = {
                    ...prop.current,
                    ...Object.entries(translations).reduce((acc, [lang, text]) => ({
                        ...acc,
                        [`description_${lang}`]: text
                    }), {})
                };

                // Update in Supabase
                const { error } = await supabase
                    .from('property_metadata')
                    .update({ descriptions: merged })
                    .eq('cod_ofer', prop.cod_ofer);

                if (error) {
                    console.log(`    ❌ Failed to save: ${error.message}`);
                    failed++;
                } else {
                    console.log(`    ✅ Saved translations`);
                    translated++;
                }

                await sleep(500); // Small delay between API calls
            } catch (err: any) {
                console.log(`    ❌ Error: ${err.message}`);
                failed++;
            }
        }

        if (i + BATCH_SIZE < needsTranslation.length) {
            console.log(`  ⏸️  Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
            await sleep(DELAY_BETWEEN_BATCHES);
        }
    }

    console.log(`\n╔════════════════════════════════════╗`);
    console.log(`║ TRANSLATION COMPLETE              ║`);
    console.log(`╠════════════════════════════════════╣`);
    console.log(`║ ✅ Translated: ${translated}`);
    console.log(`║ ❌ Failed: ${failed}`);
    console.log(`╚════════════════════════════════════╝\n`);
}

main().catch(console.error);

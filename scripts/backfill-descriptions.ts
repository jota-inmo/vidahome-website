/**
 * Backfill description_es from Inmovilla API (ficha endpoint)
 * Run this when description_es is empty due to a full sync (paginacion doesn't include descriptions)
 * Usage: npx tsx scripts/backfill-descriptions.ts
 *        npx tsx scripts/backfill-descriptions.ts --limit=10   # test with 10 first
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { InmovillaWebApiService } from "../src/lib/api/web-service";

dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const NUMAGENCIA = process.env.INMOVILLA_NUMAGENCIA!;
const PASSWORD = process.env.INMOVILLA_PASSWORD!;
const ADDNUMAGENCIA = process.env.INMOVILLA_ADDNUMAGENCIA || '';
const DOMAIN = process.env.INMOVILLA_DOMAIN || 'vidahome-website.vercel.app';
const DELAY_MS = 600; // throttle to avoid hammering the API

async function sleep(ms: number) {
    return new Promise(r => setTimeout(r, ms));
}

async function main() {
    const args = process.argv.slice(2);
    const limitArg = args.find(a => a.startsWith('--limit='));
    const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : 500;

    console.log('🔍 Backfilling description_es from Inmovilla ficha endpoint...\n');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
        auth: { persistSession: false },
    });

    // Get properties where description_es is null/empty and property is active
    const { data: props, error } = await supabase
        .from('property_metadata')
        .select('cod_ofer, ref, descriptions, nodisponible')
        .eq('nodisponible', false)
        .limit(limit);

    if (error || !props) {
        console.error('❌ Error fetching properties:', error);
        process.exit(1);
    }

    // Filter those with empty/missing description_es
    const needsDesc = props.filter((p: any) => {
        const desc = p.descriptions || {};
        const es = desc.description_es || desc.descripciones || '';
        return !es || es.trim() === '';
    });

    console.log(`📊 ${props.length} active properties, ${needsDesc.length} missing description_es\n`);

    if (needsDesc.length === 0) {
        console.log('✅ Nothing to do — all properties already have description_es');
        return;
    }

    const api = new InmovillaWebApiService(
        NUMAGENCIA,
        PASSWORD,
        ADDNUMAGENCIA,
        1, // Spanish
        '',
        DOMAIN
    );

    let success = 0;
    let failed = 0;

    for (let i = 0; i < needsDesc.length; i++) {
        const prop = needsDesc[i];
        process.stdout.write(`  [${i + 1}/${needsDesc.length}] ${prop.cod_ofer} (${prop.ref}) ... `);

        try {
            const details = await api.getPropertyDetails(prop.cod_ofer);
            const description = details?.descripciones || '';

            if (!description) {
                console.log('⚠️  no description in API');
                failed++;
                await sleep(DELAY_MS);
                continue;
            }

            // Merge: keep existing translations, only set description_es
            const existing = prop.descriptions || {};
            const merged = { ...existing, description_es: description };

            const { error: upErr } = await supabase
                .from('property_metadata')
                .update({ descriptions: merged })
                .eq('cod_ofer', prop.cod_ofer);

            if (upErr) {
                console.log('❌ DB error:', upErr.message);
                failed++;
            } else {
                console.log(`✓ (${description.length} chars)`);
                success++;
            }
        } catch (e: any) {
            console.log(`❌ API error: ${e.message?.substring(0, 80)}`);
            failed++;
        }

        await sleep(DELAY_MS);
    }

    console.log(`\n✅ Done! Success: ${success} | Failed: ${failed}`);
}

main().catch(console.error);

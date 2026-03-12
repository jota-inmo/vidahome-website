import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const baseDomain = process.env.INMOVILLA_DOMAIN || 'vidahome-website.vercel.app';

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
});

const locales = ['es', 'en', 'fr', 'de', 'it', 'pl'];

async function generateUrls() {
    console.log(`🚀 Starting URL generation for domain: ${baseDomain}`);
    
    // 1. Fetch all properties from property_metadata
    const { data: properties, error } = await supabase
        .from('property_metadata')
        .select('cod_ofer, ref');

    if (error) {
        console.error('❌ Error fetching properties:', error);
        return;
    }

    if (!properties || properties.length === 0) {
        console.log('⚠️ No properties found to process.');
        return;
    }

    console.log(`📊 Found ${properties.length} properties. Generating URLs...`);

    const propertyUrls = properties.map(prop => {
        const urls: any = {
            cod_ofer: prop.cod_ofer,
            ref: prop.ref,
            updated_at: new Date().toISOString()
        };

        locales.forEach(locale => {
            urls[`url_${locale}`] = `https://${baseDomain}/${locale}/propiedades/${prop.cod_ofer}`;
        });

        return urls;
    });

    // 2. Upsert into property_urls
    const { error: upsertError } = await supabase
        .from('property_urls')
        .upsert(propertyUrls, { onConflict: 'cod_ofer' });

    if (upsertError) {
        console.error('❌ Error saving URLs to Supabase:', upsertError);
    } else {
        console.log(`✅ Successfully generated and saved URLs for ${properties.length} properties.`);
    }
}

generateUrls().catch(err => {
    console.error('💥 Unexpected error:', err);
    process.exit(1);
});

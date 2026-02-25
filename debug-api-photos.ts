import { createInmovillaApi } from '@/lib/api/properties';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

// Load Inmovilla config from env
const token = process.env.INMOVILLA_TOKEN;
const authType = (process.env.INMOVILLA_AUTH_TYPE as 'Token' | 'Bearer') || 'Token';

async function debug() {
    console.log('🔐 Inmovilla Config:');
    console.log('Token:', token?.slice(0, 10) + '...');
    console.log('AuthType:', authType);

    const api = createInmovillaApi(token!, authType);

    console.log('\n🔍 Fetching properties list...');
    const properties = await api.getProperties({ page: 1 });
    console.log(`Found ${properties.length} properties`);

    if (properties.length > 0) {
        const firstProp = properties[0];
        console.log(`\n▶️  First property: ${firstProp.cod_ofer} (${firstProp.ref})`);
        console.log('Basic fields:', {
            numfotos: firstProp.numfotos,
            fotoletra: firstProp.fotoletra,
            numagencia: firstProp.numagencia,
            mainImage: firstProp.mainImage
        });

        // Get details for first property
        console.log(`\n🔍 Fetching details for property ${firstProp.cod_ofer}...`);
        const details = await api.getPropertyDetails(firstProp.cod_ofer);
        
        if (details) {
            console.log('\n📄 Property Details:');
            console.log('- cod_ofer:', details.cod_ofer);
            console.log('- ref:', details.ref);
            console.log('- fotos type:', Array.isArray(details.fotos) ? 'Array' : typeof details.fotos);
            console.log('- fotos value:', details.fotos);
            console.log('- fotos length:', (details.fotos as any)?.length);
            
            if (Array.isArray(details.fotos)) {
                console.log('- fotos count:', details.fotos.length);
                if (details.fotos.length > 0) {
                    console.log('- First foto sample:', JSON.stringify(details.fotos[0], null, 2).substring(0, 200));
                }
            } else if (details.fotos && typeof details.fotos === 'object') {
                const fotosKeys = Object.keys(details.fotos);
                console.log('- fotos keys count:', fotosKeys.length);
                if (fotosKeys.length > 0) {
                    console.log('- First foto sample:', JSON.stringify(details.fotos[fotosKeys[0]], null, 2).substring(0, 200));
                }
            }

            // Check numfotos and fotoletra from details
            console.log('\n📊 Photo Construction Info:');
            console.log('- numfotos:', (details as any).numfotos);
            console.log('- fotoletra:', (details as any).fotoletra);
            console.log('- numagencia:', (details as any).numagencia);
            
            // Try to construct photo URLs
            if ((details as any).numagencia && (details as any).fotoletra) {
                const numagencia = (details as any).numagencia;
                const fotoletra = (details as any).fotoletra;
                const cod_ofer = details.cod_ofer;
                const photoUrl = `https://fotos15.inmovilla.com/${numagencia}/${cod_ofer}/${fotoletra}-1.jpg`;
                console.log('\n📸 Constructed Photo URL:');
                console.log(photoUrl);
            }
        } else {
            console.log('❌ No details returned');
        }
    }
}

debug().catch(err => console.error('Error:', err));

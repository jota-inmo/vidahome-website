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
const numagencia = process.env.INMOVILLA_NUMAGENCIA;
const password = process.env.INMOVILLA_PASSWORD;
const authType = process.env.INMOVILLA_AUTH_TYPE || 'Token';

console.log('Inmovilla Config:');
console.log('Token:', token?.slice(0, 10) + '...');
console.log('NumAgencia:', numagencia);
console.log('AuthType:', authType);

// Import after env is loaded
const InmovillaModule = await import('./src/lib/api/properties.js');
const { createInmovillaApi } = InmovillaModule;

const api = createInmovillaApi(token, authType);

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
        console.log('\nProperty Details:');
        console.log('- cod_ofer:', details.cod_ofer);
        console.log('- ref:', details.ref);
        console.log('- fotos type:', Array.isArray(details.fotos) ? 'Array' : typeof details.fotos);
        
        if (Array.isArray(details.fotos)) {
            console.log('- fotos count:', details.fotos.length);
            if (details.fotos.length > 0) {
                console.log('- First foto:', JSON.stringify(details.fotos[0], null, 2));
            }
        } else if (details.fotos && typeof details.fotos === 'object') {
            const fotosKeys = Object.keys(details.fotos);
            console.log('- fotos keys:', fotosKeys.slice(0, 5).join(', '));
            const firstKey = fotosKeys[0];
            console.log('- First foto:', JSON.stringify(details.fotos[firstKey], null, 2));
        } else {
            console.log('- fotos value:', details.fotos);
        }
    } else {
        console.log('❌ No details returned for property');
    }
}


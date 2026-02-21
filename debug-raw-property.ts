import { createInmovillaWebClient } from './src/lib/api/web-client';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function debugPropertyDetails(id: number) {
    const numagencia = process.env.INMOVILLA_AGENCIA;
    const password = process.env.INMOVILLA_PASSWORD;
    const addnumagencia = process.env.INMOVILLA_ADDAGENCIA || '';

    if (!numagencia || !password) {
        console.error('Missing credentials');
        return;
    }

    const client = createInmovillaWebClient({
        numagencia,
        password,
        addnumagencia,
        idioma: 1,
        ip: '127.0.0.1',
        domain: 'vidahome.es'
    });

    try {
        client.addProcess('ficha', 1, 1, `ofertas.cod_ofer=${id}`, '');
        const result = await client.execute();

        console.log('--- RAW DATA FOR PROPERTY', id, '---');
        console.log(JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error fetching details:', error);
    }
}

// Using a reference from the metadata if available or a common ID.
// I saw 50 records in property_metadata. Let's find one ID to test.
debugPropertyDetails(27910163); // Using a real ID from the DB

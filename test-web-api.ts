
import { InmovillaWebClient } from './src/lib/api/web-client';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function testDetail() {
    const config = {
        numagencia: process.env.INMOVILLA_AGENCIA || '13031',
        password: process.env.INMOVILLA_PASSWORD || '',
        idioma: 1,
        addnumagencia: process.env.INMOVILLA_ADD_AGENCIA || '_244_ext',
        domain: 'vidahome.es'
    };

    console.log('Testing with config:', { ...config, password: '***' });
    const client = new InmovillaWebClient(config);

    // Test a known ID from the list (if we had one, let's try a common one or search first)
    console.log('\n--- Testing PAGINACION (List) ---');
    client.addProcess('paginacion', 1, 5, '', '');
    try {
        const listRes = await client.execute();
        console.log('List Success:', !!listRes.paginacion);
        if (listRes.paginacion && listRes.paginacion.length > 1) {
            const first = listRes.paginacion[1];
            console.log('First Property ID:', first.cod_ofer, 'REF:', first.ref);

            const targetId = first.cod_ofer;

            console.log(`\n--- Testing FICHA for ID ${targetId} ---`);
            const client2 = new InmovillaWebClient(config);
            client2.addProcess('ficha', 1, 1, `ofertas.cod_ofer=${targetId}`, '');
            const fichaRes = await client2.execute();
            console.log('Ficha raw response keys:', Object.keys(fichaRes));
            if (fichaRes.ficha) {
                console.log('Ficha records count:', fichaRes.ficha.length);
                console.log('Ficha data:', JSON.stringify(fichaRes.ficha[1], null, 2));
            } else {
                console.log('Ficha process missing in response');
            }

            console.log(`\n--- Testing FICHA (alternative where) for ID ${targetId} ---`);
            const client3 = new InmovillaWebClient(config);
            client3.addProcess('ficha', 1, 1, `cod_ofer=${targetId}`, '');
            const fichaRes2 = await client3.execute();
            if (fichaRes2.ficha) {
                console.log('Ficha (alt) data:', JSON.stringify(fichaRes2.ficha[1], null, 2));
            }
        }
    } catch (e) {
        console.error('Test failed:', e);
    }
}

testDetail();

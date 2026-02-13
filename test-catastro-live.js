const https = require('https');

function get(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: data }));
        }).on('error', reject);
    });
}

async function run() {
    // New official domain
    const baseUrl = 'https://www1.catastro.hacienda.gob.es/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/json';

    // Alcala 1 Madrid
    const url = `${baseUrl}/Consulta_DNPLOC?Provincia=MADRID&Municipio=MADRID&TipoVia=CL&NomVia=ALCALA&Numero=1`;

    console.log('Searching via hacienda.gob.es:', url);

    try {
        const { status, body } = await get(url);
        console.log('Status:', status);
        console.log('Body:', body);
    } catch (e) {
        console.error('Error:', e.message);
    }
}

run();

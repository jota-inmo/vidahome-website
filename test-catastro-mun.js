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
    const baseUrl = 'https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/json';

    const munUrl = `${baseUrl}/ObtenerMunicipios?Provincia=VALENCIA&Municipio=GANDIA`;
    try {
        const { status, body } = await get(munUrl);
        console.log('Status:', status);
        console.log('Body:', body);
    } catch (e) {
        console.error('Error:', e.message);
    }
}

run();

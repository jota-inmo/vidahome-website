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

    // Testing getProvincias
    const url = `${baseUrl}/ConsultaProvincia`;
    console.log('Fetching Provincias:', url);

    try {
        const { status, body } = await get(url);
        console.log('Status:', status);
        console.log('Body:', body.substring(0, 500));
    } catch (e) {
        console.error('Error:', e.message);
    }
}

run();

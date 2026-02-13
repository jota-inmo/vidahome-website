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

    // 1. ObtenerCallejero
    const calleUrl = `${baseUrl}/ObtenerCallejero?Provincia=VALENCIA&Municipio=GANDIA&NomVia=MAYOR`;
    console.log('Fetching Calle:', calleUrl);
    try {
        const { status, body } = await get(calleUrl);
        console.log('Status:', status);
        console.log('Body:', body);
    } catch (e) {
        console.error('Error:', e.message);
    }

    // 2. ObtenerNumerero (using a street found result if possible, or just Mayo)
    const numUrl = `${baseUrl}/ObtenerNumerero?Provincia=VALENCIA&Municipio=GANDIA&TipoVia=CL&NomVia=MAYOR&Numero=1`;
    console.log('\nFetching Numero:', numUrl);
    try {
        const { status, body } = await get(numUrl);
        console.log('Status:', status);
        console.log('Body:', body);
    } catch (e) {
        console.error('Error:', e.message);
    }
}

run();

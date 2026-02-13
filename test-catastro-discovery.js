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

    // 1. Test ConsultaVia
    console.log('--- Testing ConsultaVia ---');
    const viaUrl = `${baseUrl}/ConsultaVia?Provincia=VALENCIA&Municipio=GANDIA&NomVia=MAYOR`;
    try {
        const { status, body } = await get(viaUrl);
        console.log('Status:', status);
        console.log('Body:', body);
    } catch (e) {
        console.error('Error:', e.message);
    }

    // 2. Test ConsultaNumero
    console.log('\n--- Testing ConsultaNumero ---');
    // Using Mayor in Gandia might work if we find the correct street name from the previous call
    const numUrl = `${baseUrl}/ConsultaNumero?Provincia=VALENCIA&Municipio=GANDIA&TipoVia=CL&NomVia=MAYOR&Numero=1`;
    try {
        const { status, body } = await get(numUrl);
        console.log('Status:', status);
        console.log('Body:', body);
    } catch (e) {
        console.error('Error:', e.message);
    }
}

run();

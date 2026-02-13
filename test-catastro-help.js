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
    const helpUrl = 'https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/json/help';
    console.log('Fetching JSON Help:', helpUrl);

    try {
        const { status, body } = await get(helpUrl);
        console.log('Status:', status);
        console.log('Body snippet:', body.substring(0, 1000));
    } catch (e) {
        console.error('Error:', e.message);
    }
}

run();

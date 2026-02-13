const https = require('https');
const fs = require('fs');

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
    try {
        const { status, body } = await get(helpUrl);
        fs.writeFileSync('catastro_help_full.html', body);
        console.log('Help saved to catastro_help_full.html');
    } catch (e) {
        console.error(e);
    }
}

run();

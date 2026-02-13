/**
 * Test con headers de navegador real
 */

const baseUrl = 'https://ovc.catastro.meh.es';

async function testWithBrowserHeaders() {
    console.log('🧪 Probando con headers de navegador real\n');

    const params = new URLSearchParams({
        Provincia: 'VALENCIA',
        Municipio: 'GANDIA',
        TipoVia: 'CL',
        NombreVia: 'MAYOR',
        Numero: '1'
    });

    const url = `${baseUrl}/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/Consulta_DNPLOC?${params}`;

    console.log('URL:', url);
    console.log('');

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/xml, text/xml, */*',
                'Accept-Language': 'es-ES,es;q=0.9',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www1.sedecatastro.gob.es/',
                'Origin': 'https://www1.sedecatastro.gob.es'
            }
        });

        console.log('Status:', response.status, response.statusText);
        console.log('Headers recibidos:');
        for (const [key, value] of response.headers.entries()) {
            console.log(`  ${key}: ${value}`);
        }

        const text = await response.text();
        console.log('\nPrimeros 1000 caracteres de la respuesta:');
        console.log(text.substring(0, 1000));
        console.log('\n...\n');

        // Analizar respuesta
        if (text.includes('Sistema no disponible')) {
            console.log('❌ Servicio no disponible');
        } else if (text.includes('<rc>')) {
            console.log('✅ Respuesta XML válida con referencias catastrales');
            const rcMatches = text.match(/<rc>(.*?)<\/rc>/g);
            if (rcMatches) {
                console.log(`Encontradas ${rcMatches.length} referencias`);
            }
        } else if (text.includes('"des"')) {
            const errorMatch = text.match(/"des":"([^"]+)"/);
            if (errorMatch) {
                console.log('⚠️ Error del servicio:', errorMatch[1]);
            }
        } else {
            console.log('⚠️ Respuesta inesperada');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

console.log('═══════════════════════════════════════════════════');
console.log('  TEST CON HEADERS DE NAVEGADOR');
console.log('═══════════════════════════════════════════════════\n');

testWithBrowserHeaders();

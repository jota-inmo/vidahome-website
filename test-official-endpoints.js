/**
 * Test usando el endpoint REST según documentación oficial
 */

async function testRestEndpoint() {
    console.log('🧪 Test 1: Endpoint REST según documentación\n');

    // Según la documentación, el endpoint REST es:
    // https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/rest/Consulta_DNPLOC

    const url = 'https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/rest/Consulta_DNPLOC?Provincia=VALENCIA&Municipio=GANDIA&TipoVia=CL&NomVia=MAYOR&Numero=1';

    console.log('URL:', url);
    console.log('');

    try {
        const response = await fetch(url);

        console.log('Status:', response.status, response.statusText);

        const text = await response.text();
        console.log('\nRespuesta (primeros 1000 chars):');
        console.log(text.substring(0, 1000));
        console.log('\n...\n');

        // Analizar
        if (text.includes('Sistema no disponible')) {
            console.log('❌ Servicio no disponible');
        } else if (text.includes('<rc>')) {
            console.log('✅ XML con referencias catastrales');
            const rcMatches = text.match(/<rc>(.*?)<\/rc>/g);
            if (rcMatches) {
                console.log(`Encontradas ${rcMatches.length} referencias:`);
                rcMatches.forEach((match, i) => {
                    const rc = match.replace(/<\/?rc>/g, '');
                    console.log(`  ${i + 1}. ${rc}`);
                });
            }
        } else if (text.includes('"des"')) {
            const errorMatch = text.match(/"des":"([^"]+)"/);
            if (errorMatch) {
                console.log('⚠️ Error:', errorMatch[1]);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

async function testJsonEndpoint() {
    console.log('\n\n🧪 Test 2: Endpoint JSON según documentación\n');

    // Endpoint JSON según documentación
    const url = 'https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/json/Consulta_DNPLOC?Provincia=VALENCIA&Municipio=GANDIA&TipoVia=CL&NomVia=MAYOR&Numero=1';

    console.log('URL:', url);
    console.log('');

    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json'
            }
        });

        console.log('Status:', response.status, response.statusText);

        const text = await response.text();
        console.log('\nRespuesta (primeros 1000 chars):');
        console.log(text.substring(0, 1000));

        // Intentar parsear como JSON
        try {
            const json = JSON.parse(text);
            console.log('\n✅ JSON válido:');
            console.log(JSON.stringify(json, null, 2).substring(0, 500));
        } catch {
            console.log('\n⚠️ No es JSON válido');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

async function testReferenceEndpoint() {
    console.log('\n\n🧪 Test 3: Consulta por referencia catastral\n');

    // Ejemplo de la documentación
    const url = 'https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/json/Consulta_DNPRC?RefCat=2749704YJ0624N0001DI';

    console.log('URL:', url);
    console.log('(Referencia del ejemplo oficial: 2749704YJ0624N0001DI)');
    console.log('');

    try {
        const response = await fetch(url);

        console.log('Status:', response.status, response.statusText);

        const text = await response.text();
        console.log('\nRespuesta (primeros 1500 chars):');
        console.log(text.substring(0, 1500));

        if (text.includes('Sistema no disponible')) {
            console.log('\n❌ Servicio no disponible');
        } else if (text.startsWith('{')) {
            console.log('\n✅ Respuesta JSON válida');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

console.log('═══════════════════════════════════════════════════');
console.log('  TESTS CON ENDPOINTS OFICIALES');
console.log('═══════════════════════════════════════════════════\n');

(async () => {
    await testRestEndpoint();
    await testJsonEndpoint();
    await testReferenceEndpoint();
    console.log('\n✅ Tests completados');
})();

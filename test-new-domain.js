/**
 * Test con el dominio oficial actualizado
 */

const baseUrl = 'https://ovc.catastro.hacienda.gob.es';

async function testNewDomain() {
    console.log('🧪 Probando con el dominio oficial actualizado\n');

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
            }
        });

        console.log('Status:', response.status, response.statusText);

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
                console.log(`✅ Encontradas ${rcMatches.length} referencias`);
                rcMatches.slice(0, 5).forEach((match, i) => {
                    const rc = match.replace(/<\/?rc>/g, '');
                    console.log(`  ${i + 1}. ${rc}`);
                });
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
console.log('  TEST CON DOMINIO OFICIAL ACTUALIZADO');
console.log('  ovc.catastro.hacienda.gob.es');
console.log('═══════════════════════════════════════════════════\n');

testNewDomain();

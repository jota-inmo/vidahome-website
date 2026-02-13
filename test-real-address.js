/**
 * Test con direcciones reales de Gandia
 */

const baseUrl = 'https://ovc.catastro.meh.es';

async function testAddress(provincia, municipio, tipoVia, nombreVia, numero) {
    console.log(`\n🔍 Probando: ${tipoVia} ${nombreVia} ${numero}, ${municipio}`);

    const params = new URLSearchParams({
        Provincia: provincia,
        Municipio: municipio,
        TipoVia: tipoVia,
        NombreVia: nombreVia,
        Numero: numero
    });

    const url = `${baseUrl}/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/Consulta_DNPLOC?${params}`;

    try {
        const response = await fetch(url);
        const text = await response.text();

        console.log('Status:', response.status);

        // Buscar referencias catastrales
        const rcMatches = text.match(/<rc>(.*?)<\/rc>/g);
        if (rcMatches && rcMatches.length > 0) {
            console.log('✅ ENCONTRADO!');
            console.log('Referencias encontradas:', rcMatches.length);
            rcMatches.forEach((match, i) => {
                const rc = match.replace(/<\/?rc>/g, '');
                console.log(`  ${i + 1}. ${rc}`);
            });

            // Buscar direcciones
            const ldtMatches = text.match(/<ldt>(.*?)<\/ldt>/g);
            if (ldtMatches) {
                console.log('Direcciones:');
                ldtMatches.slice(0, 3).forEach((match, i) => {
                    const addr = match.replace(/<\/?ldt>/g, '');
                    console.log(`  ${i + 1}. ${addr}`);
                });
            }

            return rcMatches[0].replace(/<\/?rc>/g, '');
        } else {
            // Buscar errores
            const errorMatch = text.match(/"des":"([^"]+)"/);
            if (errorMatch) {
                console.log('❌ Error:', errorMatch[1]);
            } else if (text.includes('Sistema no disponible')) {
                console.log('⚠️ Servicio no disponible');
            } else {
                console.log('❌ No se encontraron resultados');
            }
            return null;
        }
    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
        return null;
    }
}

async function testPropertyDetails(ref) {
    console.log(`\n📋 Obteniendo detalles de: ${ref}`);

    const rc = ref.replace(/\s/g, '');
    const params = new URLSearchParams({
        RefCat: rc,
        RCBico1: rc.substring(0, 7),
        RCBico2: rc.substring(7, 14)
    });

    const url = `${baseUrl}/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/Consulta_DNPRC?${params}`;

    try {
        const response = await fetch(url);
        const text = await response.text();

        // Extraer campos clave
        const fields = {
            rc: /<rc>(.*?)<\/rc>/.exec(text)?.[1],
            direccion: /<ldt>(.*?)<\/ldt>/.exec(text)?.[1],
            superficie: /<sfc>(.*?)<\/sfc>/.exec(text)?.[1],
            año: /<ant>(.*?)<\/ant>/.exec(text)?.[1],
            valor: /<vcat>(.*?)<\/vcat>/.exec(text)?.[1],
            uso: /<luso>(.*?)<\/luso>/.exec(text)?.[1]
        };

        console.log('✅ Detalles obtenidos:');
        console.log('  Dirección:', fields.direccion || 'N/A');
        console.log('  Superficie:', fields.superficie || 'N/A', 'm²');
        console.log('  Año construcción:', fields.año || 'N/A');
        console.log('  Valor catastral:', fields.valor || 'N/A', '€');
        console.log('  Uso:', fields.uso || 'N/A');

        return fields;
    } catch (error) {
        console.error('❌ Error:', error.message);
        return null;
    }
}

console.log('═══════════════════════════════════════════════════');
console.log('  TEST CON DIRECCIONES REALES DE GANDIA');
console.log('═══════════════════════════════════════════════════');

(async () => {
    // Probar varias direcciones conocidas de Gandia
    const addresses = [
        ['VALENCIA', 'GANDIA', 'CL', 'MAYOR', '1'],
        ['VALENCIA', 'GANDIA', 'CL', 'MAYOR', '10'],
        ['VALENCIA', 'GANDIA', 'AV', 'REPUBLICA ARGENTINA', '1'],
        ['VALENCIA', 'GANDIA', 'PS', 'MARITIMO NEPTUNO', '1'],
        ['VALENCIA', 'GANDIA', 'CL', 'SAN RAFAEL', '1'],
    ];

    let foundRef = null;

    for (const addr of addresses) {
        const ref = await testAddress(...addr);
        if (ref && !foundRef) {
            foundRef = ref;
        }
        await new Promise(resolve => setTimeout(resolve, 500)); // Pequeña pausa
    }

    // Si encontramos alguna, obtener detalles
    if (foundRef) {
        await testPropertyDetails(foundRef);
    }

    console.log('\n✅ Pruebas completadas');
    console.log('\n💡 Usa una de las direcciones que funcionaron en tu aplicación');
})();

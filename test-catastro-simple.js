/**
 * Test simple de la API del Catastro
 * Ejecutar con: node test-catastro-simple.js
 */

const baseUrl = 'https://ovc.catastro.meh.es';

async function testSearch() {
    console.log('🧪 Probando búsqueda por dirección...\n');

    const params = new URLSearchParams({
        Provincia: 'Valencia',
        Municipio: 'Gandia',
        TipoVia: 'CL',
        NombreVia: 'Gran Vía',
        Numero: '1'
    });

    const url = `${baseUrl}/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/Consulta_DNPLOC?${params}`;

    console.log('📡 URL:', url);
    console.log('\n⏳ Haciendo petición...\n');

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/xml, text/xml',
            }
        });

        console.log('📊 Status:', response.status, response.statusText);
        console.log('📋 Headers:', Object.fromEntries(response.headers.entries()));

        const text = await response.text();
        console.log('\n📄 Respuesta (primeros 1000 caracteres):');
        console.log(text.substring(0, 1000));
        console.log('\n...\n');

        // Buscar referencias catastrales
        const rcMatches = text.match(/<rc>(.*?)<\/rc>/g);
        if (rcMatches) {
            console.log('✅ Referencias catastrales encontradas:');
            rcMatches.forEach((match, i) => {
                const rc = match.replace(/<\/?rc>/g, '');
                console.log(`  ${i + 1}. ${rc}`);
            });
        } else {
            console.log('❌ No se encontraron referencias catastrales en la respuesta');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

async function testDetails(ref) {
    console.log(`\n\n🧪 Probando detalles con referencia: ${ref}\n`);

    const rc = ref.replace(/\s/g, '');
    const params = new URLSearchParams({
        RefCat: rc,
        RCBico1: rc.substring(0, 7),
        RCBico2: rc.substring(7, 14)
    });

    const url = `${baseUrl}/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/Consulta_DNPRC?${params}`;

    console.log('📡 URL:', url);
    console.log('\n⏳ Haciendo petición...\n');

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/xml, text/xml',
            }
        });

        console.log('📊 Status:', response.status, response.statusText);

        const text = await response.text();
        console.log('\n📄 Respuesta (primeros 2000 caracteres):');
        console.log(text.substring(0, 2000));

        // Buscar campos clave
        const fields = ['rc', 'ldt', 'sfc', 'ant', 'vcat', 'luso'];
        console.log('\n📋 Campos encontrados:');
        fields.forEach(field => {
            const regex = new RegExp(`<${field}>(.*?)<\/${field}>`, 'g');
            const matches = text.match(regex);
            if (matches) {
                console.log(`  ${field}:`, matches[0].replace(/<\/?[^>]+>/g, ''));
            }
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Ejecutar pruebas
console.log('═══════════════════════════════════════════════════');
console.log('  TEST DE LA API DEL CATASTRO');
console.log('═══════════════════════════════════════════════════\n');

testSearch()
    .then(() => {
        // Si quieres probar con una referencia específica, descomenta:
        // return testDetails('TU_REFERENCIA_AQUI');
    })
    .then(() => {
        console.log('\n✅ Pruebas completadas');
    })
    .catch(error => {
        console.error('\n❌ Error fatal:', error);
    });

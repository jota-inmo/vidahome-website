/**
 * Test para probar diferentes endpoints del Catastro
 * La web oficial funciona, así que probemos endpoints alternativos
 */

const baseUrl = 'https://ovc.catastro.meh.es';

async function testEndpoint1() {
    console.log('\n🧪 Test 1: Endpoint DNPLOC (actual)');
    const params = new URLSearchParams({
        Provincia: 'Valencia',
        Municipio: 'Gandia',
        TipoVia: 'CL',
        NombreVia: 'Gran Vía',
        Numero: '1'
    });

    const url = `${baseUrl}/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/Consulta_DNPLOC?${params}`;
    console.log('URL:', url);

    try {
        const response = await fetch(url);
        const text = await response.text();
        console.log('Status:', response.status);
        console.log('Disponible:', !text.includes('Sistema no disponible'));
        console.log('Primeros 500 chars:', text.substring(0, 500));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

async function testEndpoint2() {
    console.log('\n🧪 Test 2: Endpoint alternativo DNPRC_Consulta');

    const url = `${baseUrl}/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/Consulta_DNPRC_Provincia_Municipio?Provincia=VALENCIA&Municipio=GANDIA`;
    console.log('URL:', url);

    try {
        const response = await fetch(url);
        const text = await response.text();
        console.log('Status:', response.status);
        console.log('Disponible:', !text.includes('Sistema no disponible'));
        console.log('Primeros 500 chars:', text.substring(0, 500));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

async function testEndpoint3() {
    console.log('\n🧪 Test 3: Endpoint REST alternativo');

    // Probar con el endpoint que usa la web oficial
    const url = `${baseUrl}/OVCCallejero/OVCBuscarDireccion.aspx?Provincia=VALENCIA&Municipio=GANDIA&TipoVia=CL&NombreVia=GRAN%20VIA&Numero=1`;
    console.log('URL:', url);

    try {
        const response = await fetch(url);
        const text = await response.text();
        console.log('Status:', response.status);
        console.log('Disponible:', !text.includes('Sistema no disponible'));
        console.log('Tiene formulario:', text.includes('<form'));
        console.log('Primeros 500 chars:', text.substring(0, 500));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

async function testEndpoint4() {
    console.log('\n🧪 Test 4: Servicio JSON directo');

    const url = `${baseUrl}/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/json/Consulta_DNPLOC?Provincia=VALENCIA&Municipio=GANDIA&TipoVia=CL&NombreVia=GRAN%20VIA&Numero=1`;
    console.log('URL:', url);

    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json'
            }
        });
        const text = await response.text();
        console.log('Status:', response.status);
        console.log('Disponible:', !text.includes('Sistema no disponible'));
        console.log('Es JSON:', text.startsWith('{'));
        console.log('Respuesta:', text.substring(0, 500));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

console.log('═══════════════════════════════════════════════════');
console.log('  PROBANDO DIFERENTES ENDPOINTS DEL CATASTRO');
console.log('═══════════════════════════════════════════════════');

(async () => {
    await testEndpoint1();
    await testEndpoint2();
    await testEndpoint3();
    await testEndpoint4();

    console.log('\n✅ Pruebas completadas');
})();

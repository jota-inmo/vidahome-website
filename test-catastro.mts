/**
 * Script de prueba para la API del Catastro
 * Ejecutar con: node --loader ts-node/esm test-catastro.mts
 * O simplemente: tsx test-catastro.mts
 */

import { createCatastroClient } from './src/lib/api/catastro.js';

async function testCatastro() {
    console.log('🧪 Iniciando pruebas de la API del Catastro...\n');

    const client = createCatastroClient();

    // Test 1: Búsqueda por dirección
    console.log('📍 Test 1: Búsqueda por dirección');
    console.log('Buscando: Valencia, Gandia, Gran Vía, 1');

    try {
        const searchResult = await client.searchByAddress({
            provincia: 'Valencia',
            municipio: 'Gandia',
            via: 'Gran Vía',
            numero: '1'
        });

        console.log('✅ Resultado de búsqueda:');
        console.log(JSON.stringify(searchResult, null, 2));

        if (searchResult.found && searchResult.properties.length > 0) {
            const firstRef = searchResult.properties[0].referenciaCatastral;
            console.log(`\n📋 Primera referencia encontrada: ${firstRef}`);

            // Test 2: Obtener detalles de la primera propiedad
            console.log('\n📊 Test 2: Obteniendo detalles de la propiedad...');
            const details = await client.getPropertyDetails(firstRef);

            if (details) {
                console.log('✅ Detalles obtenidos:');
                console.log(JSON.stringify(details, null, 2));

                if (details.valorCatastral && details.valorCatastral > 0) {
                    const estimation = client.estimateMarketValue(details.valorCatastral);
                    console.log('\n💰 Estimación de valor de mercado:');
                    console.log(`  Mínimo: ${estimation.min.toLocaleString('es-ES')}€`);
                    console.log(`  Máximo: ${estimation.max.toLocaleString('es-ES')}€`);
                }
            } else {
                console.log('❌ No se pudieron obtener los detalles');
            }
        } else {
            console.log('⚠️ No se encontraron propiedades');
        }

    } catch (error) {
        console.error('❌ Error en la prueba:', error);
    }

    // Test 3: Prueba con una referencia catastral conocida (ejemplo)
    console.log('\n\n📋 Test 3: Prueba con referencia catastral directa');
    console.log('Nota: Necesitas una referencia catastral real de 20 caracteres');
    console.log('Ejemplo de formato: 1234567VK1234N0001AB');

    // Puedes descomentar y probar con una referencia real:
    /*
    const testRef = '1234567VK1234N0001AB'; // Reemplaza con una referencia real
    const detailsTest = await client.getPropertyDetails(testRef);
    console.log('Resultado:', detailsTest);
    */
}

// Ejecutar las pruebas
testCatastro()
    .then(() => {
        console.log('\n✅ Pruebas completadas');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Error fatal:', error);
        process.exit(1);
    });

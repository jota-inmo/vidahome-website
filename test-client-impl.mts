
import { createCatastroClient } from './src/lib/api/catastro';

async function verifyClient() {
    console.log('🕵️ Iniciando diagnóstico del Cliente Catastro (JSON)...\n');
    const client = createCatastroClient();

    // 1. Prueba por Referencia (Sabemos que esta existe)
    const ref = '2749704YJ0624N0001DI';
    console.log(`🤖 1. Consultando Referencia: ${ref}`);
    try {
        const result = await client.getPropertyDetails(ref);
        if (result) {
            console.log('✅ ÉXITO. Datos parseados correctamente:');
            console.log(JSON.stringify(result, null, 2));
        } else {
            console.log('❌ FALLO. La API respondió, pero el cliente devolvió null.');
        }
    } catch (e) {
        console.log('❌ ERROR EXCEPCIÓN:', e);
    }

    // 2. Prueba por Dirección (Valencia/Gandia/Calle/Mayor/1)
    console.log(`\n🤖 2. Consultando Dirección: Valencia, Gandia, CL Mayor, 1`);
    try {
        const search = await client.searchByAddress({
            provincia: 'VALENCIA',
            municipio: 'GANDIA',
            via: 'MAYOR',
            numero: '1'
        });

        if (search.found) {
            console.log(`✅ ÉXITO. Encontradas ${search.properties.length} propiedades.`);
            console.log('Primera propiedad:', JSON.stringify(search.properties[0], null, 2));
        } else {
            console.log('❌ FALLO o NO ENCONTRADO.');
            console.log('Error devuelto:', search.error);
        }

    } catch (e) {
        console.log('❌ ERROR EXCEPCIÓN:', e);
    }
}

verifyClient();

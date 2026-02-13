/**
 * Simulador de lógica de CatastroClient para depuración
 */

const baseUrl = 'https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/json';

async function simulateGetPropertyDetails(ref) {
    console.log(`\n🔍 Simulando getPropertyDetails para: ${ref}`);

    // 1. URL
    const params = new URLSearchParams({ RefCat: ref });
    const url = `${baseUrl}/Consulta_DNPRC?${params}`;
    console.log(`📡 URL: ${url}`);

    try {
        const response = await fetch(url);
        const text = await response.text();
        console.log(`📄 Respuesta length: ${text.length}`);

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('❌ Error parsing JSON');
            return;
        }

        console.log('📦 Data keys:', Object.keys(data));

        // Inspeccionar estructura profunda
        let root = data;
        let foundRoot = false;

        // Intentar encontrar el wrapper *Result
        if (data.consulta_dnprcResult) {
            console.log('✅ Encontrado wrapper consulta_dnprcResult');
            root = data.consulta_dnprcResult;
            foundRoot = true;
        } else if (data.consulta_dnplocResult) {
            console.log('✅ Encontrado wrapper consulta_dnplocResult');
            root = data.consulta_dnplocResult;
            foundRoot = true;
        }

        if (foundRoot) {
            console.log('📦 Root keys:', Object.keys(root));
        }

        if (root.lerr) {
            console.log('⚠️ API devolvió error interno:', JSON.stringify(root.lerr, null, 2));
            return;
        }

        // Buscar bico o lrcdnp
        if (root.bico) {
            console.log('✅ Encontrado root.bico');
            let item = root.bico.bi || (Array.isArray(root.bico) ? root.bico[0] : root.bico);
            console.log('📦 Item a mapear:', JSON.stringify(item, null, 2).substring(0, 500) + '...');
        } else if (root.lrcdnp) {
            console.log('✅ Encontrado root.lrcdnp');
            console.log(`Items: ${root.lrcdnp.length}`);
        } else {
            console.log('❌ No se encontró bico ni lrcdnp en la raíz desempaquetada');
            // Imprimir estructura completa del root si no es muy grande
            console.log('Estructura root:', JSON.stringify(root, null, 2).substring(0, 1000));
        }

    } catch (e) {
        console.error('❌ Excepción:', e);
    }
}

// Ejecutar prueba
simulateGetPropertyDetails('2749704YJ0624N0001DI');

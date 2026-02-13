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

        // 2. Verificar errores
        if (data.lerr) {
            console.log('⚠️ API devolvió error:', data.lerr[0]);
            return;
        }

        // 3. Verificar estructura bico
        if (data.consulta_dnp && data.consulta_dnp.bico) {
            console.log('✅ Estructura bico encontrada');
            const bico = data.consulta_dnp.bico;

            let item;
            if (bico.bi) {
                console.log('  -> Usando bico.bi');
                item = bico.bi;
            } else if (Array.isArray(bico)) {
                console.log('  -> Usando bico[0]');
                item = bico[0];
            } else {
                console.log('  -> Usando bico directo');
                item = bico;
            }

            console.log('📦 Item a mapear:', JSON.stringify(item, null, 2).substring(0, 200) + '...');

            // 4. Simular mapeo
            mapJsonToProperty(item);
        } else {
            console.log('❌ No se encontró structure consulta_dnp.bico');
            console.log('Keys en data:', Object.keys(data));
            if (data.consulta_dnp) console.log('Keys en consulta_dnp:', Object.keys(data.consulta_dnp));
        }

    } catch (e) {
        console.error('❌ Excepción:', e);
    }
}

function mapJsonToProperty(item) {
    console.log('\n🗺️ Iniciando mapeo...');

    let rc = '';
    if (item.idbi && item.idbi.rc) {
        console.log('  -> Usando item.idbi.rc');
        const r = item.idbi.rc;
        rc = `${r.pc1}${r.pc2}${r.car}${r.cc1}${r.cc2}`;
    }
    else if (item.rc) {
        console.log('  -> Usando item.rc');
        if (typeof item.rc === 'string') {
            rc = item.rc;
        } else {
            rc = `${item.rc.pc1}${item.rc.pc2}${item.rc.car}${item.rc.cc1}${item.rc.cc2}`;
        }
    }

    console.log(`  🔑 RC extraída: ${rc}`);

    // Dirección
    let direccion = '';
    if (typeof item.ldt === 'string') {
        console.log('  -> Usando item.ldt (string)');
        direccion = item.ldt;
    }
    else if (item.dt && item.dt.locs && item.dt.locs.lourb && item.dt.locs.lourb.dir) {
        console.log('  -> Construyendo desde item.dt.locs.lourb.dir');
        const dom = item.dt.locs.lourb.dir;
        direccion = `${dom.tv || ''} ${dom.nv || ''} ${dom.pnp || ''}`.trim();
    }

    console.log(`  🏠 Dirección extraída: ${direccion}`);

    // Datos
    if (item.debi) {
        console.log('  -> Datos económicos (debi) encontrados');
        console.log(`     Superficie: ${item.debi.sfc}`);
        console.log(`     Antigüedad: ${item.debi.ant}`);
        console.log(`     Uso: ${item.debi.luso}`);
    } else {
        console.log('  ⚠️ No se encontraron datos económicos (debi)');
    }
}

// Ejecutar prueba
simulateGetPropertyDetails('2749704YJ0624N0001DI');

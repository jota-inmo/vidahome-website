
import dotenv from 'dotenv';
import { InmovillaWebApiService } from '../src/lib/api/web-service';

dotenv.config();

const numagencia = process.env.INMOVILLA_AGENCIA || '';
const password = process.env.INMOVILLA_PASSWORD || '';
const addnumagencia = process.env.INMOVILLA_ADDAGENCIA || '';
const domain = process.env.INMOVILLA_DOMAIN || 'vidahome-website.vercel.app';
const clientIp = '1.1.1.1';

console.log('--- BUSCANDO PROPIEDADES CON SOLO HABITACIONES SIMPLES ---');

if (!numagencia || !password) {
    console.error('Error: Credenciales no encontradas');
    process.exit(1);
}

const api = new InmovillaWebApiService(numagencia, password, addnumagencia, 1, clientIp, domain);

async function run() {
    try {
        const properties = await api.getProperties({ page: 1 });
        console.log(`Encontradas ${properties.length} propiedades en total.`);

        const results = [];
        for (const p of properties) {
            // Buscamos los detalles para ver habdobles
            const details = await api.getPropertyDetails(p.cod_ofer);
            if (details) {
                // habitacion (simples) y habdobles (dobles)
                // Ojo: el nombre real en el objeto retornado por getPropertyDetails puede variar
                // Vamos a inspeccionar el objeto crudo si es necesario
                const simples = (details as any).habitaciones || 0;

                // Inspeccionamos campos que empiecen por "hab"
                // En el constructor de PropertyDetails de web-service.ts:
                // const totalHabitaciones = (Number(webProp.habitaciones) || 0) + (Number(webProp.habdobles) || 0);
                // Pero PropertyDetails retornado solo tiene 'habitaciones' (que es el total)

                // Para saber si son SOLO simples, necesitamos mirar el webProp crudo original
                // Pero convertToPropertyDetails no lo guarda todo.

                // Vamos a modificar temporalmente el servicio o rescatar el dato
            }
        }
    } catch (e) {
        console.error(e);
    }
}

// Para esta tarea específica, mejor vamos a mirar el listado y filtrar por lo que sabemos
// Si el usuario quiere "solo simples", significa que el campo 'habitaciones' es > 0 y 'habdobles' es 0.
// En el objeto 'webProp' crudo dentro de convertToPropertyListEntry:
// webProp.habitaciones es simples
// webProp.habdobles es dobles

// Voy a cambiar mi estrategia: usaré el cliente web directamente para ver los datos crudos.

import { createInmovillaWebClient } from '../src/lib/api/web-client';

const client = createInmovillaWebClient({
    numagencia,
    password,
    addnumagencia,
    idioma: 1,
    ip: clientIp,
    domain
});

async function runDirect() {
    console.log('Consultando API directamente...');
    const response = await client.getProperties(1, 100);
    const rawProps = response.paginacion || [];

    console.log(`Analizando ${rawProps.length} registros crudos...`);

    const coinciden = rawProps.filter((p: any) => {
        const simples = parseInt(p.habitaciones || '0');
        const dobles = parseInt(p.habdobles || '0');
        return simples > 0 && dobles === 0;
    });

    if (coinciden.length > 0) {
        console.log(`\n✅ Se han encontrado ${coinciden.length} propiedades:`);
        coinciden.forEach((p: any) => {
            console.log(`- Ref: ${p.ref} | ${p.tiponombre} en ${p.poblacion} | Simples: ${p.habitaciones} | Precio: ${p.precioinmo}€`);
        });
    } else {
        console.log('\n❌ No hay propiedades con solo habitaciones simples en esta página.');
    }
}

runDirect().catch(console.error);

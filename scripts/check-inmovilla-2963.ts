import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { createInmovillaApi } from '../src/lib/api/properties';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const TOKEN = process.env.INMOVILLA_TOKEN!;
const AUTH_TYPE = (process.env.INMOVILLA_AUTH_TYPE as 'Token' | 'Bearer') || 'Token';

async function checkInmovilla() {
    console.log('🔌 Conectando con la API de Inmovilla...');
    console.log(`   Base URL: https://procesos.inmovilla.com/api/v1`);
    console.log(`   Auth: ${AUTH_TYPE} ${TOKEN?.slice(0, 8)}...`);

    try {
        const api = createInmovillaApi(TOKEN, AUTH_TYPE);

        console.log('\n📡 Obteniendo lista de propiedades...');
        const properties = await api.getProperties({ page: 1 });

        console.log(`✅ API CONECTADA. Total recibidas: ${properties.length}`);

        // Search for ref 2963
        const found = properties.find((p: any) =>
            String(p.ref).trim() === '2963'
        );

        if (found) {
            console.log('\n🎯 REF 2963 ENCONTRADA en la API:');
            console.log(`   cod_ofer:     ${found.cod_ofer}`);
            console.log(`   ref:          ${found.ref}`);
            console.log(`   nodisponible: ${found.nodisponible}`);
            console.log(`   prospecto:    ${found.prospecto}`);
            console.log(`   tipo:         ${(found as any).tipo_nombre || found.tipo}`);
        } else {
            console.log('\n❌ REF 2963 NO ESTÁ en la respuesta de la API');

            // Show all refs sorted
            const refs = properties
                .map((p: any) => ({ ref: p.ref, cod: p.cod_ofer, disp: !p.nodisponible }))
                .sort((a: any, b: any) => a.ref.localeCompare(b.ref));

            console.log(`\n📋 Todas las refs disponibles (${refs.length}):`);
            refs.forEach((r: any) => console.log(`   REF: ${r.ref} | cod_ofer: ${r.cod} | disponible: ${r.disp}`));
        }
    } catch (err: any) {
        console.error('💥 Error:', err.message);
    }
}

checkInmovilla().catch(console.error);

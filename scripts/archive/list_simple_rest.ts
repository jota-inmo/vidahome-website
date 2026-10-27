
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function runRest() {
    const token = process.env.INMOVILLA_TOKEN;
    if (!token) {
        console.error('Falta INMOVILLA_TOKEN');
        return;
    }

    console.log('Consultando API REST (v1)...');

    // Usamos el token con el parámetro 'ia' si es necesario
    // Pero vamos a intentar una petición simple a /propiedades/
    const url = `https://procesos.inmovilla.com/api/v1/propiedades/?listado=true&ia=13031_244_ext`;

    try {
        const response = await fetch(url, {
            headers: {
                'Token': token
            }
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`Error API: ${response.status} ${response.statusText}`, errText);
            return;
        }

        const data = await response.json();
        console.log(`Recuperadas ${data.length} propiedades.`);

        // Filtramos por habitaciones
        // En la REST API v1, los campos suelen ser diferentes.
        // Vamos a inspeccionar el primer registro
        if (data.length > 0) {
            console.log('Inspeccionando campos de habitaciones...');
            const first = data[0];
            // Buscamos campos que contengan 'hab'
            const habFields = Object.keys(first).filter(k => k.toLowerCase().includes('hab'));
            console.log('Campos encontrados:', habFields);

            const coinciden = data.filter((p: any) => {
                const simples = parseInt(p.habitaciones || '0');
                const dobles = parseInt(p.habdobles || '0');
                return simples > 0 && dobles === 0;
            });

            if (coinciden.length > 0) {
                console.log(`\n✅ Encontradas ${coinciden.length} propiedades con solo simples:`);
                coinciden.slice(0, 20).forEach((p: any) => {
                    console.log(`- Ref: ${p.ref} | Simples: ${p.habitaciones} | Precio: ${p.precioinmo}€`);
                });
            } else {
                console.log('\n❌ No se encontraron propiedades con ese criterio.');
            }
        }
    } catch (e) {
        console.error('Error durante la ejecución:', e);
    }
}

runRest();

import { PropertyService } from '../lib/api/properties';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function verifyConnection() {
    const token = process.env.INMOVILLA_TOKEN;
    const authType = (process.env.INMOVILLA_AUTH_TYPE as 'Token' | 'Bearer') || 'Bearer';

    console.log('🚀 Iniciando prueba de conexión con Inmovilla API...');
    console.log(`📡 Usando tipo de auth: ${authType}`);

    if (!token || token === 'your_token_here') {
        console.error('❌ ERROR: No se ha configurado el INMOVILLA_TOKEN en el archivo .env');
        console.log('Por favor, crea un archivo .env basado en .env.example y pega tu token real.');
        process.exit(1);
    }

    const api = new PropertyService({ token, authType });

    try {
        console.log('⏳ Solicitando listado de propiedades...');
        const properties = await api.getProperties({ page: 1 });

        console.log('✅ ¡CONEXIÓN EXITOSA!');
        console.log(`📊 Se han recuperado ${properties.length} registros recientes.`);

        if (properties.length > 0) {
            console.log('\nÚltimo registro encontrado:');
            console.table([properties[0]]);
        } else {
            console.log('ℹ️ La conexión funciona pero el listado está vacío.');
        }

    } catch (error: any) {
        console.error('❌ FALLÓ LA CONEXIÓN');
        console.error(`Status: ${error.status || 'N/A'}`);
        console.error(`Mensaje: ${error.message}`);

        if (error.status === 401) {
            console.log('👉 Tip: El token es inválido o el tipo de auth (Bearer vs Token) no es el correcto.');
        } else if (error.status === 429) {
            console.log('👉 Tip: Has superado el límite de peticiones permitido por Inmovilla.');
        }
    }
}

verifyConnection();

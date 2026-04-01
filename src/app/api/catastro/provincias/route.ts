import { NextResponse } from 'next/server';
import { createCatastroClient } from '@/lib/api/catastro';

export async function GET() {
    try {
        const client = createCatastroClient();
        const provincias = await client.getProvincias();
        if (provincias.length > 0) return NextResponse.json(provincias);
    } catch (error) {
        console.error('[Catastro] Error provincias:', error);
    }
    // Fallback: todas las provincias de España (lista completa)
    return NextResponse.json([
        'A CORUÑA', 'ALACANT', 'ALBACETE', 'ALMERIA', 'ASTURIAS', 'AVILA',
        'BADAJOZ', 'BARCELONA', 'BURGOS', 'CACERES', 'CADIZ', 'CANTABRIA',
        'CASTELLO', 'CEUTA', 'CIUDAD REAL', 'CORDOBA', 'CUENCA',
        'GIRONA', 'GRANADA', 'GUADALAJARA', 'GUIPUZCOA',
        'HUELVA', 'HUESCA', 'ILLES BALEARS', 'JAEN',
        'LAS PALMAS', 'LEON', 'LLEIDA', 'LUGO',
        'MADRID', 'MALAGA', 'MELILLA', 'MURCIA', 'NAVARRA',
        'OURENSE', 'PALENCIA', 'PONTEVEDRA',
        'LA RIOJA', 'SALAMANCA', 'SANTA CRUZ DE TENERIFE', 'SEGOVIA', 'SEVILLA', 'SORIA',
        'TARRAGONA', 'TERUEL', 'TOLEDO',
        'VALENCIA', 'VALLADOLID', 'VIZCAYA', 'ZAMORA', 'ZARAGOZA',
    ]);
}

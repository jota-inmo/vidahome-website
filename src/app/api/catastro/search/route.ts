import { NextRequest, NextResponse } from 'next/server';
import { createCatastroClient } from '@/lib/api/catastro';

/**
 * API Route para buscar propiedades por dirección en el Catastro
 * POST /api/catastro/search
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { provincia, municipio, via, numero, tipoVia } = body;

        // Validar parámetros requeridos
        if (!provincia || !municipio || !via || !numero) {
            return NextResponse.json(
                { error: 'Faltan parámetros requeridos: provincia, municipio, via, numero' },
                { status: 400 }
            );
        }

        // Crear cliente y buscar
        const client = createCatastroClient();
        const result = await client.searchByAddress({
            provincia,
            municipio,
            via,
            numero,
            tipoVia
        });

        return NextResponse.json(result);

    } catch (error) {
        console.error('Error en API de búsqueda Catastro:', error);
        return NextResponse.json(
            { error: 'Error al consultar el Catastro', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

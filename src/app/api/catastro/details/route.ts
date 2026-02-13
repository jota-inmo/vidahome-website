import { NextRequest, NextResponse } from 'next/server';
import { createCatastroClient } from '@/lib/api/catastro';

/**
 * API Route para obtener detalles de una propiedad por referencia catastral
 * GET /api/catastro/details?ref=XXXXXXXXXXXXX
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const referenciaCatastral = searchParams.get('ref');

        // Validar parámetro requerido
        if (!referenciaCatastral) {
            return NextResponse.json(
                { error: 'Falta el parámetro requerido: ref (referencia catastral)' },
                { status: 400 }
            );
        }

        // Validar formato básico (14, 18 o 20 caracteres alfanuméricos)
        if (referenciaCatastral.length !== 14 && referenciaCatastral.length !== 18 && referenciaCatastral.length !== 20) {
            return NextResponse.json(
                { error: 'La referencia catastral debe tener 14, 18 o 20 caracteres' },
                { status: 400 }
            );
        }

        // Crear cliente y obtener detalles
        const client = createCatastroClient();

        let property;
        try {
            property = await client.getPropertyDetails(referenciaCatastral);
        } catch (error) {
            // Capturar errores específicos del servicio
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

            if (errorMessage.includes('no está disponible')) {
                return NextResponse.json(
                    {
                        error: 'Servicio temporalmente no disponible',
                        message: 'El servicio del Catastro no está disponible en este momento. Por favor, inténtalo más tarde.',
                        details: errorMessage
                    },
                    { status: 503 }
                );
            }

            throw error;
        }

        if (!property) {
            return NextResponse.json(
                {
                    error: 'Propiedad no encontrada',
                    message: 'No se encontró ninguna propiedad con esa referencia catastral. Verifica que sea correcta (20 caracteres).'
                },
                { status: 404 }
            );
        }

        // Calcular estimación de valor si hay valor catastral
        let estimation = null;
        if (property.valorCatastral && property.valorCatastral > 0) {
            estimation = client.estimateMarketValue(property.valorCatastral);
        }

        return NextResponse.json({
            property,
            estimation
        });

    } catch (error) {
        console.error('Error en API de detalles Catastro:', error);
        return NextResponse.json(
            {
                error: 'Error del servidor',
                message: 'Ocurrió un error al consultar el Catastro. Por favor, inténtalo de nuevo.',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { createCatastroClient } from '@/lib/api/catastro';
import { checkRateLimit } from '@/lib/rate-limit';
import { catastroSearchSchema } from '@/lib/validations';

/**
 * API Route para buscar propiedades por dirección en el Catastro
 * POST /api/catastro/search
 */
export async function POST(request: NextRequest) {
    const rate = await checkRateLimit({ key: 'catastro_search', limit: 30, windowMs: 60000 });
    if (!rate.success) {
        return NextResponse.json({ error: 'Demasiadas consultas. Espera un momento.' }, { status: 429 });
    }

    try {
        const rawBody = await request.json();
        const parsed = catastroSearchSchema.safeParse(rawBody);
        if (!parsed.success) {
            return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });
        }
        const { provincia, municipio, via, numero, tipoVia, rc } = parsed.data;

        const client = createCatastroClient();

        if (rc) {
            console.log(`[API Search] Buscando por RC: ${rc}`);
            const result = await client.searchPropertiesByRC(rc);
            return NextResponse.json(result);
        }

        // Validar parámetros requeridos para búsqueda por dirección
        if (!provincia || !municipio || !via || !numero) {
            return NextResponse.json(
                { error: 'Faltan parámetros requeridos: provincia, municipio, via, numero o rc' },
                { status: 400 }
            );
        }

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
            { error: 'Error al consultar el Catastro' },
            { status: 500 }
        );
    }
}

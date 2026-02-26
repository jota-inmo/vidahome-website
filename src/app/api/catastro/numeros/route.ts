import { NextRequest, NextResponse } from 'next/server';
import { createCatastroClient } from '@/lib/api/catastro';
import { checkRateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
    const rate = await checkRateLimit({ key: 'catastro_numeros', limit: 30, windowMs: 60000 });
    if (!rate.success) {
        return NextResponse.json({ error: 'Demasiadas consultas. Espera un momento.' }, { status: 429 });
    }
    const { searchParams } = new URL(request.url);
    const provincia = searchParams.get('provincia');
    const municipio = searchParams.get('municipio');
    const tipoVia = searchParams.get('tipoVia');
    const nomVia = searchParams.get('nomVia');
    const numero = searchParams.get('numero') || '';

    if (!provincia || !municipio || !tipoVia || !nomVia) {
        return NextResponse.json({ error: 'Faltan parámetros obligatorios' }, { status: 400 });
    }

    try {
        const client = createCatastroClient();
        const numeros = await client.getNumeros(provincia, municipio, tipoVia, nomVia, numero);
        return NextResponse.json(numeros);
    } catch (error) {
        console.error('[API Numeros] Error:', error);
        return NextResponse.json({ error: 'Error al consultar los números' }, { status: 500 });
    }
}

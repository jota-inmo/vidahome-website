import { NextRequest, NextResponse } from 'next/server';
import { createCatastroClient } from '@/lib/api/catastro';
import { checkRateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
    const rate = await checkRateLimit({ key: 'catastro_vias', limit: 30, windowMs: 60000 });
    if (!rate.success) {
        return NextResponse.json({ error: 'Demasiadas consultas. Espera un momento.' }, { status: 429 });
    }
    const { searchParams } = new URL(request.url);
    const provincia = searchParams.get('provincia');
    const municipio = searchParams.get('municipio');
    const query = searchParams.get('query') || '';

    if (!provincia || !municipio) {
        return NextResponse.json({ error: 'Provincia y Municipio son obligatorios' }, { status: 400 });
    }

    try {
        const client = createCatastroClient();
        const vias = await client.getVias(provincia, municipio, query);
        return NextResponse.json(vias);
    } catch (error) {
        console.error('[API Vias] Error:', error);
        return NextResponse.json({ error: 'Error al consultar las vías' }, { status: 500 });
    }
}

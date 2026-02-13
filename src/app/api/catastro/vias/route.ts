import { NextRequest, NextResponse } from 'next/server';
import { createCatastroClient } from '@/lib/api/catastro';

export async function GET(request: NextRequest) {
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

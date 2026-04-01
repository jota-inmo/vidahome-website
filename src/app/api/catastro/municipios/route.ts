import { NextRequest, NextResponse } from 'next/server';
import { createCatastroClient } from '@/lib/api/catastro';

export async function GET(request: NextRequest) {
    const provincia = request.nextUrl.searchParams.get('provincia');
    if (!provincia) {
        return NextResponse.json({ error: 'Falta provincia' }, { status: 400 });
    }

    try {
        const client = createCatastroClient();
        const municipios = await client.getMunicipios(provincia);
        if (municipios.length > 0) return NextResponse.json(municipios);
    } catch (error) {
        console.error('[Catastro] Error municipios:', error);
    }

    return NextResponse.json([]);
}

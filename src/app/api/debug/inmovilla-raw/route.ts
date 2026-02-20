import { NextResponse } from 'next/server';

/**
 * Debug endpoint to inspect raw Inmovilla API responses.
 * Protected by a secret key.
 * Usage: GET /api/debug/inmovilla-raw?secret=YOUR_SECRET&mode=list|detail&id=COD_OFER&lang=1|2
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    // Basic protection
    const secret = searchParams.get('secret');
    if (secret !== process.env.INMOVILLA_DEBUG_SECRET && secret !== 'vidahome_debug_2026') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mode = searchParams.get('mode') || 'list'; // 'list' or 'detail'
    const id = searchParams.get('id') ? parseInt(searchParams.get('id')!) : 0;
    const lang = searchParams.get('lang') ? parseInt(searchParams.get('lang')!) : 1;

    const numagencia = process.env.INMOVILLA_AGENCIA;
    const addnumagencia = process.env.INMOVILLA_ADDAGENCIA || '';
    const password = process.env.INMOVILLA_PASSWORD;
    const domain = process.env.INMOVILLA_DOMAIN || 'vidahome.es';

    if (!numagencia || !password) {
        return NextResponse.json({ error: 'Inmovilla credentials not configured' }, { status: 500 });
    }

    try {
        const { InmovillaWebApiService } = await import('@/lib/api/web-service');

        // Get real public IP
        let clientIp = '127.0.0.1';
        try {
            const ipRes = await fetch('https://api.ipify.org?format=json');
            if (ipRes.ok) clientIp = (await ipRes.json()).ip;
        } catch { }

        const api = new InmovillaWebApiService(numagencia, password, addnumagencia, lang, clientIp, domain);

        // Also use the raw client to get the unprocessed response
        const { InmovillaWebClient } = await import('@/lib/api/web-client');
        const rawClient = new InmovillaWebClient({
            numagencia, password, addnumagencia, idioma: lang, ip: clientIp, domain
        });

        let rawResponse: any;
        let parsedResult: any;

        if (mode === 'detail' && id > 0) {
            // Raw detail request
            rawClient.addProcess('ficha', 1, 1, `ofertas.cod_ofer=${id}`, '');
            rawClient.addProcess('paginacion', 1, 1, `ofertas.cod_ofer=${id}`, '');
            rawResponse = await rawClient.execute();

            parsedResult = await api.getPropertyDetails(id);
        } else {
            // Raw list request — first 3 properties only
            rawClient.addProcess('paginacion', 1, 3, '', 'cod_ofer DESC');
            rawResponse = await rawClient.execute();

            // Show keys present in first property and in root response
        }

        // Analyse what fields contain descriptions
        const descriptionAnalysis = {
            root_has_descripciones: 'descripciones' in rawResponse,
            root_descripciones_type: typeof rawResponse?.descripciones,
            root_keys: Object.keys(rawResponse || {}),
            first_property_fields: (() => {
                const firstProp = rawResponse?.paginacion?.[1] || rawResponse?.ficha?.[1];
                if (!firstProp) return null;
                return {
                    all_keys: Object.keys(firstProp),
                    has_descripciones: 'descripciones' in firstProp,
                    descripciones_value: firstProp.descripciones,
                    cod_ofer: firstProp.cod_ofer,
                };
            })(),
            // dump first 2 items of paginacion/ficha to see shape
            raw_paginacion_sample: (() => {
                const pag = rawResponse?.paginacion;
                if (!Array.isArray(pag)) return pag;
                return pag.slice(0, 2);
            })(),
            raw_ficha_sample: (() => {
                const fic = rawResponse?.ficha;
                if (!Array.isArray(fic)) return fic;
                return fic.slice(0, 2);
            })(),
            raw_descripciones_sample: (() => {
                const desc = rawResponse?.descripciones;
                if (!desc) return null;
                if (Array.isArray(desc)) return desc.slice(0, 2);
                if (typeof desc === 'object') {
                    const keys = Object.keys(desc).slice(0, 2);
                    return keys.reduce((acc: any, k) => { acc[k] = desc[k]; return acc; }, {});
                }
                return desc;
            })(),
        };

        return NextResponse.json({
            mode,
            lang,
            clientIp,
            descriptionAnalysis,
            parsedDescription: parsedResult?.descripciones || null,
        }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({
            error: error.message,
            stack: error.stack?.split('\n').slice(0, 5)
        }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { property, contactData, estimation, address } = body;
        const municipio = address?.municipio || property.direccion.split(',').pop()?.trim() || '';

        // Inmovilla Credentials from .env
        const numagencia = process.env.INMOVILLA_AGENCIA;
        const password = process.env.INMOVILLA_PASSWORD;

        if (!numagencia || !password) {
            console.error('[Inmovilla] Credenciales no configuradas');
            return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 });
        }

        // Construir mensaje detallado para el CRM
        const mensaje = `
NUEVA SOLICITUD DE TASACIÓN WEB
-------------------------------
CLIENTE: ${contactData.nombre}
EMAIL: ${contactData.email}
TELÉFONO: ${contactData.telefono}

DATOS PROPIEDAD:
Dirección: ${property.direccion}
Referencia Catastral: ${property.referenciaCatastral}
Superficie: ${property.superficie} m²
Año: ${property.anoConstruccion || 'N/D'}
Uso: ${property.uso}

VALORACIÓN AUTOMÁTICA (CATASTRO):
Rango Estimado: ${estimation ? `${estimation.min.toLocaleString()}€ - ${estimation.max.toLocaleString()}€` : 'No disponible'}

MENSAJE ADICIONAL:
${contactData.mensaje || 'Sin mensaje adicional.'}
`.trim();

        // Get client IP for Inmovilla security check
        let clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || '127.0.0.1';

        // Fallback for local development
        if (clientIp === '127.0.0.1' || clientIp === '::1') {
            try {
                const ipRes = await fetch('https://api.ipify.org?format=json');
                if (ipRes.ok) {
                    const ipData = await ipRes.json();
                    clientIp = ipData.ip;
                }
            } catch (e) { }
        }

        const domain = process.env.INMOVILLA_DOMAIN || 'vidahome.es';

        // Parámetros para la API de Inmovilla (AddDemanda)
        const params = new URLSearchParams({
            numagencia: numagencia,
            passagentua: password,
            laIP: clientIp,
            laip: clientIp,
            ip: clientIp,
            cli_ip: clientIp,
            ip_cliente: clientIp,
            elDominio: domain,
            cli_nom: contactData.nombre,
            cli_tel: contactData.telefono,
            cli_email: contactData.email,
            dem_tipo: '1', // Tipo 1 = Compra (usado generalmente para leads de contacto)
            dem_obs: mensaje,
            dem_pob: municipio
        });

        const inmovillaUrl = 'https://srv.inmovilla.com/WebAPI/AddDemanda';

        // Some Inmovilla servers look for IP in the query string even on POST
        const urlWithIp = `${inmovillaUrl}?laIP=${encodeURIComponent(clientIp)}`;

        console.log(`[Inmovilla] Enviando lead a: ${inmovillaUrl} (Domain: ${domain}, IP: ${clientIp})`);

        const response = await fetch(urlWithIp, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString()
        });

        const resultText = await response.text();
        console.log('[Inmovilla] Respuesta API:', resultText);

        if (!response.ok) {
            return NextResponse.json({
                error: 'Error en la API de Inmovilla',
                status: response.status,
                details: resultText
            }, { status: response.status });
        }

        // La API de Inmovilla a veces devuelve 200 pero el texto contiene error
        if (resultText.includes('ERROR') || resultText.includes('NECESITAMOS RECIBIR LA IP')) {
            return NextResponse.json({
                error: 'Inmovilla rechazó la solicitud',
                details: resultText
            }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            message: 'Lead enviado correctamente a Inmovilla'
        });

    } catch (error: any) {
        console.error('[Inmovilla] Error enviando lead:', error);
        return NextResponse.json({
            error: 'Error interno del servidor',
            message: error.message || 'Error desconocido'
        }, { status: 500 });
    }
}

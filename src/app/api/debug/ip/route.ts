import { NextRequest, NextResponse } from 'next/server';

/**
 * Debug endpoint to check what IP Inmovilla will receive.
 * ⚠️  SOLO DISPONIBLE EN DESARROLLO LOCAL.
 * En producción devuelve 404 para no exponer información de infraestructura.
 * Access: /api/debug/ip
 */
export async function GET(request: NextRequest) {
    // Guard: bloquear completamente en producción
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
            { error: 'Not found' },
            { status: 404 }
        );
    }

    try {
        // Get the IP that would be sent to Inmovilla
        const forwardedFor = request.headers.get('x-forwarded-for');
        const realIp = request.headers.get('x-real-ip');
        const clientIp = forwardedFor?.split(',')[0] || realIp || 'unknown';

        // Get the actual public IP of this server
        let serverPublicIp = 'unknown';
        try {
            const ipRes = await fetch('https://api.ipify.org?format=json');
            if (ipRes.ok) {
                const ipData = await ipRes.json();
                serverPublicIp = ipData.ip;
            }
        } catch (e) {
            console.error('Failed to fetch server public IP:', e);
        }

        return NextResponse.json({
            message: 'IP Information for Inmovilla Integration',
            clientIp: clientIp,
            serverPublicIp: serverPublicIp,
            headers: {
                'x-forwarded-for': forwardedFor,
                'x-real-ip': realIp,
            },
            instructions: {
                step1: 'Contact Inmovilla support',
                step2: `Ask them to authorize this IP: ${serverPublicIp}`,
                step3: 'If on Vercel, you may need to authorize a range of IPs',
                note: 'Vercel uses dynamic IPs. Consider using a proxy with static IP for production.'
            }
        });
    } catch (error: any) {
        return NextResponse.json({
            error: 'Failed to get IP information',
            message: error.message
        }, { status: 500 });
    }
}


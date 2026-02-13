import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { property, contactData, estimation, address } = body;
        const municipio = address?.municipio || property.direccion.split(',').pop()?.trim() || '';

        // Check for Resend API Key
        if (!process.env.RESEND_API_KEY) {
            console.error('[Mail] RESEND_API_KEY no configurada');
            return NextResponse.json({
                error: 'Error de configuración del correo',
                message: 'Falta la clave API de Resend en el servidor.'
            }, { status: 500 });
        }

        // Destinatario solicitado
        const toEmail = 'i.vidahome.13031@inmovilla.com';

        // Construir contenido del correo
        const emailContent = `
            <h2>Nueva Solicitud de Tasación Web</h2>
            <p><strong>Cliente:</strong> ${contactData.nombre}</p>
            <p><strong>Email:</strong> ${contactData.email}</p>
            <p><strong>Teléfono:</strong> ${contactData.telefono}</p>
            <br/>
            <h3>Datos de la Propiedad:</h3>
            <p><strong>Dirección:</strong> ${property.direccion}</p>
            <p><strong>Población:</strong> ${municipio}</p>
            <p><strong>Referencia Catastral:</strong> ${property.referenciaCatastral}</p>
            <p><strong>Superficie:</strong> ${property.superficie} m²</p>
            <p><strong>Año Construcción:</strong> ${property.anoConstruccion || 'N/D'}</p>
            <p><strong>Uso:</strong> ${property.uso}</p>
            <br/>
            <h3>Valoración Automática:</h3>
            <p><strong>Rango Estimado:</strong> ${estimation ? `${estimation.min.toLocaleString()}€ - ${estimation.max.toLocaleString()}€` : 'No disponible'}</p>
            <br/>
            <p><strong>Mensaje del cliente:</strong></p>
            <p>${contactData.mensaje || 'Sin mensaje adicional.'}</p>
        `;

        // Send Email via Resend
        const { data, error } = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: [toEmail],
            subject: `Tasación: ${contactData.nombre} - ${property.direccion}`,
            html: emailContent,
            replyTo: contactData.email
        });

        if (error) {
            console.error('[Resend Error]:', error);
            // Si el error es por el dominio no verificado en Resend (error común con 'from')
            if (error.name === 'validation_error' || error.message.includes('not verified')) {
                return NextResponse.json({
                    error: 'Error de envío',
                    message: 'El servidor de correo no reconoce el remitente. Asegúrate de verificar el dominio en Resend.'
                }, { status: 400 });
            }
            throw new Error(error.message);
        }

        console.log('[Mail] Solicitud enviada correctamente a Inmovilla via Email:', data?.id);

        return NextResponse.json({
            success: true,
            message: 'Solicitud enviada correctamente por email.'
        });

    } catch (error: any) {
        console.error('[Mail Error]:', error);
        return NextResponse.json({
            error: 'Error interno del servidor',
            message: error.message || 'Error desconocido al enviar el email'
        }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
    try {
        const apiKey = process.env.RESEND_API_KEY;
        const resend = new Resend(apiKey);

        const body = await request.json();
        const { property, contactData, estimation, address } = body;
        const municipio = address?.municipio || property.direccion.split(',').pop()?.trim() || '';

        // Check for Resend API Key
        if (!apiKey) {
            console.error('[Mail] RESEND_API_KEY no configurada en Vercel');
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
            from: 'Vidahome <notificaciones@vidahome.es>',
            to: [toEmail],
            subject: `Tasación: ${contactData.nombre} - ${property.direccion}`,
            html: emailContent,
            replyTo: contactData.email
        });

        if (error) {
            console.error('[Resend Error Details]:', JSON.stringify(error));
            return NextResponse.json({
                error: 'Error de Resend',
                message: error.message,
                details: error
            }, { status: 400 });
        }

        console.log('[Mail] Solicitud enviada correctamente a Inmovilla via Email:', data?.id);

        // Guardar en Supabase (Backup)
        try {
            const { supabase } = await import('@/lib/supabase');

            // Formatear mensaje con detalles de la propiedad
            const fullMessage = `SOLICITUD DE TASACIÓN\n---------------------\nMensaje del cliente: ${contactData.mensaje || 'Sin mensaje'}\n\nDETALLES PROPIEDAD:\nDirección: ${property.direccion}\nReferencia Catastral: ${property.referenciaCatastral}\nSuperficie: ${property.superficie} m²\nAño: ${property.anoConstruccion || 'N/D'}\nUso: ${property.uso}\n\nESTIMACIÓN AUTOMÁTICA:\nRango: ${estimation ? `${estimation.min.toLocaleString()}€ - ${estimation.max.toLocaleString()}€` : 'N/D'}`;

            // Intentar separar nombre y apellidos
            const nameParts = contactData.nombre.trim().split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ') || '';

            const { error: dbError } = await supabase.from('leads').insert([
                {
                    nombre: firstName,
                    apellidos: lastName, // Asumimos que la tabla tiene esta columna como en actions.ts
                    email: contactData.email,
                    telefono: contactData.telefono,
                    mensaje: fullMessage,
                    created_at: new Date().toISOString()
                    // cod_ofer no aplica aquí
                }
            ]);

            if (dbError) {
                console.error('[Supabase] Error guardando lead de tasación:', dbError);
            } else {
                console.log('[Supabase] Lead de tasación guardado correctamente');
            }

        } catch (err) {
            console.error('[Supabase] Error inesperado:', err);
        }

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

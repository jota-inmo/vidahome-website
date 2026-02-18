import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
    // ─── Rate Limiting ──────────────────────────────────────────────────────────
    const rate = await checkRateLimit({
        key: 'valuation_lead',
        limit: 5,         // 5 tasaciones
        windowMs: 3600000 // por hora
    });

    if (!rate.success) {
        return NextResponse.json({
            error: 'Límite excedido',
            message: 'Has realizado demasiadas consultas de tasación en poco tiempo. Por favor, espera una hora o contacta con nosotros.'
        }, { status: 429 });
    }

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
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                <h2 style="color: #0f172a; border-bottom: 2px solid #2dd4bf; padding-bottom: 10px;">Nueva Solicitud de Tasación Web</h2>
                
                <div style="background: #f8fafc; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
                    <p><strong>Cliente:</strong> ${contactData.nombre}</p>
                    <p><strong>Email:</strong> ${contactData.email}</p>
                    <p><strong>Teléfono:</strong> ${contactData.telefono}</p>
                </div>

                <h3 style="color: #0d9488;">📍 Datos de la Propiedad:</h3>
                <p><strong>Dirección:</strong> ${property.direccion}</p>
                <p><strong>Población:</strong> ${municipio}</p>
                <p><strong>Referencia Catastral:</strong> ${property.referenciaCatastral}</p>
                <p><strong>Superficie:</strong> ${property.superficie} m²</p>
                <p><strong>Año Construcción:</strong> ${property.anoConstruccion || 'N/D'}</p>
                <p><strong>Uso:</strong> ${property.uso}</p>

                <h3 style="color: #0d9488;">🏠 Características adicionales:</h3>
                <ul style="list-style: none; padding-left: 0;">
                    <li><strong>Habitaciones:</strong> ${property.habitaciones || '0'}</li>
                    <li><strong>Baños:</strong> ${property.banos || '0'}</li>
                    <li><strong>Aseos:</strong> ${property.aseos || '0'}</li>
                    <li><strong>Terraza:</strong> ${property.terraza ? `Sí (${property.terrazaM2 || 0} m²)` : 'No'}</li>
                    <li><strong>Reformado:</strong> ${property.reformado ? `Sí (Año: ${property.anoReforma || 'N/A'})` : 'No'}</li>
                    <li><strong>Ascensor:</strong> ${property.ascensor ? 'Sí' : 'No'}</li>
                    <li><strong>Piscina:</strong> ${property.piscina ? 'Sí' : 'No'}</li>
                    <li><strong>Jardín:</strong> ${property.jardin ? 'Sí' : 'No'}</li>
                </ul>

                <h3 style="color: #0d9488;">💰 Valoración Automática:</h3>
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 4px; text-align: center;">
                    <p style="font-size: 20px; font-weight: bold; color: #166534; margin: 0;">
                        ${estimation ? `${estimation.min.toLocaleString('es-ES')}€ - ${estimation.max.toLocaleString('es-ES')}€` : 'No disponible'}
                    </p>
                    <p style="font-size: 12px; color: #666; margin-top: 5px;">*Estimación informativa basada en Catastro</p>
                </div>

                <div style="margin-top: 20px;">
                    <p><strong>Mensaje del cliente:</strong></p>
                    <p style="background: #fdfcfb; padding: 10px; border-left: 4px solid #f97316;">${contactData.mensaje || 'Sin mensaje adicional.'}</p>
                </div>
            </div>
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

        // 3. Persist to Supabase (Backup and management)
        try {
            const { supabase } = await import('@/lib/supabase');
            await supabase.from('valuation_leads').insert([
                {
                    nombre: contactData.nombre,
                    email: contactData.email,
                    telefono: contactData.telefono,
                    direccion: property.direccion,
                    municipio: municipio,
                    provincia: address?.provincia || '',
                    referencia_catastral: property.referenciaCatastral,
                    datos_catastro: property, // Store all catastro details as JSONB
                    mensaje: contactData.mensaje,
                    created_at: new Date().toISOString()
                }
            ]);
        } catch (supaError) {
            console.warn('[Valuation] Failed to save lead to Supabase (non-critical):', supaError);
        }

        console.log('[Mail] Solicitud enviada correctamente a Inmovilla via Email:', data?.id);

        return NextResponse.json({
            success: true,
            message: 'Solicitud enviada correctamente por email y guardada en base de datos.'
        });

    } catch (error: any) {
        console.error('[Mail Error]:', error);
        return NextResponse.json({
            error: 'Error interno del servidor',
            message: error.message || 'Error desconocido al enviar el email'
        }, { status: 500 });
    }
}

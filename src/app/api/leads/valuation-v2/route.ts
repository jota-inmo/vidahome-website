import { NextRequest, NextResponse } from 'next/server';
import { LeadValuationV2 } from '@/types/sell-form';
import { checkRateLimit } from '@/lib/rate-limit';
import { escapeHtml } from '@/lib/utils/sanitize';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { z } from 'zod';

const valuationV2Schema = z.object({
  operationType: z.string().max(50).optional(),
  propertyType: z.string().max(100).optional(),
  propertyTypeOther: z.string().max(200).optional(),
  provincia: z.string().max(200).optional(),
  municipio: z.string().max(200).optional(),
  tipoVia: z.string().max(50).optional(),
  via: z.string().max(300).optional(),
  numero: z.string().max(20).optional(),
  refCatastralManual: z.string().max(20).optional(),
  habitaciones: z.union([z.string(), z.number()]).optional(),
  banos: z.union([z.string(), z.number()]).optional(),
  notasAdicionales: z.string().max(2000).optional(),
  propertyFromCatastro: z.any().optional(),
  estimation: z.object({ min: z.number(), max: z.number() }).nullable().optional(),
  nombre: z.string().min(1).max(200),
  email: z.string().email().max(320).optional().or(z.literal('')),
  telefono: z.string().min(6).max(30),
  indicativoPais: z.string().max(10).optional(),
  mensaje: z.string().max(2000).optional(),
});

export async function POST(request: NextRequest) {
  // Rate limiting — same as v1
  const rate = await checkRateLimit({
    key: 'valuation_lead',
    limit: 20,
    windowMs: 3600000,
  });

  if (!rate.success) {
    return NextResponse.json({
      error: 'Límite excedido',
      message: 'Has realizado demasiadas consultas en poco tiempo. Por favor, espera una hora.',
    }, { status: 429 });
  }

  try {
    const rawBody = await request.json();
    const parsed = valuationV2Schema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      operationType, propertyType, propertyTypeOther,
      provincia, municipio, tipoVia, via, numero,
      refCatastralManual, habitaciones, banos, notasAdicionales,
      propertyFromCatastro, estimation,
      nombre, email, telefono, indicativoPais, mensaje
    } = parsed.data;

    const supabase = supabaseAdmin;

    // Crear registro en Supabase
    const leadData = {
      operation_type: operationType || 'venta',
      property_type: propertyType || 'piso',
      property_type_other: propertyTypeOther,
      provincia: provincia || '',
      municipio: municipio || '',
      tipo_via: tipoVia || '',
      via: via || '',
      numero: numero || '',
      ref_catastral_manual: refCatastralManual,
      habitaciones: habitaciones ? Number(habitaciones) : undefined,
      banos: banos ? Number(banos) : undefined,
      notas_adicionales: notasAdicionales,
      catastro_data: propertyFromCatastro || null,
      user_name: nombre,
      user_email: email || null,
      user_phone: telefono,
      user_country_code: indicativoPais,
      user_message: mensaje,
      progress_step: 6,
      completed: true,
      estimated_value: estimation?.max ? parseFloat(estimation.max.toString()) : undefined,
      status: 'new'
    };

    const { data, error } = await supabase
      .from('leads_valuation_v2')
      .insert([leadData])
      .select()
      .single();

    if (error) {
      console.error('[API] Error inserting lead:', error);
      return NextResponse.json(
        { error: 'Error al guardar la solicitud' },
        { status: 500 }
      );
    }

    // Obtener email de notificaciones del admin
    const { data: settings } = await supabase
      .from('company_settings')
      .select('value')
      .eq('key', 'notifications_email')
      .maybeSingle();
    
    const notificationTarget = settings?.value || 'info@vidahome.es';

    // Enviar notificación al admin
    try {
      const { sendNotificationEmail } = await import('@/lib/mail');
      await sendNotificationEmail(
        notificationTarget,
        `Nueva tasación recibida: ${escapeHtml(nombre)}`,
        `
        <h2>Nueva solicitud de valoración</h2>
        <p><strong>Nombre:</strong> ${escapeHtml(nombre)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email || 'No proporcionado')}</p>
        <p><strong>Teléfono:</strong> ${escapeHtml(indicativoPais || '')} ${escapeHtml(telefono)}</p>
        <p><strong>Operación:</strong> ${escapeHtml(operationType || '')}</p>
        <p><strong>Propiedad:</strong> ${escapeHtml(propertyType || '')} ${propertyTypeOther ? `(${escapeHtml(propertyTypeOther)})` : ''}</p>
        <p><strong>Ubicación:</strong> ${escapeHtml(tipoVia || '')} ${escapeHtml(via || '')} ${escapeHtml(numero || '')}, ${escapeHtml(municipio || '')} (${escapeHtml(provincia || '')})</p>
        <p><strong>Mensaje:</strong> ${escapeHtml(mensaje || 'Sin mensaje')}</p>
        <p>---</p>
        <p>Valor estimado Catastro: ${estimation?.max ? `${estimation.max} €` : 'No disponible'}</p>
        `
      );
    } catch (mailErr) {
      console.error('[API] Error sending notification email:', mailErr);
    }

    // Enviar confirmación por email si se proporcionó
    if (email) {
      try {
        const { sendNotificationEmail } = await import('@/lib/mail');
        await sendNotificationEmail(
          email,
          'Hemos recibido tu solicitud — VidaHome Gandía',
          `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <div style="background: #1a1a2e; padding: 24px; text-align: center;">
              <h1 style="color: #fff; margin: 0; font-size: 22px;">VidaHome Gandía</h1>
            </div>
            <div style="padding: 32px 24px;">
              <h2 style="color: #1a1a2e;">Hola ${escapeHtml(nombre)},</h2>
              <p>Hemos recibido tu solicitud de valoración correctamente. Nos pondremos en contacto contigo en las próximas <strong>24-48 horas</strong>.</p>
              <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <h3 style="margin: 0 0 12px; color: #1a1a2e;">Resumen de tu solicitud</h3>
                <p style="margin: 4px 0;"><strong>Operación:</strong> ${operationType === 'sell' ? 'Vender' : 'Alquilar'}</p>
                <p style="margin: 4px 0;"><strong>Propiedad:</strong> ${escapeHtml(propertyType || '')}${propertyTypeOther ? ` (${escapeHtml(propertyTypeOther)})` : ''}</p>
                <p style="margin: 4px 0;"><strong>Ubicación:</strong> ${via ? `${escapeHtml(tipoVia || '')} ${escapeHtml(via)} ${escapeHtml(numero || '')}, ` : ''}${escapeHtml(municipio || '')} ${provincia ? `(${escapeHtml(provincia)})` : ''}</p>
                ${estimation?.max ? `<p style="margin: 4px 0;"><strong>Estimación catastral:</strong> ${Number(estimation.max).toLocaleString('es-ES')} €</p>` : ''}
              </div>
              <p>Si tienes cualquier pregunta, puedes contactarnos en <a href="mailto:info@vidahome.es" style="color: #1a1a2e;">info@vidahome.es</a> o llamarnos al <strong>+34 962 870 870</strong>.</p>
              <p style="margin-top: 32px;">Un saludo,<br><strong>El equipo de VidaHome Gandía</strong></p>
            </div>
            <div style="background: #f0f0f0; padding: 16px; text-align: center; font-size: 12px; color: #666;">
              VidaHome Gandía S.L. · Gandía, Valencia · <a href="https://vidahome.es" style="color: #666;">vidahome.es</a>
            </div>
          </div>
          `
        );
      } catch (mailErr) {
        console.error('[API] Error sending confirmation email to client:', mailErr);
      }
    }

    return NextResponse.json(
      {
        success: true,
        leadId: data.id,
        message: 'Solicitud recibida correctamente'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

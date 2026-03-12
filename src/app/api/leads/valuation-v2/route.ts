import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { LeadValuationV2 } from '@/types/sell-form';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, serviceRoleKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      operationType,
      propertyType,
      propertyTypeOther,
      provincia,
      municipio,
      tipoVia,
      via,
      numero,
      refCatastralManual,
      habitaciones,
      banos,
      notasAdicionales,
      propertyFromCatastro,
      estimation,
      nombre,
      email,
      telefono,
      indicativoPais,
      mensaje
    } = body;

    // Validaciones básicas
    if (!nombre || !telefono) {
      return NextResponse.json(
        { error: 'Nombre y teléfono son requeridos' },
        { status: 400 }
      );
    }

    // Crear registro en Supabase
    const leadData: LeadValuationV2 = {
      operation_type: operationType,
      property_type: propertyType,
      property_type_other: propertyTypeOther,
      provincia,
      municipio,
      tipo_via: tipoVia,
      via,
      numero,
      ref_catastral_manual: refCatastralManual,
      habitaciones,
      banos,
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
        `Nueva tasación recibida: ${nombre}`,
        `
        <h2>Nueva solicitud de valoración</h2>
        <p><strong>Nombre:</strong> ${nombre}</p>
        <p><strong>Email:</strong> ${email || 'No proporcionado'}</p>
        <p><strong>Teléfono:</strong> ${indicativoPais} ${telefono}</p>
        <p><strong>Operación:</strong> ${operationType}</p>
        <p><strong>Propiedad:</strong> ${propertyType} ${propertyTypeOther ? `(${propertyTypeOther})` : ''}</p>
        <p><strong>Ubicación:</strong> ${tipoVia} ${via} ${numero}, ${municipio} (${provincia})</p>
        <p><strong>Mensaje:</strong> ${mensaje || 'Sin mensaje'}</p>
        <p>---</p>
        <p>Valor estimado Catastro: ${estimation?.max ? `${estimation.max} €` : 'No disponible'}</p>
        `
      );
    } catch (mailErr) {
      console.error('[API] Error sending notification email:', mailErr);
    }

    // Enviar confirmación por email si se proporcionó
    if (email) {
      // TODO: Implementar envío de email de confirmación al cliente
      console.log('[API] Would send confirmation email to:', email);
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

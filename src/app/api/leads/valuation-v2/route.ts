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
      pisoPlanta,
      puerta,
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
      piso_planta: pisoPlanta,
      puerta,
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

    // Aquí podrías enviar email, crear tarea en CRM, etc.
    console.log('[API] New lead created:', data.id);

    // Enviar confirmación por email si se proporcionó
    if (email) {
      // TODO: Implementar envío de email
      console.log('[API] Would send email to:', email);
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

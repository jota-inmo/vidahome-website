import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const propertyId = Number(body.propertyId);
    const translations = body.translations || {};

    if (!propertyId) return NextResponse.json({ success: false, error: 'Invalid propertyId' }, { status: 400 });

    // Fetch existing descriptions
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('property_metadata')
      .select('descriptions')
      .eq('cod_ofer', propertyId)
      .single();

    if (fetchError) return NextResponse.json({ success: false, error: fetchError.message }, { status: 400 });

    const updatedDescriptions = {
      ...(existing?.descriptions || {}),
      ...translations,
    };

    const { error: updateError } = await supabaseAdmin
      .from('property_metadata')
      .update({ descriptions: updatedDescriptions })
      .eq('cod_ofer', propertyId);

    if (updateError) return NextResponse.json({ success: false, error: updateError.message }, { status: 400 });

    // Log manual update
    await supabaseAdmin.from('translation_log').insert({
      property_id: String(propertyId),
      status: 'success',
      source_language: 'manual_edit',
      target_languages: Object.keys(translations).map(k => k.replace('description_', '')),
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

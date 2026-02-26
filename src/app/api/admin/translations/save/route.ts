import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from '@/lib/auth';
import { translationsSaveSchema } from '@/lib/validations';

export async function POST(req: Request) {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const rawBody = await req.json();
    const parsed = translationsSaveSchema.safeParse(rawBody);
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });
    const { propertyId, translations } = parsed.data;

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

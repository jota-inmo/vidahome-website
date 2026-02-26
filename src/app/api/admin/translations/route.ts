import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";
import { requireAdmin } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Step 1: Reuse the same fetcher as the catalog
    const { fetchPropertiesAction } = await import('@/app/actions/inmovilla');
    const result = await fetchPropertiesAction();
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch properties' },
        { status: 400 }
      );
    }

    let properties = result.data || [];

    // Step 2: Enrich with Supabase full_data (for ref and other metadata)
    const { data: metadata } = await supabaseAdmin
      .from('property_metadata')
      .select('cod_ofer, descriptions, full_data, ref');

    if (metadata && metadata.length > 0) {
      properties = properties.map((p: any) => {
        const meta = metadata.find((m: any) => m.cod_ofer === p.cod_ofer);
        if (!meta) return p;

        const descriptions = meta.descriptions as Record<string, string> || {};
        const ref = meta.ref || (meta.full_data as any)?.ref || p.ref;

        return {
          ...p,
          ref,
          descriptions,
          description_es: descriptions.description_es || descriptions.descripciones || p.descripciones || '',
          description_en: descriptions.description_en || '',
          description_fr: descriptions.description_fr || '',
          description_de: descriptions.description_de || '',
          description_it: descriptions.description_it || '',
          description_pl: descriptions.description_pl || '',
        };
      });
    }

    return NextResponse.json(properties);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

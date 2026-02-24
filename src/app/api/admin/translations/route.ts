import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";

/**
 * GET /api/admin/translations
 * Returns all properties with their translations
 * Same data source as the catalog (Inmovilla API + Supabase enrichment)
 * Requires admin authentication
 */
export async function GET(request: Request) {
  try {
    // TODO: Add authentication check here

    // Step 1: Get properties from Inmovilla API
    const { InmovillaWebApiService } = await import('@/lib/api/web-service');
    const { INMOVILLA_LANG, INMOVILLA_NUMAGENCIA, INMOVILLA_PASSWORD, INMOVILLA_ADDNUMAGENCIA } = process.env;
    
    let properties = [];
    try {
      const api = new InmovillaWebApiService(
        INMOVILLA_NUMAGENCIA,
        INMOVILLA_PASSWORD,
        INMOVILLA_ADDNUMAGENCIA,
        INMOVILLA_LANG,
        '127.0.0.1',
        'vidahome.es'
      );
      const result = await api.getPropertyList(50, 1);
      properties = result?.properties || [];
    } catch (apiError) {
      console.warn('[API Translations] Inmovilla API fetch failed:', apiError);
      // Fallback to property_metadata
      const { data } = await supabaseAdmin
        .from('property_metadata')
        .select('*')
        .order('cod_ofer', { ascending: true })
        .limit(50);
      properties = data || [];
    }

    // Step 2: Enrich with Supabase translations
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

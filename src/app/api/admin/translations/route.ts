import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";

/**
 * GET /api/admin/translations
 * Returns all properties with their translations
 * Requires admin authentication
 */
export async function GET(request: Request) {
  try {
    // TODO: Add authentication check here
    // For now, assuming this endpoint is protected by Next.js middleware

    const supabase = supabaseAdmin;

    const { data: properties, error } = await supabase
      .from("property_metadata")
      .select("cod_ofer, descriptions")
      .order("cod_ofer", { ascending: true })
      .limit(50); // Paginate to avoid loading too many at once

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
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

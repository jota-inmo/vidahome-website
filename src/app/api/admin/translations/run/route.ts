import { NextResponse } from "next/server";
import { translatePropertiesAction } from "@/app/actions/translate-perplexity";
import { requireAdmin } from '@/lib/auth';
import { translationsRunSchema } from '@/lib/validations';

export async function POST(req: Request) {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const rawBody = await req.json().catch(() => ({}));
    const parsed = translationsRunSchema.safeParse(rawBody);
    if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });
    const property_ids = parsed.data.property_ids?.map(String);
    const batch_size = parsed.data.batch_size;

    const result = await translatePropertiesAction(property_ids, batch_size || 10);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

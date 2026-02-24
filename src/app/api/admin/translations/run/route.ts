import { NextResponse } from "next/server";
import { translatePropertiesAction } from "@/app/actions/translate-perplexity";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const property_ids = body.property_ids as string[] | undefined;
    const batch_size = body.batch_size as number | undefined;

    const result = await translatePropertiesAction(property_ids, batch_size || 10);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

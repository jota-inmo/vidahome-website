import { translateHeroAction } from '@/app/actions/translate-hero';

export async function POST(req: Request) {
  try {
    const result = await translateHeroAction();
    return Response.json(result);
  } catch (error: any) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

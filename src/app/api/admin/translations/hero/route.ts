import { translateHeroAction } from '@/app/actions/translate-hero';
import { requireAdmin } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    if (!(await requireAdmin())) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const result = await translateHeroAction();
    return Response.json(result);
  } catch (error: any) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

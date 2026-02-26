import { translateBlogPostAction } from '@/app/actions/translate-blog';
import { requireAdmin } from '@/lib/auth';
import { translationsBlogSchema } from '@/lib/validations';

export async function POST(req: Request) {
  try {
    if (!(await requireAdmin())) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const rawBody = await req.json();
    const parsed = translationsBlogSchema.safeParse(rawBody);
    if (!parsed.success) return Response.json({ success: false, error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });
    const result = await translateBlogPostAction(parsed.data.postIds?.map(String));
    return Response.json(result);
  } catch (error: any) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

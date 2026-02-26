import { translateBlogPostAction } from '@/app/actions/translate-blog';
import { requireAdmin } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    if (!(await requireAdmin())) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const result = await translateBlogPostAction(body.postIds);
    return Response.json(result);
  } catch (error: any) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

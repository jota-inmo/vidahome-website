import { translateBlogPostAction } from '@/app/actions/translate-blog';

export async function POST(req: Request) {
  try {
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

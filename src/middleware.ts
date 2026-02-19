import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const session = request.cookies.get('admin_session');
    const pathname = request.nextUrl.pathname;
    const isLoginPage = pathname === '/admin/login';
    const isAdminPage = pathname.startsWith('/admin');

    if (isAdminPage && !isLoginPage && !session) {
        return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    if (isLoginPage && session) {
        return NextResponse.redirect(new URL('/admin', request.url));
    }

    return NextResponse.next();
}

export const config = {
    // Protege /admin/* (incluye /admin/hero y /admin/featured)
    matcher: ['/admin/:path*'],
};

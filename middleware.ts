import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJwt } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  // Only protect /admin and /api/admin routes for now
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isApiAdminRoute = request.nextUrl.pathname.startsWith('/api/admin');

  if (!isAdminRoute && !isApiAdminRoute) {
    return NextResponse.next();
  }

  // Allow access to login page
  if (request.nextUrl.pathname === '/admin/login') {
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value;

  if (!token) {
    if (isApiAdminRoute) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  const payload = await verifyJwt(token);

  if (!payload) {
    if (isApiAdminRoute) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL('/admin/login', request.url));
    response.cookies.delete('token');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};

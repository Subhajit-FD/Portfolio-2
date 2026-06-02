import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // 1. Get the session/token (Better Auth stores it as better-auth.session_token)
  // On HTTPS (production), the cookie name is __Secure-better-auth.session_token (capital S)
  const token = request.cookies.get('better-auth.session_token')?.value ||
                request.cookies.get('__Secure-better-auth.session_token')?.value; 
  const { pathname } = request.nextUrl;

  // 2. Define your logic conditions
  const isLoggedIn = !!token;
  const isAdminRoute = pathname.startsWith('/admin');
  const isAdminAuthRoute = pathname === '/admin/login' || pathname === '/admin/register';

  // Case 1: Trying to access admin pages WITHOUT being logged in
  if (isAdminRoute && !isLoggedIn && !isAdminAuthRoute) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // Case 2: Already logged in, trying to access the login/register page
  if (isAdminAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // Allow the request to proceed normally if no conditions match
  return NextResponse.next();
}

// 3. Configure which routes this proxy should run on
export const config = {
  matcher: ['/admin/:path*'],
};
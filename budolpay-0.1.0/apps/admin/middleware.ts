import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('budolpay_token')?.value;
  const { pathname } = request.nextUrl;

  // Define public paths that don't require authentication
  const isPublicPath = pathname === '/login' || pathname.startsWith('/api/auth') || pathname.startsWith('/_next') || pathname.includes('.');

  if (!token && !isPublicPath) {
    console.log('[Middleware] No token found, redirecting to login. Path:', pathname);
    // Redirect to login if no token and not on a public path
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && pathname === '/login') {
    console.log('[Middleware] Token found on login page, redirecting to dashboard');
    // Redirect to dashboard if token exists and on login page
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/session';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('session_token')?.value;
  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  const isPublicPath = pathname.startsWith('/login') || 
                      pathname.startsWith('/register') || 
                      pathname === '/';

  if (!token && !isPublicPath) {
    // Redirect to login if not authenticated and trying to access protected route
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token && isPublicPath && pathname !== '/') {
    // Redirect to dashboard if authenticated and trying to access login/register
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (token && !isPublicPath) {
    // Verify session for protected routes
    const userId = verifySession(token);
    if (!userId) {
      // Invalid session, clear cookie and redirect to login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('session_token');
      return response;
    }

    // Add userId to headers for API routes to use
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', userId);
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
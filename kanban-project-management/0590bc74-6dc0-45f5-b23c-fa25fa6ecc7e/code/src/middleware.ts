/**
 * Middleware for authentication and route protection
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from './lib/auth';

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/register', '/'];
const AUTH_ROUTES = ['/login', '/register'];

// API routes that don't require authentication
const PUBLIC_API_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await getSession();

  // Check if it's an API route
  const isApiRoute = pathname.startsWith('/api/');
  
  // Check if it's a public route
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`));
  const isAuthRoute = AUTH_ROUTES.includes(pathname);
  const isPublicApiRoute = PUBLIC_API_ROUTES.some(route => pathname === route);

  // Handle API routes
  if (isApiRoute) {
    // Allow public API routes
    if (isPublicApiRoute) {
      return NextResponse.next();
    }

    // Require authentication for protected API routes
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.next();
  }

  // Handle page routes
  if (isAuthRoute) {
    // Redirect authenticated users away from auth pages
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Require authentication for protected pages
  if (!isPublicRoute && !session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
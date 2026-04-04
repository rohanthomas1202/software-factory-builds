import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';

// Public paths that don't require authentication
const publicPaths = [
  '/login',
  '/register',
  '/invoice',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
];

// API paths that require authentication
const protectedApiPaths = [
  '/api/clients',
  '/api/invoices',
  '/api/expenses',
  '/api/dashboard',
  '/api/reports',
  '/api/settings',
];

// Check if a path is public
function isPublicPath(path: string): boolean {
  return publicPaths.some(publicPath => 
    path === publicPath || 
    path.startsWith(`${publicPath}/`) ||
    // Public invoice viewing
    path.startsWith('/invoice/') ||
    // Public API auth endpoints
    path.startsWith('/api/auth/')
  );
}

// Check if a path is a protected API endpoint
function isProtectedApiPath(path: string): boolean {
  return protectedApiPaths.some(apiPath => 
    path === apiPath || 
    path.startsWith(`${apiPath}/`)
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api/health')
  ) {
    return NextResponse.next();
  }
  
  // Get session
  const session = await getSession();
  
  // Handle public paths
  if (isPublicPath(pathname)) {
    // If user is logged in and trying to access auth pages, redirect to dashboard
    if (session && (pathname === '/login' || pathname === '/register')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }
  
  // Handle protected API endpoints
  if (isProtectedApiPath(pathname)) {
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }
  
  // Handle dashboard and other protected pages
  if (!session) {
    // Redirect to login page
    const loginUrl = new URL('/login', request.url);
    // Add redirect URL as query parameter
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // User is authenticated, allow access
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
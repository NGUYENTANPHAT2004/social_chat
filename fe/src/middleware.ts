// src/middleware.ts - Fixed for localStorage auth
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes
const protectedRoutes = ['/dashboard', '/profile', '/users'];
const authRoutes = ['/login', '/register', '/auth/login', '/auth/register'];
const publicRoutes = ['/', '/about', '/contact', '/terms', '/privacy'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow access to public routes
  if (publicRoutes.includes(pathname) || pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Check if the current path is an auth route
  const isAuthRoute = authRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  );

  // For protected routes, let client-side AuthGuard handle the authentication
  // Middleware should only handle very basic routing
  if (isProtectedRoute) {
    // Let the request continue - AuthGuard will handle auth check client-side
    return NextResponse.next();
  }

  // For auth routes, also let client-side handle it
  // because we need to check localStorage which isn't available in middleware
  if (isAuthRoute) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};
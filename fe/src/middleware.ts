import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define route patterns
const AUTH_ROUTES = ['/auth/login', '/auth/register', '/auth/forgot-password'];
const PUBLIC_ROUTES = ['/', '/about', '/contact', '/terms', '/privacy'];
const PROTECTED_ROUTES = ['/dashboard', '/profile', '/games', '/chat', '/rooms'];

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(route => pathname.startsWith(route));
}

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.includes(pathname);
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
}

function isStaticAsset(pathname: string): boolean {
  return pathname.startsWith('/_next') || 
         pathname.startsWith('/static') || 
         pathname.includes('.') || 
         pathname.startsWith('/api');
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static assets and API routes
  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  // Handle OAuth callback routes
  if (pathname.startsWith('/auth/google/callback') || pathname.startsWith('/auth/facebook/callback')) {
    // Extract tokens from URL parameters and redirect to home with tokens
    const url = request.nextUrl.clone();
    const token = url.searchParams.get('token');
    const refreshToken = url.searchParams.get('refreshToken');
    const user = url.searchParams.get('user');
    
    if (token && refreshToken) {
      url.pathname = '/auth/login';
      url.searchParams.set('token', token);
      url.searchParams.set('refreshToken', refreshToken);
      if (user) url.searchParams.set('user', user);
      return NextResponse.redirect(url);
    }
  }

  const token = request.cookies.get('token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');

  // Check if user is authenticated
  const isAuthenticated = !!token;

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && isAuthRoute(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Redirect unauthenticated users to login for protected routes
  if (!isAuthenticated && isProtectedRoute(pathname)) {
    const loginUrl = new URL('/auth/login', request.url);
    // Add redirect parameter to return to original page after login
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Allow access to public routes regardless of auth status
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Default behavior - allow the request to continue
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
     * - public assets (images, etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
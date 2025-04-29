import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Since we're bypassing login/register, directly return next response to allow all requests
  return NextResponse.next();
  
  // Disabled authentication checks
  /*
  // Check if user is authenticated based on token in cookies
  const isAuthenticated = request.cookies.has('token') 
  
  // Define auth pages that don't require authentication
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                    request.nextUrl.pathname.startsWith('/register')
  
  // Define protected routes
  const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard')
  
  // If trying to access protected route without authentication, redirect to login
  if (!isAuthenticated && isDashboardPage) {
    const loginUrl = new URL('/login', request.url)
    // Add a redirect reason to avoid potential loops
    loginUrl.searchParams.set('redirectReason', 'unauthenticated')
    return NextResponse.redirect(loginUrl)
  }

  // If already authenticated and trying to access auth pages, redirect to dashboard
  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
  */
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/register',
  ],
} 
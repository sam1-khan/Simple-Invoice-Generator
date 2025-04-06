// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password', // Will match /reset-password/[user]/[token]
  '/_next', // Static files
  '/favicon.ico'
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Immediately allow public routes and static files
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // 2. Check for auth cookie (brute-force check)
  const hasAuthCookie = request.cookies.get('sessionid') || 
                       request.cookies.get('csrftoken') ||
                       request.cookies.get('auth_token') // Add any other auth cookies you use

  // 3. If no auth cookie, redirect to login
  if (!hasAuthCookie) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 4. For onboarding flow - let the client handle it
  // (Client-side will verify is_onboarded and redirect if needed)
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api routes
     * - static files
     * - images
     * - favicon
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
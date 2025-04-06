// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password'
]

// Onboarding route
const ONBOARDING_ROUTE = '/onboarding'

// Skip middleware for these paths
const SKIP_MIDDLEWARE_PATHS = [
  '/_next',
  '/static',
  '/favicon.ico',
  '/sitemap.xml',
  '/robots.txt',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files and Next.js internals
  if (SKIP_MIDDLEWARE_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Check if current route is public
  const isPublic = PUBLIC_ROUTES.some(route => 
    pathname.startsWith(route) ||
    pathname.match(/^\/reset-password\/[^/]+\/[^/]+$/) // reset-password/[id]/[token]
  )

  // Get session cookie
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('sessionid') || 
                       cookieStore.get('next-auth.session-token')

  // Handle public routes
  if (isPublic) {
    if (sessionCookie) {
      // Authenticated users trying to access public routes get redirected home
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // If no session and not public route, redirect to login
  if (!sessionCookie) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Fetch current user data from your API
  let isOnboarded = false;
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/current-user/`,
      {
        credentials: 'include',
        headers: {
          Cookie: `sessionid=${sessionCookie.value}`
        }
      }
    )

    if (response.ok) {
      const user = await response.json()
      isOnboarded = user.is_onboarded
    } else {
      // If API fails, clear session and redirect to login
      const loginUrl = new URL('/login', request.url)
      const response = NextResponse.redirect(loginUrl)
      response.cookies.delete('sessionid')
      return response
    }
  } catch (error) {
    console.error('Failed to fetch user data:', error)
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Handle onboarding restrictions
  if (!isOnboarded && !pathname.startsWith(ONBOARDING_ROUTE)) {
    return NextResponse.redirect(new URL(ONBOARDING_ROUTE, request.url))
  }

  if (isOnboarded && pathname.startsWith(ONBOARDING_ROUTE)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // All checks passed - continue with request
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public routes (handled in middleware)
     * - image files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password', // Will match /reset-password/[user]/[token]
]

const ONBOARDING_ROUTE = '/onboarding'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const authToken = request.cookies.get('sessionid') || request.cookies.get('csrftoken')

  // Handle public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    // Redirect authenticated users away from auth pages
    if (authToken && (pathname.startsWith('/login') || pathname.startsWith('/signup'))) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // Check authentication for protected routes
  if (!authToken) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // For authenticated users, check onboarding status
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/current-user/`, {
      credentials: 'include',
      headers: {
        Cookie: request.headers.get('Cookie') || '',
      },
    })

    if (response.ok) {
      const user = await response.json()
      
      // User hasn't completed onboarding
      if (!user.is_onboarded) {
        if (!pathname.startsWith(ONBOARDING_ROUTE)) {
          return NextResponse.redirect(new URL(ONBOARDING_ROUTE, request.url))
        }
      } 
      // User has completed onboarding but trying to access onboarding page
      else if (pathname.startsWith(ONBOARDING_ROUTE)) {
        return NextResponse.redirect(new URL('/', request.url))
      }
    }
  } catch (error) {
    console.error('Error fetching user data:', error)
    // If there's an error, allow the request but the client-side can handle it
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
import { type NextRequest, NextResponse } from "next/server";

const publicRoutes = ['/login', '/signup', '/forgot-password', 'reset-password']
const onboardingRoute = '/onboarding'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || (route.includes("[") &&
    pathname.startsWith(route.split("[")[0]))
  )

  const isOnboardingRoute = pathname === onboardingRoute

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || ""
    const response = await fetch(`${apiUrl}/api/v1/auth/current-user/`, {
      headers: {
        cookie: request.headers.get("cookie") || "",
      }
    })
    if (response.ok) {
      const user = await response.json()
      const isOnboarded = user.is_onboarded

      if (!isOnboarded) {
        if (isOnboardingRoute) {
          return NextResponse.next()
        }

        if (!isPublicRoute) {
          return NextResponse.redirect(new URL(onboardingRoute, request.url))
        }
      }

      if (isOnboarded) {
        if (isOnboardingRoute) {
          return NextResponse.redirect(new URL("/", request.url))
        }

        if (isPublicRoute) {
          return NextResponse.redirect(new URL("/", request.url))
        }
      } 

      return NextResponse.next()
    } else {

      if (!isPublicRoute) {
        return NextResponse.redirect(new URL("/login", request.url))
      }

      return NextResponse.next()
    }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Middleware error:", error)

    if (!isPublicRoute) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",  
  ]
}
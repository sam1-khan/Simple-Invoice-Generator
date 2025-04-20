import { type NextRequest, NextResponse } from "next/server"

// Define public routes that don't require authentication
const publicRoutes = ["/login", "/signup", "/forgot-password", "/reset-password"]
// Special route that requires authentication but has special conditions
const onboardingRoute = "/onboarding"

// Debug function to help troubleshoot authentication issues
function debugAuthInfo(info: any) {
  console.log("[Auth Middleware Debug]", JSON.stringify(info, null, 2))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the current path is a public route or starts with a public route pattern
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || (route.includes("[") && pathname.startsWith(route.split("[")[0])),
  )

  // Check if the current path is the onboarding route
  const isOnboardingRoute = pathname === onboardingRoute

  // For API routes, always proceed without redirection
  if (pathname.startsWith("/api")) {
    return NextResponse.next()
  }

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || ""

    // Debug the request cookies being sent
    debugAuthInfo({
      message: "Sending cookies to API",
      cookies: request.headers.get("cookie"),
    })

    // Make the request to check authentication status
    const response = await fetch(`${apiUrl}/api/v1/auth/current-user/`, {
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
      credentials: "include", // Important for cross-domain requests
    })

    // Debug the response status
    debugAuthInfo({
      message: "Auth API response",
      status: response.status,
      ok: response.ok,
    })

    if (response.ok) {
      // User is authenticated
      const user = await response.json()
      const isOnboarded = user.is_onboarded

      // Debug the user info
      debugAuthInfo({
        message: "Authenticated user",
        user: {
          id: user.id,
          isOnboarded: isOnboarded,
        },
      })

      // Case 1: User is authenticated but not onboarded
      if (!isOnboarded) {
        // If trying to access onboarding, allow it
        if (isOnboardingRoute) {
          return NextResponse.next()
        }

        // If trying to access any other non-public route, redirect to onboarding
        if (!isPublicRoute) {
          debugAuthInfo({
            message: "Redirecting to onboarding",
            from: pathname,
            reason: "User not onboarded",
          })
          return NextResponse.redirect(new URL(onboardingRoute, request.url))
        }
      }

      // Case 2: User is authenticated and onboarded
      if (isOnboarded) {
        // If trying to access onboarding, redirect to dashboard
        if (isOnboardingRoute) {
          debugAuthInfo({
            message: "Redirecting from onboarding to dashboard",
            reason: "User already onboarded",
          })
          return NextResponse.redirect(new URL("/", request.url))
        }

        // If trying to access public routes, redirect to dashboard
        if (isPublicRoute) {
          debugAuthInfo({
            message: "Redirecting from public route to dashboard",
            from: pathname,
            reason: "User already authenticated",
          })
          return NextResponse.redirect(new URL("/", request.url))
        }
      }

      // For all other cases, proceed normally
      return NextResponse.next()
    } else {
      // User is not authenticated
      debugAuthInfo({
        message: "Authentication failed",
        status: response.status,
      })

      // If trying to access a protected route (not public), redirect to login
      if (!isPublicRoute) {
        debugAuthInfo({
          message: "Redirecting to login",
          from: pathname,
          reason: "Protected route, user not authenticated",
        })
        return NextResponse.redirect(new URL("/login", request.url))
      }

      // For public routes, proceed normally
      return NextResponse.next()
    }
  } catch (error) {
    console.error("Middleware error:", error)
    debugAuthInfo({
      message: "Middleware error",
      error: error instanceof Error ? error.message : String(error),
    })

    // In case of error, assume user is not authenticated
    // If trying to access a protected route, redirect to login
    if (!isPublicRoute) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    // For public routes, proceed normally
    return NextResponse.next()
  }
}

// Configure which paths middleware will run on
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
  ],
}

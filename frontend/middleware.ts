import { NextResponse, NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const publicRoutes = ["/login", "/signup", "/forgot-password"];
  const resetPasswordRegex = /^\/reset-password\/[^\/]+\/[^\/]+$/;
  const onboardingRoute = "/onboarding"; // Add the onboarding route

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/current-user/`,
      {
        credentials: "include",
        headers: {
          Cookie: request.headers.get("Cookie") || "",
        },
      }
    );

    if (!response.ok) {
      // Allow access to public routes for unauthenticated users
      if (
        publicRoutes.includes(request.nextUrl.pathname) ||
        resetPasswordRegex.test(request.nextUrl.pathname)
      ) {
        return NextResponse.next();
      }

      // Redirect unauthenticated users to /login
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    const user = await response.json();

    // Prevent authenticated users from accessing public routes
    if (
      publicRoutes.includes(request.nextUrl.pathname) ||
      resetPasswordRegex.test(request.nextUrl.pathname)
    ) {
      const homeUrl = new URL("/", request.url);
      return NextResponse.redirect(homeUrl);
    }

    // Force non-onboarded users to the onboarding page
    if (!user.is_onboarded && request.nextUrl.pathname !== onboardingRoute && !user.is_staff) {
      const onboardingUrl = new URL(onboardingRoute, request.url);
      return NextResponse.redirect(onboardingUrl);
    }

    // Prevent onboarded users from accessing the onboarding page
    if (user.is_onboarded && request.nextUrl.pathname === onboardingRoute) {
      // Get the referer (previous page) from the request headers
      const referer = request.headers.get("referer");

      // If there's a referer, redirect back to it
      if (referer) {
        const refererUrl = new URL(referer);
        return NextResponse.redirect(refererUrl);
      }

      // If no referer, redirect to the home page as a fallback
      const homeUrl = new URL("/", request.url);
      return NextResponse.redirect(homeUrl);
    }

    // Allow access to other routes for authenticated and onboarded users
    return NextResponse.next();
  } catch (err) {
    console.error("Error fetching current user in middleware:", err);

    // Redirect to /login if there's an error
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|fonts/).*)",
  ],
};
import { NextResponse, NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const publicRoutes = ["/login", "/signup", "/forgot-password"];
  const resetPasswordRegex = /^\/reset-password\/[^\/]+\/[^\/]+$/;
  const onboardingRoute = "/onboarding";
  const authApiUrl = new URL(
    "/api/v1/auth/current-user/",
    process.env.NEXT_PUBLIC_API_URL
  ).toString();

  try {
    // Get cookies from the incoming request
    const cookies = request.cookies.toString();
    
    const response = await fetch(authApiUrl, { 
      headers: {
        Cookie: cookies
      },
      credentials: "include",
    });

    if (!response.ok) {
      // Allow public routes
      if (
        publicRoutes.includes(request.nextUrl.pathname) ||
        resetPasswordRegex.test(request.nextUrl.pathname)
      ) {
        return NextResponse.next();
      }

      // Redirect to login with return URL
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    const user = await response.json();

    // Block authenticated users from public routes
    if (
      publicRoutes.includes(request.nextUrl.pathname) ||
      resetPasswordRegex.test(request.nextUrl.pathname)
    ) {
      const redirectUrl = new URL("/", request.url);
      const response = NextResponse.redirect(redirectUrl);
      return response;
    }

    // Handle onboarding flow
    if (!user.is_onboarded && !user.is_staff) {
      if (!request.nextUrl.pathname.startsWith(onboardingRoute)) {
        const onboardingUrl = new URL(onboardingRoute, request.url);
        const response = NextResponse.redirect(onboardingUrl);
        return response;
      }
    } else if (user.is_onboarded && request.nextUrl.pathname === onboardingRoute) {
      const homeUrl = new URL("/", request.url);
      const response = NextResponse.redirect(homeUrl);
      return response;
    }

    return NextResponse.next();
  } catch (err) {
    console.error("Middleware auth error:", err);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|fonts/|api/auth).*)",
  ],
};
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_ROUTES = ["/login", "/sign-up", "/register", "/forgot-password", "/reset-password"];
const PROTECTED_ROUTES = ["/dashboard"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("shortlink_access_token")?.value;
  const refreshToken = request.cookies.get("shortlink_refresh_token")?.value;
  const isAuthenticated = Boolean(accessToken || refreshToken);

  // 1. If user is already authenticated, block access to auth/guest routes and redirect to /dashboard
  if (isAuthenticated && AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 2. If user is not authenticated and attempts to access protected routes, redirect to /login
  if (!isAuthenticated && PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/sign-up",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/dashboard/:path*",
  ],
};


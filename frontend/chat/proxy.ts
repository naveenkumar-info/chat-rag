import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/",
]);

const isDashboardRoute = createRouteMatcher(["/dashboard(.*)"]);
const isHomeRoute = createRouteMatcher(["/"]);
const isLoginRoute = createRouteMatcher(["/log-in(.*)"]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { userId, sessionClaims } = await auth();
  const publicMetadata = (sessionClaims?.publicMetadata as any) || {};
  const userRole = publicMetadata.role;

  // If user is already logged in and hits /log-in, redirect to their home
  if (isLoginRoute(req) && userId) {
    if (userRole === "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    if (userRole === "user") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Allow public routes (login, signup, etc.)
  if (!isProtectedRoute(req)) {
    return NextResponse.next();
  }

  // Check if user is authenticated
  if (!userId) {
    return NextResponse.redirect(new URL("/log-in", req.url));
  }

  // Dashboard is admin-only
  if (isDashboardRoute(req) && userRole !== "admin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Home page is user-only
  if (isHomeRoute(req) && userRole !== "user") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/',
  ],
};
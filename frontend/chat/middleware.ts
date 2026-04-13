import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/",
]);

const isDashboardRoute = createRouteMatcher(["/dashboard(.*)"]);
const isHomeRoute = createRouteMatcher(["^/$"]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { userId, sessionClaims } = await auth();
  
  // Allow public routes (login, signup, etc.)
  if (!isProtectedRoute(req)) {
    return NextResponse.next();
  }

  // Check if user is authenticated
  if (!userId) {
    return NextResponse.redirect(new URL("/log-in", req.url));
  }

  // Get user role from session claims public metadata
  const publicMetadata = (sessionClaims?.publicMetadata as any) || {};
  const userRole = publicMetadata.role;

  console.log(`[Middleware] User ${userId} role: ${userRole}`);

  // Dashboard is admin-only
  if (isDashboardRoute(req)) {
    if (userRole !== "admin") {
      console.log(`[Middleware] User ${userId} (role: ${userRole}) denied access to /dashboard`);
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Home page is user-only
  if (isHomeRoute(req)) {
    if (userRole !== "user") {
      console.log(`[Middleware] User ${userId} (role: ${userRole}) denied access to /`);
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

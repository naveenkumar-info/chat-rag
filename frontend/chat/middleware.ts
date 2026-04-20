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
  
  // Safely get the role
  const userRole = (sessionClaims?.publicMetadata as { role?: string })?.role;
  console.log(userRole);
  // 1. If user is logged in and tries to access login page, redirect based on role
  if (isLoginRoute(req) && userId) {
    if (userRole === "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 2. Allow public routes (like /log-in) if not protected
  if (!isProtectedRoute(req)) {
    return NextResponse.next();
  }

  // 3. Force Login if no user
  if (!userId) {
    // Check if we are already on login to prevent loops (though createRouteMatcher handles this)
    return NextResponse.redirect(new URL("/log-in", req.url));
  }

  // 4. Role-Based Protection Logic
  // Only redirect if we ARE on the wrong path AND we have a valid role to judge by
  
  if (isDashboardRoute(req) && userRole !== "admin") {
    // If not admin, send to home. 
    // IMPORTANT: Only do this if they aren't already being bounced back.
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (isHomeRoute(req) && userRole === "admin") {
    // If admin hits home page, send them to their dashboard
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
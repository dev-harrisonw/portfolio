import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";

/**
 * Session required on admin and client portal surfaces. Role separation happens server-side
 * (ADMIN_EMAILS / ClientUser rows), never from token claims.
 */
const isProtectedRoute = createRouteMatcher(["/admin(.*)", "/portal(.*)"]);

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

const clerkHandler = clerkMiddleware(
  async (auth, request) => {
    if (request.nextUrl.pathname === "/portal/no-access") return;
    if (isProtectedRoute(request)) {
      await auth.protect();
    }
  },
  {
    signInUrl: "/sign-in",
    signUpUrl: "/sign-up",
  }
);

export default async function middleware(request: NextRequest, event: NextFetchEvent) {
  if (!clerkEnabled) {
    return NextResponse.next();
  }

  try {
    return await clerkHandler(request, event);
  } catch (error) {
    // Clerk 6 can throw "handshake status without redirect" after sign-in on
    // Pages Router / Edge. Never take the whole site down for that.
    console.error("Clerk middleware failed", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};

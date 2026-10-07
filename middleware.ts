import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";

/**
 * clerkMiddleware must run so getAuth() works on Pages Router, but route gates stay
 * in getServerSideProps. auth.protect() here 404-rewrites to a blank `/clerk_*` URL
 * when handshake is incomplete — which is how Admin/Portal appeared to go nowhere.
 */
const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

const clerkHandler = clerkMiddleware({
  signInUrl: "/sign-in",
  signUpUrl: "/sign-up",
});

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

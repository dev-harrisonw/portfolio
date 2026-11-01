import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { clerkHandshake } from "@/lib/clerkRequest";

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
    // Pages Router. Continuing without the handshake drops the session, so
    // Admin and Portal bounce to a blank /sign-in. Replay it when we can.
    console.error("Clerk middleware failed", error);
    const handshake = await clerkHandshake(browserRequest(request));
    if (handshake?.redirect) {
      const res = NextResponse.redirect(handshake.redirect, 307);
      res.headers.set("Cache-Control", "no-store");
      for (const cookie of handshake.cookies) res.headers.append("set-cookie", cookie);
      return res;
    }
    return NextResponse.next();
  }
}

/** Public origin, not the internal host Edge sees behind the proxy. */
function browserRequest(request: NextRequest) {
  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host") ||
    request.nextUrl.host;
  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    request.nextUrl.protocol.replace(":", "");
  const url = new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, `${proto}://${host}`);
  const headers = new Headers(request.headers);
  headers.delete("content-length");
  return new Request(url, { method: request.method, headers });
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};

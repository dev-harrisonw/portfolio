import type { IncomingMessage } from "http";
import type { ServerResponse } from "http";
import { clerkClient, getAuth } from "@clerk/nextjs/server";
import type { GetServerSidePropsContext, NextApiRequest } from "next";

type Req = NextApiRequest | GetServerSidePropsContext["req"];

export type ResolvedAuth = {
  userId: string | null;
  /** Clerk handshake URL. Document navigations must follow it so the session cookie is refreshed. */
  redirect: string | null;
  cookies: string[];
};

type HeaderSource = { getHeader: (name: string) => string | string[] | number | undefined; setHeader: (name: string, value: string | string[]) => void };

const pending = new WeakMap<object, Promise<ResolvedAuth>>();

function firstHeader(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.split(",")[0]?.trim() || "";
}

function setCookieHeaders(headers: Headers) {
  const getter = (headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;
  if (typeof getter === "function") return getter.call(headers).filter(Boolean);
  const raw = headers.get("set-cookie");
  return raw ? [raw] : [];
}

/** Clerk's redirect target, limited to https (and local http) so a bad header can't leave the site. */
function safeClerkLocation(location: string, base: string) {
  try {
    const url = new URL(location, base);
    if (url.protocol === "https:") return url.toString();
    if (url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1")) return url.toString();
  } catch {
    return null;
  }
  return null;
}

export function incomingToRequest(req: IncomingMessage) {
  const host = firstHeader(req.headers["x-forwarded-host"]) || firstHeader(req.headers.host) || "localhost";
  const proto = firstHeader(req.headers["x-forwarded-proto"]) || "https";
  const url = new URL(req.url || "/", `${proto}://${host}`);
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null || key === "content-length") continue;
    if (Array.isArray(value)) value.forEach((item) => headers.append(key, item));
    else headers.set(key, value);
  }
  return new Request(url, { method: req.method || "GET", headers });
}

export function applySetCookies(res: HeaderSource, cookies: string[]) {
  if (!cookies.length) return;
  const existing = res.getHeader("Set-Cookie");
  const prev =
    existing == null ? [] : Array.isArray(existing) ? existing.map(String) : [String(existing)];
  res.setHeader("Set-Cookie", [...prev, ...cookies]);
}

type ClerkState = {
  status?: string;
  headers: Headers;
  toAuth?: () => { userId?: string | null } | null;
};

async function authenticate(request: Request): Promise<ResolvedAuth> {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!publishableKey || !secretKey) return { userId: null, redirect: null, cookies: [] };

  const client = await clerkClient();
  const state = (await client.authenticateRequest(request, {
    publishableKey,
    secretKey,
    signInUrl: "/sign-in",
    signUpUrl: "/sign-up",
  })) as ClerkState;

  const cookies = setCookieHeaders(state.headers);
  const userId = state.toAuth?.()?.userId ?? null;
  if (userId) return { userId, redirect: null, cookies };

  const location = state.headers.get("location");
  return { userId: null, redirect: location ? safeClerkLocation(location, request.url) : null, cookies };
}

/**
 * Session from middleware when it decorated the request.
 * If middleware swallowed a handshake error, verify the cookie here and surface
 * the handshake redirect the browser has to follow.
 */
export function resolveRequestAuth(req: Req): Promise<ResolvedAuth> {
  const cached = pending.get(req);
  if (cached) return cached;

  const run = (async (): Promise<ResolvedAuth> => {
    try {
      const { userId } = getAuth(req);
      if (userId) return { userId, redirect: null, cookies: [] };
      return { userId: null, redirect: null, cookies: [] };
    } catch {
      // getAuth throws when clerkMiddleware did not attach auth headers.
    }

    try {
      return await authenticate(incomingToRequest(req));
    } catch (error) {
      console.error("Clerk session lookup failed", error);
      return { userId: null, redirect: null, cookies: [] };
    }
  })();

  pending.set(req, run);
  return run;
}

export async function clerkHandshake(request: Request) {
  try {
    const auth = await authenticate(request);
    if (!auth.redirect) return null;
    return auth;
  } catch (error) {
    console.error("Clerk handshake recovery failed", error);
    return null;
  }
}

export function applyAuthRedirect(res: ServerResponse, auth: ResolvedAuth) {
  applySetCookies(res, auth.cookies);
  if (!auth.redirect) return null;
  res.setHeader("Cache-Control", "no-store");
  return { redirect: { destination: auth.redirect, permanent: false as const } };
}

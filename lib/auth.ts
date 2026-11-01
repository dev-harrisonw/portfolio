import type { NextApiRequest, NextApiResponse } from "next";
import { getClerkUser, isAdminUser } from "@/lib/access";
import { applySetCookies, resolveRequestAuth } from "@/lib/clerkRequest";

export async function getClerkUserId(req: NextApiRequest) {
  return (await resolveRequestAuth(req)).userId;
}

/**
 * Admins: Clerk publicMetadata.role === "admin"
 * or a verified email listed in ADMIN_EMAILS (comma-separated) for first-time setup.
 */
export async function requireAdmin(req: NextApiRequest, res?: NextApiResponse) {
  const auth = await resolveRequestAuth(req);
  if (res) applySetCookies(res, auth.cookies);
  const { userId } = auth;
  if (!userId) {
    return { ok: false as const, status: 401, error: "Unauthorized" };
  }

  try {
    const user = await getClerkUser(userId);
    if (isAdminUser(user)) {
      return { ok: true as const, userId };
    }
  } catch {
    return { ok: false as const, status: 500, error: "Auth lookup failed" };
  }

  return { ok: false as const, status: 403, error: "Forbidden" };
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

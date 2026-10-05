import { getAuth } from "@clerk/nextjs/server";
import type { NextApiRequest } from "next";
import { getClerkUser, isAdminUser } from "@/lib/access";

export function getClerkUserId(req: NextApiRequest) {
  const { userId } = getAuth(req);
  return userId;
}

/**
 * Admins: Clerk publicMetadata.role === "admin"
 * or a verified email listed in ADMIN_EMAILS (comma-separated) for first-time setup.
 */
export async function requireAdmin(req: NextApiRequest) {
  const { userId } = getAuth(req);
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

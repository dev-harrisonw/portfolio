import { clerkClient, getAuth } from "@clerk/nextjs/server";
import type { NextApiRequest } from "next";

export function getClerkUserId(req: NextApiRequest) {
  const { userId } = getAuth(req);
  return userId;
}

/**
 * Admins: Clerk publicMetadata.role === "admin"
 * or email listed in ADMIN_EMAILS (comma-separated) for first-time setup.
 */
export async function requireAdmin(req: NextApiRequest) {
  const { userId } = getAuth(req);
  if (!userId) {
    return { ok: false as const, status: 401, error: "Unauthorized" };
  }

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const role = (user.publicMetadata as { role?: string } | undefined)?.role;
    if (role === "admin") {
      return { ok: true as const, userId };
    }

    const emails =
      process.env.ADMIN_EMAILS?.split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean) || [];
    const userEmails = user.emailAddresses.map((e) =>
      e.emailAddress.toLowerCase()
    );
    if (emails.some((email) => userEmails.includes(email))) {
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

import { clerkClient, getAuth } from "@clerk/nextjs/server";
import type { User } from "@clerk/nextjs/server";
import type { GetServerSidePropsContext, NextApiRequest } from "next";
import prisma from "@/lib/prisma";

type Req = NextApiRequest | GetServerSidePropsContext["req"];

export async function getClerkUser(userId: string) {
  const clerk = await clerkClient();
  return clerk.users.getUser(userId);
}

function adminEmails() {
  return (
    process.env.ADMIN_EMAILS?.split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean) ?? []
  );
}

function verifiedEmails(user: User) {
  return user.emailAddresses
    .filter((e) => e.verification?.status === "verified")
    .map((e) => e.emailAddress.toLowerCase());
}

/** Admin = Clerk publicMetadata.role "admin" (set server-side only) or a verified email in ADMIN_EMAILS. */
export function isAdminUser(user: User) {
  const role = (user.publicMetadata as { role?: string } | undefined)?.role;
  if (role === "admin") return true;
  const allowed = adminEmails();
  return verifiedEmails(user).some((email) => allowed.includes(email));
}

/**
 * Which client's portal this login may see. A ClientUser row is the only grant; invited rows are
 * linked to the Clerk account on first visit by verified email. Admins may preview any client.
 */
export async function resolvePortalAccess(req: Req, requestedClientId?: string) {
  const { userId } = getAuth(req);
  if (!userId) return { status: "signed-out" as const };

  const linked = await prisma.clientUser.findUnique({ where: { clerkUserId: userId }, select: { clientId: true } });
  if (linked && !requestedClientId) return { status: "ok" as const, clientId: linked.clientId, isAdmin: false };

  const user = await getClerkUser(userId);

  if (isAdminUser(user)) {
    const clientId =
      requestedClientId ||
      (await prisma.client.findFirst({ where: { archived: false }, orderBy: { name: "asc" }, select: { id: true } }))?.id;
    return clientId ? { status: "ok" as const, clientId, isAdmin: true } : { status: "no-access" as const };
  }

  if (linked) return { status: "ok" as const, clientId: linked.clientId, isAdmin: false };

  const emails = verifiedEmails(user);
  const invite = await prisma.clientUser.findFirst({
    where: { clerkUserId: null, email: { in: emails } },
    orderBy: { createdAt: "asc" },
  });
  if (!invite) return { status: "no-access" as const };

  await prisma.clientUser.update({ where: { id: invite.id }, data: { clerkUserId: userId } });
  return { status: "ok" as const, clientId: invite.clientId, isAdmin: false };
}

export async function requirePortalPage(ctx: GetServerSidePropsContext) {
  const requested = typeof ctx.query.client === "string" ? ctx.query.client : undefined;
  const access = await resolvePortalAccess(ctx.req, requested);
  if (access.status === "signed-out") {
    return {
      redirect: { destination: `/sign-in?redirect_url=${encodeURIComponent(ctx.resolvedUrl)}`, permanent: false },
    } as const;
  }
  if (access.status === "no-access") {
    return { redirect: { destination: "/portal/no-access", permanent: false } } as const;
  }
  return access;
}

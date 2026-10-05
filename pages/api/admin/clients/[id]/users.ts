import { clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { adminRoute, HttpError, parseBody, queryId } from "@/lib/api";
import { inviteSchema } from "@/lib/validation/time";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";
}

/**
 * Invite a portal login for a client. If a Clerk user with that email already exists it is linked
 * immediately; otherwise a Clerk invitation is sent and the Clerk webhook links it on sign-up.
 */
export default adminRoute({
  POST: async (req, res) => {
    const clientId = queryId(req);
    const { email } = parseBody(inviteSchema, req);

    const owner = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true } });
    if (!owner) throw new HttpError(404, "Client not found");

    const clerk = await clerkClient();
    const existing = await clerk.users.getUserList({ emailAddress: [email], limit: 1 });
    const clerkUserId = existing.data[0]?.id ?? null;

    if (clerkUserId) {
      const linked = await prisma.clientUser.findUnique({ where: { clerkUserId } });
      if (linked && linked.clientId !== clientId) {
        throw new HttpError(409, "That login already belongs to another client");
      }
    }

    const user = await prisma.clientUser.upsert({
      where: { clientId_email: { clientId, email } },
      create: { clientId, email, clerkUserId },
      update: { clerkUserId },
    });

    let invited = false;
    if (!clerkUserId) {
      try {
        await clerk.invitations.createInvitation({
          emailAddress: email,
          redirectUrl: `${siteUrl()}/sign-up?redirect_url=/portal`,
          ignoreExisting: true,
        });
        invited = true;
      } catch (error) {
        console.error("Clerk invitation failed", error);
      }
    }

    res.status(201).json({ user, invited, linked: Boolean(clerkUserId) });
  },
  DELETE: async (req, res) => {
    const clientId = queryId(req);
    const userId = typeof req.query.userId === "string" ? req.query.userId : "";
    if (!userId) throw new HttpError(400, "userId is required");
    await prisma.clientUser.deleteMany({ where: { id: userId, clientId } });
    res.status(204).end();
  },
});

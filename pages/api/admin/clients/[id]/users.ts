import { clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { adminRoute, HttpError, parseBody, queryId } from "@/lib/api";
import { inviteSchema } from "@/lib/validation/time";
import { siteUrl } from "@/lib/site";

async function clerkUserIdFor(email: string) {
  try {
    const clerk = await clerkClient();
    const existing = await clerk.users.getUserList({ emailAddress: [email], limit: 1 });
    return existing.data[0]?.id ?? null;
  } catch (error) {
    console.error("Clerk user lookup failed", error);
    return null;
  }
}

async function sendClerkInvite(email: string) {
  try {
    const clerk = await clerkClient();
    await clerk.invitations.createInvitation({
      emailAddress: email,
      redirectUrl: `${siteUrl()}/sign-up?redirect_url=/portal`,
      ignoreExisting: true,
    });
    return true;
  } catch (error) {
    console.error("Clerk invitation failed", error);
    return false;
  }
}

/**
 * Grant portal access for a client. Existing Clerk accounts are linked immediately; otherwise a
 * Clerk invitation email is sent and the row is claimed on first verified sign-in.
 */
export default adminRoute({
  POST: async (req, res) => {
    const clientId = queryId(req);
    const { email } = parseBody(inviteSchema, req);

    const owner = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true } });
    if (!owner) throw new HttpError(404, "Client not found");

    const existing = await prisma.clientUser.findUnique({ where: { clientId_email: { clientId, email } } });
    if (existing?.clerkUserId) {
      return res.status(200).json({ user: existing, invited: false, linked: true, already: true });
    }

    const clerkUserId = await clerkUserIdFor(email);
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

    if (clerkUserId) {
      return res.status(existing ? 200 : 201).json({ user, invited: false, linked: true, already: false });
    }

    const invited = await sendClerkInvite(email);
    res.status(existing ? 200 : 201).json({ user, invited, linked: false, already: false });
  },
  DELETE: async (req, res) => {
    const clientId = queryId(req);
    const userId = typeof req.query.userId === "string" ? req.query.userId : "";
    if (!userId) throw new HttpError(400, "userId is required");
    await prisma.clientUser.deleteMany({ where: { id: userId, clientId } });
    res.status(204).end();
  },
});

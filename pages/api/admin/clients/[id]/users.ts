import { clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { adminRoute, HttpError, parseBody, queryId } from "@/lib/api";
import { brandClerkInvitationTemplate } from "@/lib/clerkInviteTemplate";
import { emailPortalInvite, emailPortalReady } from "@/lib/email";
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

function clerkMessage(error: unknown) {
  const details = (error as { errors?: { longMessage?: string; message?: string }[] })?.errors?.[0];
  return details?.longMessage || details?.message || (error instanceof Error ? error.message : "Invitation failed");
}

type Invitation = { id: string; emailAddress?: string; email_address?: string; url?: string | null };

function inviteEmail(invite: Invitation) {
  return (invite.emailAddress || invite.email_address || "").toLowerCase();
}

/** Drop stale pending invites (they keep whatever redirect they were created with) and issue a fresh ticket. */
async function freshInvitation(email: string, redirectUrl: string, notify: boolean) {
  const clerk = await clerkClient();
  try {
    const pending = await clerk.invitations.getInvitationList({ status: "pending", limit: 100 });
    const rows = (Array.isArray(pending) ? pending : pending.data) as Invitation[];
    await Promise.all(
      rows
        .filter((invite) => inviteEmail(invite) === email)
        .map((invite) => clerk.invitations.revokeInvitation(invite.id).catch(() => undefined))
    );
  } catch (error) {
    console.error("Couldn't list pending invitations", error);
  }

  const created = (await clerk.invitations.createInvitation({
    emailAddress: email,
    redirectUrl,
    notify,
    ignoreExisting: true,
  })) as Invitation;
  if (!created.url) throw new Error("Clerk did not return an invitation link");
  return created;
}

/**
 * Grant portal access for a client. Existing Clerk accounts are linked immediately; otherwise a
 * Clerk invitation email is sent and the row is claimed on first verified sign-in.
 */
export default adminRoute({
  POST: async (req, res) => {
    const clientId = queryId(req);
    const { email } = parseBody(inviteSchema, req);

    const owner = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true, name: true } });
    if (!owner) throw new HttpError(404, "Client not found");
    const origin = siteUrl();
    const signInUrl = `${origin}/sign-in?redirect_url=/portal`;

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
      const mailed = await emailPortalReady({ to: email, clientName: owner.name, signInUrl });
      return res.status(existing ? 200 : 201).json({
        user,
        invited: false,
        linked: true,
        already: false,
        emailed: !mailed.skipped && !mailed.error,
        inviteUrl: null,
      });
    }

    const redirectUrl = `${origin}/sign-up?redirect_url=/portal`;
    let invitation: Invitation;
    try {
      invitation = await freshInvitation(email, redirectUrl, false);
    } catch (error) {
      console.error("Clerk invitation failed", error);
      throw new HttpError(502, clerkMessage(error));
    }

    const mailed = await emailPortalInvite({ to: email, clientName: owner.name, inviteUrl: invitation.url!, signInUrl });
    let delivered: "branded" | "clerk" | "none" = !mailed.skipped && !mailed.error ? "branded" : "none";
    if (delivered !== "branded") {
      // No Resend message went out. Restyle Clerk's template, then let Clerk deliver a new ticket.
      try {
        await brandClerkInvitationTemplate();
        invitation = await freshInvitation(email, redirectUrl, true);
        delivered = "clerk";
      } catch (error) {
        console.error("Clerk invitation email failed", error);
        throw new HttpError(502, clerkMessage(error));
      }
    }

    res.status(existing ? 200 : 201).json({
      user,
      invited: true,
      linked: false,
      already: false,
      emailed: true,
      delivered,
      inviteUrl: invitation.url,
    });
  },
  DELETE: async (req, res) => {
    const clientId = queryId(req);
    const userId = typeof req.query.userId === "string" ? req.query.userId : "";
    if (!userId) throw new HttpError(400, "userId is required");
    await prisma.clientUser.deleteMany({ where: { id: userId, clientId } });
    res.status(204).end();
  },
});

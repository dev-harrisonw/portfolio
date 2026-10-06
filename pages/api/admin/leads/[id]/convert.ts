import prisma from "@/lib/prisma";
import { adminRoute, HttpError, queryId } from "@/lib/api";

function nameFromEmail(email: string, service: string | null) {
  const local = email.split("@")[0] ?? email;
  const fromEmail = local.replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return (service && service.trim()) || fromEmail || email;
}

export default adminRoute({
  POST: async (req, res) => {
    const id = queryId(req);
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) throw new HttpError(404, "Lead not found");
    if (lead.convertedClientId) {
      const client = await prisma.client.findUnique({ where: { id: lead.convertedClientId } });
      if (client) return res.status(200).json({ client, created: false });
    }

    const existing = await prisma.client.findFirst({
      where: { billingEmail: { equals: lead.email, mode: "insensitive" }, archived: false },
    });
    const client =
      existing ??
      (await prisma.client.create({
        data: {
          name: nameFromEmail(lead.email, lead.service),
          billingEmail: lead.email,
          hourlyRate: 0,
          currency: "GBP",
        },
      }));

    const updated = await prisma.lead.update({
      where: { id },
      data: { status: "WON", convertedClientId: client.id },
    });
    const { logActivity } = await import("@/lib/activity");
    if (!existing) {
      await logActivity({
        type: "client.created",
        message: `Added client ${client.name} from lead`,
        href: `/admin/clients/${client.id}`,
        clientId: client.id,
      });
    }
    await logActivity({
      type: "lead.converted",
      message: `${lead.email} → ${client.name}`,
      href: `/admin/clients/${client.id}`,
      clientId: client.id,
    });
    res.status(existing ? 200 : 201).json({ lead: updated, client, created: !existing });
  },
});

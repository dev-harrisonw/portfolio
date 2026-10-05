import type { NextApiRequest, NextApiResponse } from "next";
import { HttpError, queryId, sendError } from "@/lib/api";
import { resolvePortalAccess } from "@/lib/access";
import { sendInvoice } from "@/lib/invoicing/checkout";
import prisma from "@/lib/prisma";

/** POST — open (or reuse) Stripe Checkout for a sent invoice belonging to this client. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const requested = typeof req.query.client === "string" ? req.query.client : undefined;
    const access = await resolvePortalAccess(req, requested);
    if (access.status === "signed-out") return res.status(401).json({ error: "Unauthorized" });
    if (access.status === "no-access") return res.status(403).json({ error: "Forbidden" });

    const id = queryId(req);
    const invoice = await prisma.invoice.findFirst({
      where: { id, clientId: access.clientId, status: { in: ["DRAFT", "SENT"] } },
      select: { id: true, status: true },
    });
    if (!invoice) throw new HttpError(404, "Invoice not found");
    if (invoice.status === "DRAFT" && !access.isAdmin) throw new HttpError(409, "This invoice hasn't been sent yet");

    const { url } = await sendInvoice(id);
    res.status(200).json({ url });
  } catch (error) {
    sendError(res, error);
  }
}

import type { NextApiRequest, NextApiResponse } from "next";
import { queryId, sendError } from "@/lib/api";
import { resolvePortalAccess } from "@/lib/access";
import { sendInvoicePdf } from "@/lib/invoicing/pdf";

/** GET ?format=pdf — download a sent or paid invoice PDF for this client. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const requested = typeof req.query.client === "string" ? req.query.client : undefined;
    const access = await resolvePortalAccess(req, requested);
    if (access.status === "signed-out") return res.status(401).json({ error: "Unauthorized" });
    if (access.status === "no-access") return res.status(403).json({ error: "Forbidden" });
    if (req.query.format !== "pdf") return res.status(400).json({ error: "format=pdf is required" });
    await sendInvoicePdf(res, queryId(req), access.clientId);
  } catch (error) {
    sendError(res, error);
  }
}

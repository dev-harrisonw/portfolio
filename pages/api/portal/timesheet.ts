import type { NextApiRequest, NextApiResponse } from "next";
import { sendError } from "@/lib/api";
import { resolvePortalAccess } from "@/lib/access";
import { sendExport } from "@/lib/exports/handlers";

/** GET ?period=YYYY-MM&format=csv|pdf — always scoped to the signed-in client's own data. */
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
    await sendExport(res, access.clientId, req.query.period, req.query.format);
  } catch (error) {
    sendError(res, error);
  }
}

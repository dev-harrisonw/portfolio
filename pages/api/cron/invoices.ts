import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { runMonthEnd } from "@/lib/invoicing/generate";
import { sendInvoice } from "@/lib/invoicing/checkout";

/** Vercel Cron: 06:00 UTC on the 1st. Protected by CRON_SECRET. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const result = await runMonthEnd();
    const autoSend = await prisma.invoice.findMany({
      where: { id: { in: result.createdIds }, client: { reviewBeforeSend: false } },
      select: { id: true },
    });
    const sent: string[] = [];
    for (const inv of autoSend) {
      try {
        await sendInvoice(inv.id, { email: true });
        sent.push(inv.id);
      } catch (error) {
        console.error("Auto-send failed", inv.id, error);
      }
    }
    res.status(200).json({ ...result, sent: sent.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Month-end run failed" });
  }
}

import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { remindInvoice } from "@/lib/invoicing/checkout";

const DAY_MS = 86400000;

/** Vercel Cron: Mondays 08:00 UTC. Overdue invoices not reminded in the last 7 days, max 3 nudges. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
  const due = await prisma.invoice.findMany({
    where: {
      status: "SENT",
      dueAt: { lt: now },
      reminderCount: { lt: 3 },
      OR: [{ remindedAt: null }, { remindedAt: { lt: weekAgo } }],
    },
    select: { id: true, number: true },
    take: 40,
  });

  const sent: string[] = [];
  const failed: string[] = [];
  for (const inv of due) {
    try {
      await remindInvoice(inv.id);
      sent.push(inv.number);
    } catch (error) {
      console.error("Reminder failed", inv.number, error);
      failed.push(inv.number);
    }
  }
  res.status(200).json({ considered: due.length, sent: sent.length, failed });
}

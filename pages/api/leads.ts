import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, service, timeline, budget, details, summary } = req.body || {};
  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "email is required" });
  }

  try {
    const lead = await prisma.lead.create({
      data: {
        email: email.trim(),
        service: service || null,
        timeline: timeline || null,
        budget: budget || null,
        details: details || null,
        summary: summary || null,
      },
    });
    return res.status(201).json({ lead });
  } catch {
    return res.status(500).json({ error: "Failed to save lead" });
  }
}

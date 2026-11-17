import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import prisma from "@/lib/prisma";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || null);

const leadSchema = z.object({
  email: z.string().trim().toLowerCase().email("A valid email is required").max(254),
  service: optionalText(120),
  timeline: optionalText(120),
  budget: optionalText(120),
  details: optionalText(5000),
  summary: optionalText(5000),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const parsed = leadSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid enquiry" });
  }

  try {
    const lead = await prisma.lead.create({ data: parsed.data, select: { id: true } });
    return res.status(201).json({ lead });
  } catch (error) {
    console.error("leads: failed to save", error);
    return res.status(500).json({ error: "Failed to save lead" });
  }
}

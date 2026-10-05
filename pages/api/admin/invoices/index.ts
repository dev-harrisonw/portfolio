import prisma from "@/lib/prisma";
import { adminRoute, HttpError, parseBody } from "@/lib/api";
import { generatePeriodInvoice, generateStageInvoice } from "@/lib/invoicing/generate";
import { shiftPeriod } from "@/lib/billing";
import { z } from "zod";

const createSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("PERIOD"), clientId: z.string().min(1), periodOffset: z.number().int().max(0).default(-1) }),
  z.object({ kind: z.literal("STAGE"), stageId: z.string().min(1) }),
]);

export default adminRoute({
  GET: async (_req, res) => {
    const invoices = await prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        client: { select: { id: true, name: true, billingEmail: true } },
        lines: { orderBy: { sortOrder: "asc" } },
        _count: { select: { entries: true } },
      },
    });
    res.status(200).json({ invoices });
  },
  POST: async (req, res) => {
    const body = parseBody(createSchema, req);
    if (body.kind === "STAGE") {
      const invoice = await generateStageInvoice(body.stageId);
      return res.status(201).json({ invoice });
    }
    const client = await prisma.client.findUnique({ where: { id: body.clientId }, select: { periodStartDay: true } });
    if (!client) throw new HttpError(404, "Client not found");
    const period = shiftPeriod(client.periodStartDay, new Date(), body.periodOffset ?? -1);
    const { invoice, created } = await generatePeriodInvoice(body.clientId, period);
    if (!invoice) throw new HttpError(409, "Nothing to invoice for that period");
    res.status(created ? 201 : 200).json({ invoice, created });
  },
});

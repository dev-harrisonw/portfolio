import { z } from "zod";
import prisma from "@/lib/prisma";
import { adminRoute, HttpError, parseBody, queryId } from "@/lib/api";
import { refreshPeriodInvoice } from "@/lib/invoicing/generate";

const createSchema = z.object({
  taskId: z.string().min(1, "Pick a task"),
  startedAt: z.coerce.date(),
  durationMinutes: z.number().int().min(1, "Duration must be at least a minute").max(24 * 60),
  note: z.string().max(2000).default(""),
});

export default adminRoute({
  POST: async (req, res) => {
    const invoiceId = queryId(req);
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new HttpError(404, "Invoice not found");
    if (invoice.status !== "DRAFT") throw new HttpError(409, "Only a draft invoice can be changed");
    if (!invoice.periodStart || !invoice.periodEnd) throw new HttpError(422, "Time can be added on a period invoice");

    const data = parseBody(createSchema, req);
    if (data.startedAt < invoice.periodStart || data.startedAt >= invoice.periodEnd) {
      throw new HttpError(422, "That date is outside this invoice");
    }
    const task = await prisma.task.findUnique({
      where: { id: data.taskId },
      select: { project: { select: { clientId: true } } },
    });
    if (!task || task.project.clientId !== invoice.clientId) throw new HttpError(422, "Pick a task for this client");

    await prisma.timeEntry.create({
      data: {
        taskId: data.taskId,
        startedAt: data.startedAt,
        note: data.note,
        billable: true,
        amount: null,
        durationMinutes: data.durationMinutes,
        endedAt: new Date(data.startedAt.getTime() + data.durationMinutes * 60_000),
        invoiceId,
      },
    });
    const updated = await refreshPeriodInvoice(invoiceId);
    res.status(201).json({ invoice: updated });
  },
});

import prisma from "@/lib/prisma";
import { adminRoute, HttpError, queryId } from "@/lib/api";
import { refreshPeriodInvoice } from "@/lib/invoicing/generate";

export default adminRoute({
  DELETE: async (req, res) => {
    const invoiceId = queryId(req);
    const entryId = queryId(req, "entryId");
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new HttpError(404, "Invoice not found");
    if (invoice.status !== "DRAFT") throw new HttpError(409, "Only a draft invoice can be changed");

    const entry = await prisma.timeEntry.findFirst({ where: { id: entryId, invoiceId } });
    if (!entry) throw new HttpError(404, "Time entry not found");
    await prisma.timeEntry.update({ where: { id: entry.id }, data: { invoiceId: null, withheld: true } });
    await refreshPeriodInvoice(invoiceId);
    res.status(204).end();
  },
  POST: async (req, res) => {
    const invoiceId = queryId(req);
    const entryId = queryId(req, "entryId");
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new HttpError(404, "Invoice not found");
    if (invoice.status !== "DRAFT") throw new HttpError(409, "Only a draft invoice can be changed");
    if (!invoice.periodStart || !invoice.periodEnd) throw new HttpError(422, "This invoice is not for a period");

    const entry = await prisma.timeEntry.findFirst({
      where: { id: entryId, withheld: true, task: { project: { clientId: invoice.clientId } } },
    });
    if (!entry) throw new HttpError(404, "Time entry not found");
    if (entry.startedAt < invoice.periodStart || entry.startedAt >= invoice.periodEnd) {
      throw new HttpError(422, "That time is outside this invoice");
    }
    await prisma.timeEntry.update({ where: { id: entry.id }, data: { withheld: false, invoiceId } });
    const updated = await refreshPeriodInvoice(invoiceId);
    res.status(200).json({ invoice: updated });
  },
});

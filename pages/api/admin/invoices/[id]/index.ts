import prisma from "@/lib/prisma";
import { adminRoute, HttpError, parseBody, queryId } from "@/lib/api";
import {
  deleteVoidInvoice,
  markInvoicePaid,
  remindInvoice,
  sendInvoice,
  voidInvoiceWithCheckout,
} from "@/lib/invoicing/checkout";
import { refreshPeriodInvoice } from "@/lib/invoicing/generate";
import { z } from "zod";

const actionSchema = z.object({ action: z.enum(["send", "pay", "remind"]) });
const patchSchema = z.union([
  z.object({ number: z.string().trim().min(1, "Add a name").max(40) }),
  z.object({ billOverages: z.boolean() }),
]);

export default adminRoute({
  GET: async (req, res) => {
    const id = queryId(req);
    if (req.query.format === "pdf") {
      const { sendInvoicePdf } = await import("@/lib/invoicing/pdf");
      await sendInvoicePdf(res, id);
      return;
    }
    const invoice = await prisma.invoice.findUnique({
      where: { id: queryId(req) },
      include: {
        client: { select: { id: true, name: true, billingEmail: true, currency: true } },
        lines: { orderBy: { sortOrder: "asc" } },
        stages: true,
      },
    });
    if (!invoice) throw new HttpError(404, "Not found");
    res.status(200).json({ invoice });
  },
  POST: async (req, res) => {
    const { action } = parseBody(actionSchema, req);
    const id = queryId(req);
    if (action === "pay") {
      const invoice = await markInvoicePaid(id);
      return res.status(200).json({ invoice });
    }
    if (action === "remind") {
      const invoice = await remindInvoice(id);
      return res.status(200).json({ invoice });
    }
    const { invoice, url } = await sendInvoice(id, { email: true });
    res.status(200).json({ invoice, url });
  },
  PATCH: async (req, res) => {
    const id = queryId(req);
    const body = parseBody(patchSchema, req);
    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Not found");
    if ("billOverages" in body) {
      if (existing.status !== "DRAFT") throw new HttpError(409, "Only a draft invoice can be changed");
      if (existing.kind !== "PERIOD") throw new HttpError(422, "This invoice has no allowance");
      const invoice = await refreshPeriodInvoice(id, { billOverages: body.billOverages });
      return res.status(200).json({ invoice });
    }
    const taken = await prisma.invoice.findFirst({ where: { number: body.number, NOT: { id } }, select: { id: true } });
    if (taken) throw new HttpError(409, "An invoice already uses that name");
    const invoice = await prisma.invoice.update({ where: { id }, data: { number: body.number } });
    res.status(200).json({ invoice });
  },
  DELETE: async (req, res) => {
    // Plain DELETE voids; `?permanent=1` removes an invoice that is already void.
    if (req.query.permanent === "1") await deleteVoidInvoice(queryId(req));
    else await voidInvoiceWithCheckout(queryId(req));
    res.status(204).end();
  },
});

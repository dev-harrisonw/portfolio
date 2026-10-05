import prisma from "@/lib/prisma";
import { adminRoute, HttpError, parseBody, queryId } from "@/lib/api";
import { markInvoicePaid, sendInvoice, voidInvoiceWithCheckout } from "@/lib/invoicing/checkout";
import { z } from "zod";

const actionSchema = z.object({ action: z.enum(["send", "pay"]) });

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
    const { invoice, url } = await sendInvoice(id, { email: true });
    res.status(200).json({ invoice, url });
  },
  DELETE: async (req, res) => {
    await voidInvoiceWithCheckout(queryId(req));
    res.status(204).end();
  },
});

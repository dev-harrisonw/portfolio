import prisma from "@/lib/prisma";
import { adminRoute, HttpError, parseBody, queryId } from "@/lib/api";
import { generateStageInvoice } from "@/lib/invoicing/generate";
import { voidInvoiceWithCheckout } from "@/lib/invoicing/checkout";
import { stageUpdateSchema } from "@/lib/validation/time";

/** Mark a payment stage reached (DUE) or undo it while it hasn't been paid. Reaching it drafts an invoice. */
export default adminRoute({
  PUT: async (req, res) => {
    const id = queryId(req);
    const { status } = parseBody(stageUpdateSchema, req);
    const stage = await prisma.paymentStage.findUnique({ where: { id } });
    if (!stage) throw new HttpError(404, "Not found");
    if (stage.status === "PAID") throw new HttpError(409, "This stage has already been paid");

    if (status === "PENDING") {
      if (stage.invoiceId) await voidInvoiceWithCheckout(stage.invoiceId);
      const updated = await prisma.paymentStage.update({
        where: { id },
        data: { status: "PENDING", reachedAt: null, invoiceId: null },
      });
      return res.status(200).json({ stage: updated });
    }

    const updated = await prisma.paymentStage.update({
      where: { id },
      data: { status: "DUE", reachedAt: stage.reachedAt ?? new Date() },
    });
    const invoice = await generateStageInvoice(id);
    res.status(200).json({ stage: updated, invoice });
  },
});

import { adminRoute, parseBody, queryId } from "@/lib/api";
import { addInvoiceLine, invoiceLineCreateSchema } from "@/lib/invoicing/lines";

export default adminRoute({
  POST: async (req, res) => {
    const invoice = await addInvoiceLine(queryId(req), parseBody(invoiceLineCreateSchema, req));
    res.status(201).json({ invoice });
  },
});

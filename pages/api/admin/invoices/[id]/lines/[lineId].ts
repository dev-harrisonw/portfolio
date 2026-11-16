import { adminRoute, parseBody, queryId } from "@/lib/api";
import { deleteInvoiceLine, invoiceLineUpdateSchema, updateInvoiceLine } from "@/lib/invoicing/lines";

export default adminRoute({
  PUT: async (req, res) => {
    const invoice = await updateInvoiceLine(queryId(req), queryId(req, "lineId"), parseBody(invoiceLineUpdateSchema, req));
    res.status(200).json({ invoice });
  },
  DELETE: async (req, res) => {
    await deleteInvoiceLine(queryId(req), queryId(req, "lineId"));
    res.status(204).end();
  },
});

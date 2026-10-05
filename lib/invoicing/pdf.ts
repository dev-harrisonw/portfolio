import type { NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { HttpError } from "@/lib/api";
import { renderInvoicePdf } from "@/lib/exports/InvoicePdf";

export async function loadInvoicePdf(id: string, clientId?: string) {
  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      ...(clientId ? { clientId, status: { in: ["SENT", "PAID"] } } : {}),
    },
    include: {
      client: { select: { name: true, billingEmail: true } },
      lines: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!invoice) throw new HttpError(404, "Invoice not found");
  return invoice;
}

export async function sendInvoicePdf(res: NextApiResponse, id: string, clientId?: string) {
  const invoice = await loadInvoicePdf(id, clientId);
  const pdf = await renderInvoicePdf(invoice);
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${invoice.number}.pdf"`);
  return res.status(200).send(pdf);
}

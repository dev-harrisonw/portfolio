import { z } from "zod";
import prisma from "@/lib/prisma";
import { HttpError } from "@/lib/api";

const amountFor = (minutes: number, rate: number) => Math.round((minutes * rate) / 60);

export const invoiceLineUpdateSchema = z
  .object({
    description: z.string().trim().min(1, "Add a description").max(500),
    mode: z.enum(["time", "price"]),
    amount: z.number().int().min(1, "Enter a price").optional(),
  })
  .superRefine((value, ctx) => {
    if (value.mode === "price" && value.amount == null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter a price", path: ["amount"] });
    }
  });

export const invoiceLineCreateSchema = z.object({
  description: z.string().trim().min(1, "Add a description").max(500),
  amount: z.number().int().min(1, "Enter a price"),
});

async function draftInvoice(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) throw new HttpError(404, "Invoice not found");
  if (invoice.status !== "DRAFT") throw new HttpError(409, "Only a draft invoice can be changed");
  return invoice;
}

export async function recalcInvoice(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { lines: true },
  });
  if (!invoice) throw new HttpError(404, "Invoice not found");
  const subtotal = invoice.lines.reduce((sum, line) => sum + line.amount, 0);
  const vat = Math.round((subtotal * invoice.vatRateBps) / 10000);
  return prisma.invoice.update({
    where: { id: invoiceId },
    data: { subtotal, vat, total: subtotal + vat },
  });
}

export async function updateInvoiceLine(
  invoiceId: string,
  lineId: string,
  input: z.infer<typeof invoiceLineUpdateSchema>
) {
  await draftInvoice(invoiceId);
  const line = await prisma.invoiceLine.findFirst({ where: { id: lineId, invoiceId } });
  if (!line) throw new HttpError(404, "Line not found");

  if (input.mode === "time") {
    if (line.minutes <= 0 || line.rate <= 0) throw new HttpError(422, "This line has no hours to bill");
    await prisma.invoiceLine.update({
      where: { id: line.id },
      data: { description: input.description, amount: amountFor(line.minutes, line.rate) },
    });
  } else {
    await prisma.invoiceLine.update({
      where: { id: line.id },
      data: { description: input.description, minutes: 0, rate: 0, amount: input.amount },
    });
  }
  return recalcInvoice(invoiceId);
}

export async function addInvoiceLine(invoiceId: string, input: z.infer<typeof invoiceLineCreateSchema>) {
  await draftInvoice(invoiceId);
  const last = await prisma.invoiceLine.aggregate({ where: { invoiceId }, _max: { sortOrder: true } });
  await prisma.invoiceLine.create({
    data: {
      invoiceId,
      description: input.description,
      minutes: 0,
      rate: 0,
      amount: input.amount,
      sortOrder: (last._max.sortOrder ?? -1) + 1,
    },
  });
  return recalcInvoice(invoiceId);
}

export async function deleteInvoiceLine(invoiceId: string, lineId: string) {
  await draftInvoice(invoiceId);
  const line = await prisma.invoiceLine.findFirst({ where: { id: lineId, invoiceId } });
  if (!line) throw new HttpError(404, "Line not found");
  await prisma.invoiceLine.delete({ where: { id: line.id } });
  return recalcInvoice(invoiceId);
}

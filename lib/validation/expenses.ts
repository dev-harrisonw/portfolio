import { z } from "zod";

export const expenseSchema = z.object({
  date: z.coerce.date(),
  vendor: z.string().trim().min(1, "Vendor is required"),
  category: z.enum(["SOFTWARE", "HOSTING", "CONTRACTOR", "TRAVEL", "OFFICE", "OTHER"]).default("OTHER"),
  description: z.string().max(2000).default(""),
  amount: z.number().int().min(1, "Amount must be at least 1p"),
  currency: z.string().length(3).toUpperCase().default("GBP"),
  clientId: z.string().min(1).nullable().optional(),
});

export const expenseUpdateSchema = expenseSchema.partial();

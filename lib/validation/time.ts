import { z } from "zod";

const minor = z.number().int().min(0);
const optionalMinor = minor.nullable().optional();
const rollover = z.enum(["EXPIRE", "ROLLOVER", "ROLLOVER_CAPPED"]);

export const clientSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  billingEmail: z.string().trim().email("A valid billing email is required"),
  currency: z.string().length(3).toUpperCase().default("GBP"),
  hourlyRate: minor,
  monthlyHours: z.number().int().min(0).nullable().optional(),
  retainerAmount: optionalMinor,
  periodStartDay: z.number().int().min(1).max(28).default(1),
  rolloverPolicy: rollover.default("EXPIRE"),
  rolloverCapHours: z.number().int().min(0).nullable().optional(),
  roundingMinutes: z.union([z.literal(0), z.literal(6), z.literal(15)]).default(0),
  vatRateBps: z.number().int().min(0).max(10000).default(0),
  reviewBeforeSend: z.boolean().default(false),
  archived: z.boolean().optional(),
});

export const clientUpdateSchema = clientSchema.partial();

export const projectSchema = z.object({
  clientId: z.string().min(1),
  name: z.string().trim().min(1, "Name is required"),
  status: z.enum(["ACTIVE", "PAUSED", "ARCHIVED"]).default("ACTIVE"),
  hourlyRate: optionalMinor,
  monthlyHours: z.number().int().min(0).nullable().optional(),
  rolloverPolicy: rollover.nullable().optional(),
  rolloverCapHours: z.number().int().min(0).nullable().optional(),
});

export const projectUpdateSchema = projectSchema.omit({ clientId: true }).partial();

export const taskSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().trim().min(1, "Title is required"),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).default("TODO"),
});

export const taskUpdateSchema = taskSchema.omit({ projectId: true }).partial();

export const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("A valid email is required"),
});

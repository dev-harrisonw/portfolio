import type { NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { HttpError } from "@/lib/api";
import { getClientUsage, periodFromParam } from "@/lib/usage";
import { priceUsage } from "@/lib/invoicing/calc";
import { ENTRY_HEADER, exportFilename, toCsv, usageRows } from "@/lib/exports/csv";
import { renderTimesheetPdf } from "@/lib/exports/TimesheetPdf";

export async function usageFor(clientId: string, periodParam: unknown, audience: "admin" | "client" = "admin") {
  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { periodStartDay: true } });
  if (!client) throw new HttpError(404, "Client not found");
  const usage = await getClientUsage(clientId, periodFromParam(periodParam, client.periodStartDay), new Date(), { audience });
  if (!usage) throw new HttpError(404, "Client not found");
  return usage;
}

/** Shared by admin and portal routes; callers must have already authorised access to clientId. */
export async function sendExport(
  res: NextApiResponse,
  clientId: string,
  periodParam: unknown,
  format: unknown,
  audience: "admin" | "client" = "admin"
) {
  const usage = await usageFor(clientId, periodParam, audience);
  res.setHeader("Cache-Control", "private, no-store");

  if (format === "pdf") {
    const pdf = await renderTimesheetPdf(usage, priceUsage(usage));
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${exportFilename(usage.client.name, usage.period.start, "pdf")}"`);
    return res.status(200).send(pdf);
  }

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${exportFilename(usage.client.name, usage.period.start, "csv")}"`);
  return res.status(200).send(toCsv([ENTRY_HEADER, ...usageRows(usage)]));
}

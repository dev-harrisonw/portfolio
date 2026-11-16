import prisma from "@/lib/prisma";
import { computeCarry, getBillingPeriod, previousPeriod, type BillingPeriod } from "@/lib/billing";
import { getClientUsage } from "@/lib/usage";
import { priceUsage, type DraftLine } from "@/lib/invoicing/calc";
import { stageAmounts } from "@/lib/projects";
import { HttpError } from "@/lib/api";
import type { Invoice, RolloverPolicy } from "@prisma/client";

const DAY_MS = 86400000;

async function nextInvoiceNumber(now = new Date()) {
  const year = now.getUTCFullYear();
  const prefix = `INV-${year}-`;
  const last = await prisma.invoice.findFirst({
    where: { number: { startsWith: prefix } },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  const seq = last ? parseInt(last.number.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${seq.toString().padStart(4, "0")}`;
}

function lineRows(invoiceId: string, lines: DraftLine[]) {
  return lines.map((line, i) => ({
    invoiceId,
    projectId: line.projectId,
    description: line.description,
    minutes: line.minutes,
    rate: line.rate,
    amount: line.amount,
    sortOrder: i,
  }));
}

export async function snapshotCarry(clientId: string, period: BillingPeriod) {
  const usage = await getClientUsage(clientId, period, new Date(period.end.getTime() - 1));
  if (!usage) return;
  const nextStart = period.end;

  for (const a of usage.allowances) {
    if (a.availableMinutes == null) continue;
    const carriedMinutes = computeCarry(
      a.rolloverPolicy as RolloverPolicy,
      a.rolloverCapHours,
      a.availableMinutes,
      a.usedMinutes
    );
    if (a.scope === "client") {
      await prisma.allowanceCarry.upsert({
        where: { clientId_periodStart: { clientId, periodStart: nextStart } },
        create: { clientId, periodStart: nextStart, carriedMinutes },
        update: { carriedMinutes },
      });
    } else if (a.projectId) {
      await prisma.allowanceCarry.upsert({
        where: { projectId_periodStart: { projectId: a.projectId, periodStart: nextStart } },
        create: { projectId: a.projectId, periodStart: nextStart, carriedMinutes },
        update: { carriedMinutes },
      });
    }
  }
}

/**
 * Rebuild a draft's generated lines from the time on it.
 * `pullUnbilled` also attaches billable time in the period that is not on an invoice yet.
 * Lines added by hand are kept.
 */
export async function refreshPeriodInvoice(invoiceId: string, opts: { pullUnbilled?: boolean; billOverages?: boolean } = {}) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) throw new HttpError(404, "Invoice not found");
  if (invoice.status !== "DRAFT") throw new HttpError(409, "Only a draft invoice can be changed");
  if (!invoice.periodStart || !invoice.periodEnd) throw new HttpError(422, "This invoice is not for a period");

  const period = { start: invoice.periodStart, end: invoice.periodEnd };
  const usage = await getClientUsage(invoice.clientId, period, new Date(period.end.getTime() - 1));
  if (!usage) throw new HttpError(404, "Client not found");

  const periodEntries = await prisma.timeEntry.findMany({
    where: {
      task: { project: { clientId: invoice.clientId, billingType: "TIME" } },
      startedAt: { gte: period.start, lt: period.end },
      endedAt: { not: null },
    },
    select: { id: true, invoiceId: true, billable: true, withheld: true },
  });
  const include = new Set(
    periodEntries.filter((entry) => entry.invoiceId === invoice.id && entry.billable && !entry.withheld).map((entry) => entry.id)
  );
  if (opts.pullUnbilled) {
    for (const entry of periodEntries) {
      if (entry.billable && !entry.withheld && entry.invoiceId == null) include.add(entry.id);
    }
  }

  const billOverages = opts.billOverages ?? invoice.billOverages;
  const draft = priceUsage(
    { ...usage, entries: usage.entries.filter((entry) => include.has(entry.id)) },
    { billOverages }
  );
  const existingLines = await prisma.invoiceLine.findMany({ where: { invoiceId }, orderBy: { sortOrder: "asc" } });
  const manual = existingLines.filter((line) => line.manual);
  const carriedDetail = new Map(existingLines.filter((line) => line.detail).map((line) => [line.description, line.detail]));

  await prisma.$transaction(async (tx) => {
    await tx.invoiceLine.deleteMany({ where: { invoiceId, manual: false } });
    if (draft.lines.length) {
      await tx.invoiceLine.createMany({
        data: lineRows(invoiceId, draft.lines).map((row) => ({ ...row, detail: carriedDetail.get(row.description) ?? "" })),
      });
    }
    for (let i = 0; i < manual.length; i++) {
      await tx.invoiceLine.update({
        where: { id: manual[i].id },
        data: { sortOrder: draft.lines.length + i },
      });
    }
    if (include.size) {
      await tx.timeEntry.updateMany({
        where: { id: { in: [...include] } },
        data: { invoiceId },
      });
    }
    const lines = await tx.invoiceLine.findMany({ where: { invoiceId } });
    const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
    const vat = Math.round((subtotal * invoice.vatRateBps) / 10000);
    await tx.invoice.update({
      where: { id: invoiceId },
      data: { billOverages, subtotal, vat, total: subtotal + vat },
    });
  });

  await snapshotCarry(invoice.clientId, period);
  const updated = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!updated) throw new HttpError(404, "Invoice not found");
  return updated;
}

/**
 * Build (or return) the period invoice for a client. A sent or paid invoice is left as it is.
 * Pass `refresh` to pull new time onto an existing draft. Retainer clients are billed even with
 * no hours; pay-as-you-go needs unbilled entries.
 */
export async function generatePeriodInvoice(
  clientId: string,
  period: BillingPeriod,
  opts: { refresh?: boolean } = {}
): Promise<{ invoice: Invoice | null; created: boolean; updated: boolean; locked: boolean }> {
  const existing = await prisma.invoice.findFirst({
    where: { clientId, kind: "PERIOD", periodStart: period.start, status: { not: "VOID" } },
  });
  if (existing) {
    if (existing.status === "DRAFT" && opts.refresh) {
      return { invoice: await refreshPeriodInvoice(existing.id, { pullUnbilled: true }), created: false, updated: true, locked: false };
    }
    await snapshotCarry(clientId, period);
    return { invoice: existing, created: false, updated: false, locked: existing.status !== "DRAFT" };
  }

  const usage = await getClientUsage(clientId, period, new Date(period.end.getTime() - 1));
  if (!usage) throw new HttpError(404, "Client not found");

  const unbilled = await prisma.timeEntry.findMany({
    where: {
      id: { in: usage.entries.filter((e) => e.billable).map((e) => e.id) },
      invoiceId: null,
    },
    select: { id: true },
  });
  const isRetainer = usage.allowances.some((a) => a.allowanceMinutes != null);
  if (!isRetainer && unbilled.length === 0) return { invoice: null, created: false, updated: false, locked: false };

  const draft = priceUsage(usage);
  const number = await nextInvoiceNumber();
  const dueAt = new Date(period.end.getTime() + 14 * DAY_MS);

  const invoice = await prisma.$transaction(async (tx) => {
    const created = await tx.invoice.create({
      data: {
        clientId,
        number,
        kind: "PERIOD",
        status: "DRAFT",
        periodStart: period.start,
        periodEnd: period.end,
        currency: usage.client.currency,
        billOverages: usage.client.billOverages,
        subtotal: draft.subtotal,
        vatRateBps: draft.vatRateBps,
        vat: draft.vat,
        total: draft.total,
        dueAt,
      },
    });
    if (draft.lines.length) await tx.invoiceLine.createMany({ data: lineRows(created.id, draft.lines) });
    if (unbilled.length) {
      await tx.timeEntry.updateMany({
        where: { id: { in: unbilled.map((e) => e.id) } },
        data: { invoiceId: created.id },
      });
    }
    return created;
  });

  await snapshotCarry(clientId, period);
  return { invoice, created: true, updated: false, locked: false };
}

/** Invoice a fixed-price stage that's been marked reached. One invoice per stage. */
export async function generateStageInvoice(stageId: string): Promise<Invoice> {
  const stage = await prisma.paymentStage.findUnique({
    where: { id: stageId },
    include: { project: { include: { client: true } }, invoice: true },
  });
  if (!stage) throw new HttpError(404, "Stage not found");
  if (stage.invoice && stage.invoice.status !== "VOID") return stage.invoice;
  if (stage.status === "PENDING") throw new HttpError(409, "Mark the stage as reached first");
  if (stage.project.billingType !== "FIXED" || stage.project.fixedPrice == null) {
    throw new HttpError(422, "This project has no fixed price");
  }

  const amounts = stageAmounts(
    stage.project.fixedPrice,
    await prisma.paymentStage.findMany({ where: { projectId: stage.projectId }, orderBy: { sortOrder: "asc" } })
  );
  const siblings = await prisma.paymentStage.findMany({
    where: { projectId: stage.projectId },
    orderBy: { sortOrder: "asc" },
  });
  const amount = amounts[siblings.findIndex((s) => s.id === stage.id)] ?? 0;
  const { client } = stage.project;
  const vat = Math.round((amount * client.vatRateBps) / 10000);
  const number = await nextInvoiceNumber();

  return prisma.$transaction(async (tx) => {
    const created = await tx.invoice.create({
      data: {
        clientId: client.id,
        projectId: stage.projectId,
        number,
        kind: "STAGE",
        status: "DRAFT",
        currency: client.currency,
        subtotal: amount,
        vatRateBps: client.vatRateBps,
        vat,
        total: amount + vat,
        dueAt: new Date(Date.now() + 14 * DAY_MS),
        lines: {
          create: {
            description: `${stage.project.name} — ${stage.label} (${stage.percent}%)`,
            minutes: 0,
            rate: 0,
            amount,
            projectId: stage.projectId,
            sortOrder: 0,
          },
        },
      },
    });
    await tx.paymentStage.update({
      where: { id: stage.id },
      data: { status: "INVOICED", invoiceId: created.id },
    });
    return created;
  });
}

export async function voidInvoice(id: string) {
  const invoice = await prisma.invoice.findUnique({ where: { id }, include: { stages: true } });
  if (!invoice) throw new HttpError(404, "Not found");
  if (invoice.status === "PAID") throw new HttpError(409, "Paid invoices can't be voided");
  await prisma.$transaction([
    prisma.timeEntry.updateMany({ where: { invoiceId: id }, data: { invoiceId: null } }),
    prisma.paymentStage.updateMany({
      where: { invoiceId: id },
      data: { invoiceId: null, status: "DUE" },
    }),
    prisma.invoice.update({ where: { id }, data: { status: "VOID" } }),
  ]);
}

export async function runMonthEnd(now = new Date()) {
  const clients = await prisma.client.findMany({ where: { archived: false }, select: { id: true, periodStartDay: true } });
  const createdIds: string[] = [];
  const skippedIds: string[] = [];

  for (const client of clients) {
    const current = getBillingPeriod(client.periodStartDay, now);
    const period = previousPeriod(current, client.periodStartDay);
    try {
      const { invoice, created } = await generatePeriodInvoice(client.id, period);
      if (created && invoice) createdIds.push(invoice.id);
      else skippedIds.push(client.id);
    } catch (error) {
      console.error("Month-end invoice failed", client.id, error);
    }
  }

  return { created: createdIds.length, skipped: skippedIds.length, createdIds };
}

export type InvoiceWithLines = Invoice & {
  lines: { id: string; description: string; minutes: number; rate: number; amount: number; projectId: string | null }[];
  client: { id: string; name: string; billingEmail: string };
};

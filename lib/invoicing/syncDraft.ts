import prisma from "@/lib/prisma";
import { refreshPeriodInvoice } from "@/lib/invoicing/generate";

/** Rebuild every open draft for a client from the time log. A sent invoice is left as it is. */
export async function syncClientDrafts(clientId: string) {
  const drafts = await prisma.invoice.findMany({
    where: { clientId, kind: "PERIOD", status: "DRAFT", periodStart: { not: null }, periodEnd: { not: null } },
  });
  for (const draft of drafts) {
    if (!draft.periodStart || !draft.periodEnd) continue;
    await prisma.timeEntry.updateMany({
      where: {
        invoiceId: draft.id,
        OR: [
          { billable: false },
          { withheld: true },
          { endedAt: null },
          { startedAt: { lt: draft.periodStart } },
          { startedAt: { gte: draft.periodEnd } },
          { task: { project: { clientId: { not: clientId } } } },
        ],
      },
      data: { invoiceId: null },
    });
  }
  for (const draft of drafts) await refreshPeriodInvoice(draft.id, { pullUnbilled: true });
}

export async function syncDraftsForEntry(entryId: string) {
  const entry = await prisma.timeEntry.findUnique({
    where: { id: entryId },
    select: { task: { select: { project: { select: { clientId: true } } } } },
  });
  if (entry) await syncClientDrafts(entry.task.project.clientId);
}

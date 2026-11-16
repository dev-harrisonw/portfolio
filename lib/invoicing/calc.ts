import { formatMinutes, roundMinutes } from "@/lib/billing";
import type { ClientUsage } from "@/lib/usage";

export type DraftLine = {
  projectId: string | null;
  description: string;
  minutes: number;
  /** Minor units per hour; 0 for fixed-fee lines. */
  rate: number;
  amount: number;
};

export type InvoiceDraft = {
  lines: DraftLine[];
  subtotal: number;
  vatRateBps: number;
  vat: number;
  total: number;
  entryIds: string[];
  /** Hours past the allowance, whether or not this draft charges them. */
  overageMinutes: number;
  /** What those hours would add, in minor units, if charged. */
  overageAmount: number;
};

const amountFor = (minutes: number, rate: number) => Math.round((minutes * rate) / 60);

/**
 * Price a period's usage. Retainer scopes bill the retainer fee (or allowance × rate) plus overage
 * at the hourly rate; pay-as-you-go projects bill hours × rate. Rounding applies per entry.
 * `scale` projects minutes forward (e.g. total days ÷ elapsed days) for dashboard estimates.
 */
export function priceUsage(usage: ClientUsage, opts: { scale?: number; billOverages?: boolean } = {}): InvoiceDraft {
  const scale = opts.scale ?? 1;
  const billOverages = opts.billOverages ?? usage.client.billOverages;
  const { client } = usage;
  const projectById = new Map(usage.projects.map((p) => [p.id, p]));
  const rateFor = (projectId: string) => projectById.get(projectId)?.hourlyRate ?? client.hourlyRate;
  const billable = usage.entries.filter((e) => e.billable);
  const timed = billable.filter((e) => e.amount == null);
  const priced = billable.filter((e) => e.amount != null);
  const ownAllowance = new Set(usage.projects.filter((p) => p.monthlyHours != null).map((p) => p.id));

  const roundedByProject = new Map<string, number>();
  for (const e of timed) {
    roundedByProject.set(e.projectId, (roundedByProject.get(e.projectId) ?? 0) + roundMinutes(e.durationMinutes, client.roundingMinutes));
  }
  const scaled = (m: number) => Math.round(m * scale);

  const lines: DraftLine[] = [];
  let overageMinutes = 0;
  let overageAmount = 0;

  for (const allowance of usage.allowances) {
    const projectIds =
      allowance.scope === "project"
        ? [allowance.projectId!]
        : usage.projects.filter((p) => !ownAllowance.has(p.id)).map((p) => p.id);
    const used = scaled(projectIds.reduce((s, id) => s + (roundedByProject.get(id) ?? 0), 0));

    if (allowance.allowanceMinutes == null) {
      for (const id of projectIds) {
        const minutes = scaled(roundedByProject.get(id) ?? 0);
        if (minutes <= 0) continue;
        const rate = rateFor(id);
        lines.push({ projectId: id, description: `${projectById.get(id)?.name ?? "Work"} — ${formatMinutes(minutes)}`, minutes, rate, amount: amountFor(minutes, rate) });
      }
      continue;
    }

    const rate = allowance.scope === "project" ? rateFor(allowance.projectId!) : client.hourlyRate;
    const fee =
      allowance.scope === "client" && client.retainerAmount != null
        ? client.retainerAmount
        : amountFor(allowance.allowanceMinutes, rate);
    lines.push({
      projectId: allowance.projectId,
      description: `${allowance.scope === "project" ? `${allowance.label} retainer` : "Monthly retainer"} — ${formatMinutes(allowance.allowanceMinutes)} included`,
      minutes: 0,
      rate: 0,
      amount: fee,
    });

    const available = allowance.allowanceMinutes + allowance.carriedInMinutes;
    const overage = Math.max(0, used - available);
    // The hours are always tracked. Charging them is a choice on the invoice.
    if (overage > 0) {
      const amount = amountFor(overage, rate);
      overageMinutes += overage;
      overageAmount += amount;
      if (billOverages) {
        lines.push({
          projectId: allowance.projectId,
          description: `Additional hours${allowance.scope === "project" ? ` (${allowance.label})` : ""} — ${formatMinutes(overage)}`,
          minutes: overage,
          rate,
          amount,
        });
      }
    }
  }

  for (const e of priced) {
    lines.push({
      projectId: e.projectId,
      description: e.note.trim() || e.taskTitle,
      minutes: 0,
      rate: 0,
      amount: e.amount ?? 0,
    });
  }

  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  const vat = Math.round((subtotal * client.vatRateBps) / 10000);
  return {
    lines,
    subtotal,
    vatRateBps: client.vatRateBps,
    vat,
    total: subtotal + vat,
    entryIds: [...timed, ...priced].map((e) => e.id),
    overageMinutes,
    overageAmount,
  };
}

/** Scale factor that projects current-period usage to the end of the period. */
export function projectionScale(usage: ClientUsage) {
  const { total, elapsed } = usage.period.days;
  return usage.period.isCurrent && elapsed > 0 ? total / elapsed : 1;
}

import type { RolloverPolicy } from "@prisma/client";

/**
 * Billing period maths. All dates are UTC; a period is [start, end) where end is the next
 * period's start.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export type BillingPeriod = { start: Date; end: Date };

function clampStartDay(day: number) {
  return Math.min(Math.max(Math.trunc(day) || 1, 1), 28);
}

export function getBillingPeriod(startDay: number, ref: Date = new Date()): BillingPeriod {
  const day = clampStartDay(startDay);
  const year = ref.getUTCFullYear();
  let month = ref.getUTCMonth();
  if (ref.getUTCDate() < day) month -= 1;
  const start = new Date(Date.UTC(year, month, day));
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, day));
  return { start, end };
}

export function previousPeriod(period: BillingPeriod, startDay: number): BillingPeriod {
  return getBillingPeriod(startDay, new Date(period.start.getTime() - DAY_MS));
}

export function shiftPeriod(startDay: number, ref: Date, offsetMonths: number): BillingPeriod {
  const current = getBillingPeriod(startDay, ref);
  const shifted = new Date(
    Date.UTC(current.start.getUTCFullYear(), current.start.getUTCMonth() + offsetMonths, clampStartDay(startDay))
  );
  return getBillingPeriod(startDay, shifted);
}

export function periodDays(period: BillingPeriod, now: Date = new Date()) {
  const total = Math.round((period.end.getTime() - period.start.getTime()) / DAY_MS);
  const elapsedMs = Math.min(Math.max(now.getTime() - period.start.getTime(), 0), period.end.getTime() - period.start.getTime());
  const elapsed = Math.min(total, Math.max(1, Math.ceil(elapsedMs / DAY_MS)));
  return { total, elapsed, left: Math.max(0, total - elapsed) };
}

export type PaceStatus = "no-allowance" | "under" | "on-track" | "over";

/** Projected usage = used ÷ days elapsed × total days. */
export function computePace(usedMinutes: number, availableMinutes: number | null, period: BillingPeriod, now: Date = new Date()) {
  const { total, elapsed } = periodDays(period, now);
  const projectedMinutes = Math.round((usedMinutes / elapsed) * total);

  if (availableMinutes == null || availableMinutes <= 0) {
    return { status: "no-allowance" as PaceStatus, projectedMinutes, runOutDate: null as Date | null };
  }

  let runOutDate: Date | null = null;
  if (usedMinutes > 0 && projectedMinutes > availableMinutes) {
    const perDay = usedMinutes / elapsed;
    const daysToRunOut = availableMinutes / perDay;
    runOutDate = new Date(period.start.getTime() + Math.floor(daysToRunOut) * DAY_MS);
  }

  const ratio = projectedMinutes / availableMinutes;
  const status: PaceStatus = ratio > 1.05 ? "over" : ratio < 0.75 ? "under" : "on-track";
  return { status, projectedMinutes, runOutDate };
}

type AllowanceSource = {
  monthlyHours: number | null;
  rolloverPolicy: RolloverPolicy | null;
  rolloverCapHours: number | null;
};

/** A project with its own allowance uses its own rollover settings, falling back to the client's policy. */
export function resolveAllowance(client: AllowanceSource & { rolloverPolicy: RolloverPolicy }, project?: AllowanceSource | null) {
  if (project?.monthlyHours != null) {
    return {
      scope: "project" as const,
      allowanceMinutes: project.monthlyHours * 60,
      rolloverPolicy: project.rolloverPolicy ?? client.rolloverPolicy,
      rolloverCapHours: project.rolloverCapHours ?? client.rolloverCapHours,
    };
  }
  return {
    scope: "client" as const,
    allowanceMinutes: client.monthlyHours != null ? client.monthlyHours * 60 : null,
    rolloverPolicy: client.rolloverPolicy,
    rolloverCapHours: client.rolloverCapHours,
  };
}

/** Minutes carried into the next period. Overage is billed, never carried as a negative balance. */
export function computeCarry(policy: RolloverPolicy, capHours: number | null, availableMinutes: number, usedMinutes: number) {
  const unused = Math.max(0, availableMinutes - usedMinutes);
  if (policy === "EXPIRE") return 0;
  if (policy === "ROLLOVER_CAPPED") return Math.min(unused, Math.max(0, capHours ?? 0) * 60);
  return unused;
}

export function roundMinutes(minutes: number, step: number) {
  if (!step || step <= 0) return minutes;
  return Math.ceil(minutes / step) * step;
}

export function formatMinutes(minutes: number) {
  const sign = minutes < 0 ? "-" : "";
  const abs = Math.abs(Math.round(minutes));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${h}h ${m.toString().padStart(2, "0")}m`;
}

export function formatMoney(minor: number, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(minor / 100);
}

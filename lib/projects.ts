import type { PaymentTerms } from "@prisma/client";

export const PAYMENT_TERMS: Record<PaymentTerms, { label: string; stages: { label: string; percent: number }[] }> = {
  FIFTY_FIFTY: {
    label: "50% deposit, 50% on completion",
    stages: [
      { label: "Deposit", percent: 50 },
      { label: "Completion", percent: 50 },
    ],
  },
  UPFRONT: { label: "100% upfront", stages: [{ label: "Payment in full", percent: 100 }] },
  ON_COMPLETION: { label: "100% on completion", stages: [{ label: "On completion", percent: 100 }] },
  FORTY_THIRTY_THIRTY: {
    label: "40% deposit, 30% design sign-off, 30% launch",
    stages: [
      { label: "Deposit", percent: 40 },
      { label: "Design sign-off", percent: 30 },
      { label: "Launch", percent: 30 },
    ],
  },
  CUSTOM: { label: "Custom stages", stages: [] },
};

/** Stage amounts in minor units; the last stage absorbs rounding so they always sum to the price. */
export function stageAmounts(price: number, stages: { percent: number }[]) {
  const amounts = stages.map((s) => Math.round((price * s.percent) / 100));
  const totalPercent = stages.reduce((sum, s) => sum + s.percent, 0);
  if (amounts.length && totalPercent === 100) {
    amounts[amounts.length - 1] += price - amounts.reduce((a, b) => a + b, 0);
  }
  return amounts;
}

export function projectProgress(tasks: { status: string }[], override: number | null) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "DONE").length;
  const computed = total ? Math.round((done / total) * 100) : 0;
  return { percent: override ?? computed, computed, done, total, isOverride: override != null };
}

import prisma from "@/lib/prisma";

const DAY_MS = 86400000;

export type MoneyBucket = { currency: string; amount: number; count: number };

export type FinanceInvoice = {
  id: string;
  number: string;
  status: "DRAFT" | "SENT" | "PAID";
  kind: "PERIOD" | "STAGE";
  total: number;
  currency: string;
  dueAt: string | null;
  paidAt: string | null;
  createdAt: string;
  client: { id: string; name: string };
};

export type AgingBucket = { id: string; label: string; amount: number; count: number };

export type ClientFinance = {
  id: string;
  name: string;
  currency: string;
  outstanding: number;
  overdue: number;
  collectedYear: number;
};

function add(map: Map<string, { amount: number; count: number }>, currency: string, amount: number) {
  const cur = map.get(currency) ?? { amount: 0, count: 0 };
  cur.amount += amount;
  cur.count += 1;
  map.set(currency, cur);
}

function buckets(map: Map<string, { amount: number; count: number }>): MoneyBucket[] {
  return [...map.entries()]
    .map(([currency, v]) => ({ currency, ...v }))
    .sort((a, b) => b.amount - a.amount);
}

function monthStartUtc(ref: Date, offset = 0) {
  return new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() + offset, 1));
}

function iso(d: Date | null) {
  return d ? d.toISOString() : null;
}

function minutesByBillable(rows: { billable: boolean; _sum: { durationMinutes: number | null } }[]) {
  let billable = 0;
  let nonBillable = 0;
  for (const row of rows) {
    const mins = row._sum.durationMinutes ?? 0;
    if (row.billable) billable += mins;
    else nonBillable += mins;
  }
  return { billable, nonBillable };
}

export function formatBuckets(list: MoneyBucket[]) {
  if (list.length === 0) return { currency: "GBP", amount: 0, count: 0, buckets: [] as MoneyBucket[] };
  return { ...list[0], buckets: list };
}

export async function getFinanceSnapshot(now = new Date()) {
  const start = monthStartUtc(now);
  const end = monthStartUtc(now, 1);
  const [invoices, monthExpenses] = await Promise.all([
    prisma.invoice.findMany({
      where: { status: { in: ["DRAFT", "SENT", "PAID"] } },
      select: { status: true, total: true, currency: true, dueAt: true, paidAt: true },
    }),
    prisma.expense.findMany({
      where: { date: { gte: start, lt: end } },
      select: { amount: true, currency: true },
    }),
  ]);

  const collected = new Map<string, { amount: number; count: number }>();
  const outstanding = new Map<string, { amount: number; count: number }>();
  const overdue = new Map<string, { amount: number; count: number }>();
  const drafts = new Map<string, { amount: number; count: number }>();
  const spent = new Map<string, { amount: number; count: number }>();
  const nowMs = now.getTime();

  for (const inv of invoices) {
    if (inv.status === "PAID") {
      const paid = inv.paidAt ?? null;
      if (paid && paid >= start && paid < end) add(collected, inv.currency, inv.total);
    } else if (inv.status === "SENT") {
      add(outstanding, inv.currency, inv.total);
      if (inv.dueAt && inv.dueAt.getTime() < nowMs) add(overdue, inv.currency, inv.total);
    } else {
      add(drafts, inv.currency, inv.total);
    }
  }
  for (const exp of monthExpenses) add(spent, exp.currency, exp.amount);

  const collectedThisMonth = formatBuckets(buckets(collected));
  const spentThisMonth = formatBuckets(buckets(spent));
  const netAmount = collectedThisMonth.amount - spentThisMonth.amount;

  return {
    collectedThisMonth,
    spentThisMonth,
    netThisMonth: {
      currency: collectedThisMonth.currency,
      amount: netAmount,
      count: collectedThisMonth.count + spentThisMonth.count,
      buckets: [{ currency: collectedThisMonth.currency, amount: netAmount, count: 1 }],
    },
    outstanding: formatBuckets(buckets(outstanding)),
    overdue: formatBuckets(buckets(overdue)),
    drafts: formatBuckets(buckets(drafts)),
    monthLabel: start.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }),
  };
}

export async function getFinanceDashboard(now = new Date()) {
  const thisMonth = monthStartUtc(now);
  const nextMonth = monthStartUtc(now, 1);
  const lastMonth = monthStartUtc(now, -1);
  const chartStart = monthStartUtc(now, -11);
  const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));

  const [invoices, thisTime, lastTime, snapshot, expenseHistory, recentExpenses] = await Promise.all([
    prisma.invoice.findMany({
      where: { status: { in: ["DRAFT", "SENT", "PAID"] } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        number: true,
        status: true,
        kind: true,
        total: true,
        currency: true,
        dueAt: true,
        paidAt: true,
        createdAt: true,
        client: { select: { id: true, name: true } },
      },
    }),
    prisma.timeEntry.groupBy({
      by: ["billable"],
      where: { startedAt: { gte: thisMonth, lt: nextMonth }, endedAt: { not: null } },
      _sum: { durationMinutes: true },
    }),
    prisma.timeEntry.groupBy({
      by: ["billable"],
      where: { startedAt: { gte: lastMonth, lt: thisMonth }, endedAt: { not: null } },
      _sum: { durationMinutes: true },
    }),
    getFinanceSnapshot(now),
    prisma.expense.findMany({
      where: { date: { gte: chartStart } },
      select: { date: true, amount: true },
    }),
    prisma.expense.findMany({
      orderBy: { date: "desc" },
      take: 8,
      include: { client: { select: { id: true, name: true } } },
    }),
  ]);

  const nowMs = now.getTime();
  const aging: AgingBucket[] = [
    { id: "current", label: "Not yet due", amount: 0, count: 0 },
    { id: "1-30", label: "1–30 days", amount: 0, count: 0 },
    { id: "31-60", label: "31–60 days", amount: 0, count: 0 },
    { id: "61+", label: "61+ days", amount: 0, count: 0 },
  ];
  const byClient = new Map<string, ClientFinance>();
  const monthBars = Array.from({ length: 12 }, (_, i) => {
    const start = monthStartUtc(now, i - 11);
    return {
      key: start.toISOString().slice(0, 7),
      label: start.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }),
      title: start.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }),
      collected: 0,
      spent: 0,
      highlight: i === 11,
    };
  });
  const barIndex = new Map(monthBars.map((b, i) => [b.key, i]));

  const serialize = (inv: (typeof invoices)[number]): FinanceInvoice => ({
    id: inv.id,
    number: inv.number,
    status: inv.status as FinanceInvoice["status"],
    kind: inv.kind,
    total: inv.total,
    currency: inv.currency,
    dueAt: iso(inv.dueAt),
    paidAt: iso(inv.paidAt),
    createdAt: inv.createdAt.toISOString(),
    client: inv.client,
  });

  const overdueList: FinanceInvoice[] = [];
  const paidAll: FinanceInvoice[] = [];

  for (const inv of invoices) {
    const client = byClient.get(inv.client.id) ?? {
      id: inv.client.id,
      name: inv.client.name,
      currency: inv.currency,
      outstanding: 0,
      overdue: 0,
      collectedYear: 0,
    };

    if (inv.status === "PAID") {
      const paid = inv.paidAt ?? inv.createdAt;
      if (paid >= yearStart) client.collectedYear += inv.total;
      if (paid >= chartStart) {
        const idx = barIndex.get(paid.toISOString().slice(0, 7));
        if (idx != null) monthBars[idx].collected += inv.total;
      }
      paidAll.push(serialize(inv));
    } else if (inv.status === "SENT") {
      client.outstanding += inv.total;
      const overdue = inv.dueAt && inv.dueAt.getTime() < nowMs;
      if (overdue) {
        client.overdue += inv.total;
        overdueList.push(serialize(inv));
        const days = Math.floor((nowMs - inv.dueAt!.getTime()) / DAY_MS);
        const bucket = days > 60 ? aging[3] : days > 30 ? aging[2] : aging[1];
        bucket.amount += inv.total;
        bucket.count += 1;
      } else {
        aging[0].amount += inv.total;
        aging[0].count += 1;
      }
    }

    byClient.set(inv.client.id, client);
  }

  for (const exp of expenseHistory) {
    const idx = barIndex.get(exp.date.toISOString().slice(0, 7));
    if (idx != null) monthBars[idx].spent += exp.amount;
  }

  overdueList.sort((a, b) => (a.dueAt ?? "").localeCompare(b.dueAt ?? ""));
  const paidRecent = paidAll
    .sort((a, b) => (b.paidAt ?? b.createdAt).localeCompare(a.paidAt ?? a.createdAt))
    .slice(0, 8);

  const thisHours = minutesByBillable(thisTime);
  const lastHours = minutesByBillable(lastTime);
  const utilisation = (h: { billable: number; nonBillable: number }) => {
    const total = h.billable + h.nonBillable;
    return { ...h, total, percent: total ? Math.round((h.billable / total) * 100) : 0 };
  };

  const clients = [...byClient.values()]
    .filter((c) => c.outstanding > 0 || c.collectedYear > 0)
    .sort((a, b) => b.outstanding - a.outstanding || b.collectedYear - a.collectedYear);

  return {
    ...snapshot,
    aging,
    monthBars,
    clients,
    overdueInvoices: overdueList,
    recentPaid: paidRecent,
    recentExpenses: recentExpenses.map((e) => ({
      id: e.id,
      date: e.date.toISOString(),
      vendor: e.vendor,
      category: e.category,
      amount: e.amount,
      currency: e.currency,
      client: e.client,
    })),
    utilisation: {
      thisMonth: utilisation(thisHours),
      lastMonth: utilisation(lastHours),
      lastMonthLabel: lastMonth.toLocaleDateString("en-GB", { month: "long", timeZone: "UTC" }),
    },
    currency: snapshot.collectedThisMonth.currency,
  };
}

export type FinanceSnapshot = Awaited<ReturnType<typeof getFinanceSnapshot>>;
export type FinanceDashboard = Awaited<ReturnType<typeof getFinanceDashboard>>;

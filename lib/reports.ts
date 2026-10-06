import prisma from "@/lib/prisma";
import { expenseCategoryLabel, type ExpenseCategory } from "@/lib/expenses";

function yearStartUtc(now: Date) {
  return new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
}

export async function getReportsDashboard(now = new Date()) {
  const start = yearStartUtc(now);
  const [paid, expenses, timeRows, clients] = await Promise.all([
    prisma.invoice.findMany({
      where: { status: "PAID", paidAt: { gte: start } },
      select: { total: true, currency: true, clientId: true, client: { select: { name: true } } },
    }),
    prisma.expense.findMany({
      where: { date: { gte: start } },
      select: { amount: true, currency: true, category: true, clientId: true },
    }),
    prisma.timeEntry.groupBy({
      by: ["billable"],
      where: { startedAt: { gte: start }, endedAt: { not: null } },
      _sum: { durationMinutes: true },
    }),
    prisma.client.findMany({
      where: { archived: false },
      orderBy: { name: "asc" },
      select: { id: true, name: true, currency: true },
    }),
  ]);

  const hoursByClient = await prisma.timeEntry.findMany({
    where: { startedAt: { gte: start }, endedAt: { not: null } },
    select: {
      durationMinutes: true,
      billable: true,
      task: { select: { project: { select: { clientId: true } } } },
    },
  });

  type Row = {
    id: string;
    name: string;
    currency: string;
    collected: number;
    spent: number;
    hours: number;
    billableHours: number;
  };
  const rows = new Map<string, Row>();
  const ensure = (id: string, name: string, currency: string) => {
    const existing = rows.get(id);
    if (existing) return existing;
    const created: Row = { id, name, currency, collected: 0, spent: 0, hours: 0, billableHours: 0 };
    rows.set(id, created);
    return created;
  };

  for (const c of clients) ensure(c.id, c.name, c.currency);
  for (const inv of paid) {
    const row = ensure(inv.clientId, inv.client.name, inv.currency);
    row.collected += inv.total;
  }
  const overhead = { amount: 0, currency: "GBP", count: 0 };
  const byCategory = new Map<string, number>();
  for (const exp of expenses) {
    byCategory.set(exp.category, (byCategory.get(exp.category) ?? 0) + exp.amount);
    if (exp.clientId) {
      const client = clients.find((c) => c.id === exp.clientId);
      ensure(exp.clientId, client?.name ?? "Client", exp.currency).spent += exp.amount;
    } else {
      overhead.amount += exp.amount;
      overhead.currency = exp.currency;
      overhead.count += 1;
    }
  }
  for (const e of hoursByClient) {
    const id = e.task.project.clientId;
    const row = rows.get(id);
    if (!row) continue;
    row.hours += e.durationMinutes;
    if (e.billable) row.billableHours += e.durationMinutes;
  }

  let billable = 0;
  let nonBillable = 0;
  for (const t of timeRows) {
    const mins = t._sum.durationMinutes ?? 0;
    if (t.billable) billable += mins;
    else nonBillable += mins;
  }
  const totalMins = billable + nonBillable;

  const clientRows = [...rows.values()]
    .map((r) => ({ ...r, net: r.collected - r.spent }))
    .filter((r) => r.collected > 0 || r.spent > 0 || r.hours > 0)
    .sort((a, b) => b.net - a.net);

  const collected = paid.reduce((s, i) => s + i.total, 0);
  const spent = expenses.reduce((s, e) => s + e.amount, 0);

  return {
    year: start.getUTCFullYear(),
    totals: {
      collected,
      spent,
      net: collected - spent,
      overhead: overhead.amount,
      billable,
      nonBillable,
      utilisation: totalMins ? Math.round((billable / totalMins) * 100) : 0,
      currency: clientRows[0]?.currency ?? "GBP",
    },
    clients: clientRows,
    categories: [...byCategory.entries()]
      .map(([category, amount]) => ({
        category: category as ExpenseCategory,
        label: expenseCategoryLabel[category as ExpenseCategory] ?? category,
        amount,
      }))
      .sort((a, b) => b.amount - a.amount),
  };
}

export type ReportsDashboard = Awaited<ReturnType<typeof getReportsDashboard>>;

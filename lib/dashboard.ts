import prisma from "@/lib/prisma";
import { getClientUsage, type ClientUsage } from "@/lib/usage";
import { priceUsage, projectionScale } from "@/lib/invoicing/calc";
import { entryInclude, getPickerTree, getRunningEntry } from "@/lib/time";

export type ClientCard = {
  id: string;
  name: string;
  currency: string;
  allowance: ClientUsage["allowances"][number];
  extraAllowances: ClientUsage["allowances"];
  days: ClientUsage["period"]["days"];
  periodStart: string;
  periodEnd: string;
  billableMinutes: number;
  soFar: number;
  projected: number;
  hasTime: boolean;
  builds: ClientUsage["builds"];
};

const DAY_MS = 86400000;

export async function getAdminDashboard(now: Date = new Date()) {
  const clients = await prisma.client.findMany({ where: { archived: false }, orderBy: { name: "asc" }, select: { id: true } });
  const usages = (await Promise.all(clients.map((c) => getClientUsage(c.id, undefined, now)))).filter(Boolean) as ClientUsage[];

  const cards: ClientCard[] = usages.map((u) => ({
    id: u.client.id,
    name: u.client.name,
    currency: u.client.currency,
    allowance: u.allowances[0],
    extraAllowances: u.allowances.slice(1),
    days: u.period.days,
    periodStart: u.period.start,
    periodEnd: u.period.end,
    billableMinutes: u.totals.billableMinutes,
    soFar: priceUsage(u).subtotal,
    projected: priceUsage(u, { scale: projectionScale(u) }).subtotal,
    hasTime: u.client.monthlyHours != null || u.projects.length > 0,
    builds: u.builds,
  }));

  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  const [monthEntries, recent, running, pickerTree] = await Promise.all([
    prisma.timeEntry.findMany({
      where: { startedAt: { gte: monthStart, lt: monthEnd }, endedAt: { not: null } },
      select: { startedAt: true, durationMinutes: true, billable: true, task: { select: { project: { select: { clientId: true } } } } },
    }),
    prisma.timeEntry.findMany({ where: { endedAt: { not: null } }, orderBy: { startedAt: "desc" }, take: 30, include: entryInclude }),
    getRunningEntry(),
    getPickerTree(),
  ]);

  const daysInMonth = Math.round((monthEnd.getTime() - monthStart.getTime()) / DAY_MS);
  const daily = Array.from({ length: daysInMonth }, (_, i) => ({
    date: new Date(monthStart.getTime() + i * DAY_MS).toISOString().slice(0, 10),
    billable: 0,
    nonBillable: 0,
  }));
  const byClient = new Map<string, number>();
  for (const e of monthEntries) {
    const day = daily[Math.floor((e.startedAt.getTime() - monthStart.getTime()) / DAY_MS)];
    if (day) e.billable ? (day.billable += e.durationMinutes) : (day.nonBillable += e.durationMinutes);
    const cid = e.task.project.clientId;
    byClient.set(cid, (byClient.get(cid) ?? 0) + e.durationMinutes);
  }

  const seen = new Set<string>();
  const quickStart = recent
    .filter((e) => e.task.status !== "DONE" && !seen.has(e.taskId) && seen.add(e.taskId))
    .slice(0, 6)
    .map((e) => ({ taskId: e.taskId, title: e.task.title, project: e.task.project.name, client: e.task.project.client.name }));

  const names = new Map(usages.map((u) => [u.client.id, u.client.name]));

  return {
    totals: {
      billableMinutes: usages.reduce((s, u) => s + u.totals.billableMinutes, 0),
      nonBillableMinutes: usages.reduce((s, u) => s + u.totals.nonBillableMinutes, 0),
      soFar: cards.reduce((s, c) => s + c.soFar, 0),
      projected: cards.reduce((s, c) => s + c.projected, 0),
    },
    cards,
    daily,
    byClient: [...byClient.entries()]
      .map(([id, minutes]) => ({ id, name: names.get(id) ?? "Archived client", minutes }))
      .sort((a, b) => b.minutes - a.minutes),
    recent: recent.slice(0, 8),
    quickStart,
    running,
    pickerTree,
    monthLabel: monthStart.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }),
  };
}

export type AdminDashboard = Awaited<ReturnType<typeof getAdminDashboard>>;

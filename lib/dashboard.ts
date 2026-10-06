import prisma from "@/lib/prisma";
import { getClientUsage, type ClientUsage } from "@/lib/usage";
import { priceUsage, projectionScale } from "@/lib/invoicing/calc";
import { entryInclude, getPickerTree, getRunningEntry } from "@/lib/time";
import { formatMoney, formatMinutes } from "@/lib/billing";
import { portalStatus } from "@/lib/clients";
import { getFinanceSnapshot } from "@/lib/finance";
import { listActivity } from "@/lib/activity";

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

export type DashboardNudge = {
  id: string;
  tone: "red" | "yellow";
  label: string;
  title: string;
  href: string;
  detail: string;
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

  const [openInvoices, portalClients, finance, newLeads, overdueProjects, activity] = await Promise.all([
    prisma.invoice.findMany({
      where: { status: { in: ["DRAFT", "SENT"] } },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: {
        id: true,
        number: true,
        status: true,
        total: true,
        currency: true,
        dueAt: true,
        client: { select: { id: true, name: true } },
      },
    }),
    prisma.client.findMany({
      where: { archived: false },
      select: { id: true, name: true, users: { select: { clerkUserId: true } } },
    }),
    getFinanceSnapshot(now),
    prisma.lead.count({ where: { status: "NEW" } }),
    prisma.project.findMany({
      where: { status: "ACTIVE", dueDate: { lt: now }, client: { archived: false } },
      select: { id: true, name: true, dueDate: true, client: { select: { id: true, name: true } } },
      take: 10,
    }),
    listActivity(12),
  ]);

  const nowMs = now.getTime();
  const nudges: DashboardNudge[] = [];

  for (const inv of openInvoices) {
    const overdue = inv.status === "SENT" && inv.dueAt && new Date(inv.dueAt).getTime() < nowMs;
    if (overdue) {
      nudges.push({
        id: `overdue-${inv.id}`,
        tone: "red",
        label: "Overdue",
        title: `${inv.client.name} · ${inv.number}`,
        href: `/admin/invoices/${inv.id}`,
        detail: `${formatMoney(inv.total, inv.currency)} unpaid`,
      });
    } else if (inv.status === "SENT") {
      nudges.push({
        id: `unpaid-${inv.id}`,
        tone: "yellow",
        label: "Awaiting payment",
        title: `${inv.client.name} · ${inv.number}`,
        href: `/admin/invoices/${inv.id}`,
        detail: formatMoney(inv.total, inv.currency),
      });
    } else {
      nudges.push({
        id: `draft-${inv.id}`,
        tone: "yellow",
        label: "Ready to send",
        title: `${inv.client.name} · ${inv.number}`,
        href: `/admin/invoices/${inv.id}`,
        detail: formatMoney(inv.total, inv.currency),
      });
    }
  }

  for (const card of cards) {
    if (card.allowance.overageMinutes > 0) {
      nudges.push({
        id: `over-${card.id}`,
        tone: "red",
        label: "Over allowance",
        title: card.name,
        href: `/admin/clients/${card.id}`,
        detail: `${formatMinutes(card.allowance.overageMinutes)} over this period`,
      });
    } else if (card.allowance.pace.status === "over") {
      nudges.push({
        id: `pace-${card.id}`,
        tone: "yellow",
        label: "On track to overage",
        title: card.name,
        href: `/admin/clients/${card.id}`,
        detail: "Usage is pacing above the retainer",
      });
    }
    for (const b of card.builds) {
      const due = b.stages.filter((st) => st.status === "DUE").length;
      if (due > 0) {
        nudges.push({
          id: `stage-${b.id}`,
          tone: "yellow",
          label: "Stage due",
          title: `${card.name} · ${b.name}`,
          href: `/admin/clients/${card.id}`,
          detail: `${due} payment stage${due > 1 ? "s" : ""} ready to invoice`,
        });
      }
    }
  }

  for (const c of portalClients) {
    if (portalStatus(c.users) === "none") {
      nudges.push({
        id: `portal-${c.id}`,
        tone: "yellow",
        label: "No portal access",
        title: c.name,
        href: `/admin/clients/${c.id}`,
        detail: "Invite them so they can see hours and pay invoices",
      });
    }
  }

  if (newLeads > 0) {
    nudges.push({
      id: "leads-new",
      tone: "yellow",
      label: "New leads",
      title: `${newLeads} waiting`,
      href: "/admin/leads",
      detail: "Review hire enquiries and move them through the pipeline",
    });
  }

  for (const p of overdueProjects) {
    nudges.push({
      id: `dueproj-${p.id}`,
      tone: "red",
      label: "Due date passed",
      title: `${p.client.name} · ${p.name}`,
      href: "/admin/work",
      detail: p.dueDate
        ? `Due ${p.dueDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}`
        : "Past the due date",
    });
  }

  const rank = { Overdue: 0, "Due date passed": 1, "Over allowance": 2, "Awaiting payment": 3, "Stage due": 4, "On track to overage": 5, "Ready to send": 6, "New leads": 7, "No portal access": 8 };
  nudges.sort((a, b) => (rank[a.label as keyof typeof rank] ?? 9) - (rank[b.label as keyof typeof rank] ?? 9));

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
    nudges: nudges.slice(0, 8),
    finance,
    activity: activity.map((a) => ({
      id: a.id,
      type: a.type,
      message: a.message,
      href: a.href,
      createdAt: a.createdAt.toISOString(),
      client: a.client,
    })),
  };
}

export type AdminDashboard = Awaited<ReturnType<typeof getAdminDashboard>>;

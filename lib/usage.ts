import prisma from "@/lib/prisma";
import { computePace, getBillingPeriod, periodDays, resolveAllowance, type BillingPeriod } from "@/lib/billing";
import { projectProgress, stageAmounts } from "@/lib/projects";

export type AllowanceUsage = {
  scope: "client" | "project";
  projectId: string | null;
  label: string;
  allowanceMinutes: number | null;
  carriedInMinutes: number;
  availableMinutes: number | null;
  usedMinutes: number;
  remainingMinutes: number | null;
  overageMinutes: number;
  rolloverPolicy: string;
  rolloverCapHours: number | null;
  pace: { status: string; projectedMinutes: number; runOutDate: string | null };
};

export type UsageEntry = {
  id: string;
  startedAt: string;
  durationMinutes: number;
  note: string;
  billable: boolean;
  taskId: string;
  taskTitle: string;
  projectId: string;
  projectName: string;
};

export type ClientUsage = {
  client: {
    id: string;
    name: string;
    billingEmail: string;
    currency: string;
    hourlyRate: number;
    monthlyHours: number | null;
    retainerAmount: number | null;
    periodStartDay: number;
    roundingMinutes: number;
    vatRateBps: number;
  };
  projects: { id: string; name: string; hourlyRate: number | null; monthlyHours: number | null }[];
  period: { start: string; end: string; days: { total: number; elapsed: number; left: number }; isCurrent: boolean };
  totals: { minutes: number; billableMinutes: number; nonBillableMinutes: number };
  allowances: AllowanceUsage[];
  byProject: {
    projectId: string;
    name: string;
    minutes: number;
    billableMinutes: number;
    tasks: { taskId: string; title: string; status: string; minutes: number }[];
  }[];
  completedTasks: { id: string; title: string; projectName: string; completedAt: string }[];
  entries: UsageEntry[];
  builds: BuildProgress[];
};

export type BuildProgress = {
  id: string;
  name: string;
  status: string;
  progress: { percent: number; computed: number; done: number; total: number; isOverride: boolean };
  startDate: string | null;
  dueDate: string | null;
  fixedPrice: number | null;
  paymentTerms: string | null;
  stages: { id: string; label: string; percent: number; amount: number; status: string; reachedAt: string | null }[];
  upcomingTasks: { id: string; title: string; status: string }[];
  /** Admin only: hours logged against the build, for profitability. Always 0 for clients. */
  internalMinutes: number;
};

type UsageOptions = { audience?: "admin" | "client" };

/**
 * Finished entries only; a running timer isn't counted until it stops. Hours-based figures cover
 * TIME projects; FIXED builds are reported as progress in `builds`.
 */
export async function getClientUsage(
  clientId: string,
  period?: BillingPeriod,
  now: Date = new Date(),
  { audience = "admin" }: UsageOptions = {}
): Promise<ClientUsage | null> {
  const found = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      projects: {
        include: {
          tasks: { select: { id: true, title: true, status: true, createdAt: true }, orderBy: { createdAt: "asc" } },
          stages: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });
  if (!found) return null;
  const fixedProjects = found.projects.filter((pr) => pr.billingType === "FIXED");
  const client = { ...found, projects: found.projects.filter((pr) => pr.billingType === "TIME") };

  const current = getBillingPeriod(client.periodStartDay, now);
  const p = period ?? current;
  const isCurrent = p.start.getTime() === current.start.getTime();
  const paceNow = isCurrent ? now : new Date(p.end.getTime() - 1);

  const [entries, carries, completed, fixedMinutes] = await Promise.all([
    prisma.timeEntry.findMany({
      where: {
        task: { project: { clientId, billingType: "TIME" } },
        startedAt: { gte: p.start, lt: p.end },
        endedAt: { not: null },
      },
      orderBy: { startedAt: "asc" },
      include: { task: { include: { project: true } } },
    }),
    prisma.allowanceCarry.findMany({
      where: { periodStart: p.start, OR: [{ clientId }, { projectId: { in: client.projects.map((pr) => pr.id) } }] },
    }),
    prisma.task.findMany({
      where: { project: { clientId }, completedAt: { gte: p.start, lt: p.end } },
      orderBy: { completedAt: "desc" },
      include: { project: { select: { name: true } } },
    }),
    audience === "admin" && fixedProjects.length
      ? prisma.timeEntry.groupBy({
          by: ["taskId"],
          where: { task: { projectId: { in: fixedProjects.map((pr) => pr.id) } }, endedAt: { not: null } },
          _sum: { durationMinutes: true },
        })
      : Promise.resolve([]),
  ]);

  const taskProject = new Map(fixedProjects.flatMap((pr) => pr.tasks.map((t) => [t.id, pr.id] as const)));
  const minutesByBuild = new Map<string, number>();
  for (const row of fixedMinutes) {
    const pid = taskProject.get(row.taskId);
    if (pid) minutesByBuild.set(pid, (minutesByBuild.get(pid) ?? 0) + (row._sum.durationMinutes ?? 0));
  }

  const builds: BuildProgress[] = fixedProjects
    .filter((pr) => pr.status !== "ARCHIVED")
    .map((pr) => {
      const amounts = stageAmounts(pr.fixedPrice ?? 0, pr.stages);
      return {
        id: pr.id,
        name: pr.name,
        status: pr.status,
        progress: projectProgress(pr.tasks, pr.progressOverride),
        startDate: pr.startDate?.toISOString() ?? null,
        dueDate: pr.dueDate?.toISOString() ?? null,
        fixedPrice: pr.fixedPrice,
        paymentTerms: pr.paymentTerms,
        stages: pr.stages.map((s, i) => ({
          id: s.id,
          label: s.label,
          percent: s.percent,
          amount: amounts[i],
          status: s.status,
          reachedAt: s.reachedAt?.toISOString() ?? null,
        })),
        upcomingTasks: pr.tasks.filter((t) => t.status !== "DONE").slice(0, 6).map((t) => ({ id: t.id, title: t.title, status: t.status })),
        internalMinutes: audience === "admin" ? minutesByBuild.get(pr.id) ?? 0 : 0,
      };
    });

  const ownAllowance = new Set(client.projects.filter((pr) => pr.monthlyHours != null).map((pr) => pr.id));

  const buildAllowance = (projectId: string | null): AllowanceUsage => {
    const project = projectId ? client.projects.find((pr) => pr.id === projectId) ?? null : null;
    const resolved = resolveAllowance(client, project);
    const carriedIn = carries.find((c) => (projectId ? c.projectId === projectId : c.clientId === clientId))?.carriedMinutes ?? 0;
    const used = entries
      .filter((e) => e.billable && (projectId ? e.task.projectId === projectId : !ownAllowance.has(e.task.projectId)))
      .reduce((sum, e) => sum + e.durationMinutes, 0);
    const available = resolved.allowanceMinutes != null ? resolved.allowanceMinutes + carriedIn : null;
    const pace = computePace(used, available, p, paceNow);
    return {
      scope: resolved.scope,
      projectId,
      label: project ? project.name : client.name,
      allowanceMinutes: resolved.allowanceMinutes,
      carriedInMinutes: carriedIn,
      availableMinutes: available,
      usedMinutes: used,
      remainingMinutes: available != null ? Math.max(0, available - used) : null,
      overageMinutes: available != null ? Math.max(0, used - available) : 0,
      rolloverPolicy: resolved.rolloverPolicy,
      rolloverCapHours: resolved.rolloverCapHours,
      pace: { ...pace, runOutDate: pace.runOutDate?.toISOString() ?? null },
    };
  };

  const projectMap = new Map<string, ClientUsage["byProject"][number]>();
  for (const e of entries) {
    const pr = e.task.project;
    const row = projectMap.get(pr.id) ?? { projectId: pr.id, name: pr.name, minutes: 0, billableMinutes: 0, tasks: [] };
    row.minutes += e.durationMinutes;
    if (e.billable) row.billableMinutes += e.durationMinutes;
    const task = row.tasks.find((t) => t.taskId === e.taskId);
    if (task) task.minutes += e.durationMinutes;
    else row.tasks.push({ taskId: e.taskId, title: e.task.title, status: e.task.status, minutes: e.durationMinutes });
    projectMap.set(pr.id, row);
  }
  const byProject = [...projectMap.values()]
    .map((row) => ({ ...row, tasks: row.tasks.sort((a, b) => b.minutes - a.minutes) }))
    .sort((a, b) => b.minutes - a.minutes);

  const total = entries.reduce((s, e) => s + e.durationMinutes, 0);
  const billable = entries.filter((e) => e.billable).reduce((s, e) => s + e.durationMinutes, 0);

  return {
    client: {
      id: client.id,
      name: client.name,
      billingEmail: client.billingEmail,
      currency: client.currency,
      hourlyRate: client.hourlyRate,
      monthlyHours: client.monthlyHours,
      retainerAmount: client.retainerAmount,
      periodStartDay: client.periodStartDay,
      roundingMinutes: client.roundingMinutes,
      vatRateBps: client.vatRateBps,
    },
    projects: client.projects.map((pr) => ({ id: pr.id, name: pr.name, hourlyRate: pr.hourlyRate, monthlyHours: pr.monthlyHours })),
    period: { start: p.start.toISOString(), end: p.end.toISOString(), days: periodDays(p, paceNow), isCurrent },
    totals: { minutes: total, billableMinutes: billable, nonBillableMinutes: total - billable },
    allowances: [buildAllowance(null), ...[...ownAllowance].map((id) => buildAllowance(id))],
    byProject,
    completedTasks: completed.map((t) => ({
      id: t.id,
      title: t.title,
      projectName: t.project.name,
      completedAt: t.completedAt!.toISOString(),
    })),
    entries: entries.map((e) => ({
      id: e.id,
      startedAt: e.startedAt.toISOString(),
      durationMinutes: e.durationMinutes,
      note: e.note,
      billable: e.billable,
      taskId: e.taskId,
      taskTitle: e.task.title,
      projectId: e.task.projectId,
      projectName: e.task.project.name,
    })),
    builds,
  };
}

/** `?period=YYYY-MM` selects the period that starts in that month. */
export function periodFromParam(param: unknown, startDay: number, now: Date = new Date()): BillingPeriod {
  if (typeof param === "string") {
    const match = param.match(/^(\d{4})-(\d{2})$/);
    if (match) {
      const ref = new Date(Date.UTC(parseInt(match[1], 10), parseInt(match[2], 10) - 1, Math.min(Math.max(startDay, 1), 28)));
      if (ref.getTime() <= now.getTime()) return getBillingPeriod(startDay, ref);
    }
  }
  return getBillingPeriod(startDay, now);
}

export const periodParam = (start: Date | string) => new Date(start).toISOString().slice(0, 7);

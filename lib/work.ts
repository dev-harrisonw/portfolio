import prisma from "@/lib/prisma";
import { getPickerTree, getRunningEntry } from "@/lib/time";

export async function getWorkDashboard(now = new Date()) {
  const [tasks, overdueProjects, dueStages, running, pickerTree] = await Promise.all([
    prisma.task.findMany({
      where: { project: { status: { not: "ARCHIVED" }, client: { archived: false } } },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      take: 250,
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
        completedAt: true,
        project: {
          select: {
            id: true,
            name: true,
            dueDate: true,
            billingType: true,
            client: { select: { id: true, name: true } },
          },
        },
        _count: { select: { entries: true } },
      },
    }),
    prisma.project.findMany({
      where: {
        status: "ACTIVE",
        dueDate: { lt: now },
        client: { archived: false },
      },
      orderBy: { dueDate: "asc" },
      select: {
        id: true,
        name: true,
        dueDate: true,
        billingType: true,
        client: { select: { id: true, name: true } },
      },
    }),
    prisma.paymentStage.findMany({
      where: { status: "DUE", project: { status: { not: "ARCHIVED" }, client: { archived: false } } },
      orderBy: { reachedAt: "asc" },
      select: {
        id: true,
        label: true,
        percent: true,
        project: { select: { id: true, name: true, client: { select: { id: true, name: true } } } },
      },
    }),
    getRunningEntry(),
    getPickerTree(),
  ]);

  const counts = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
  for (const t of tasks) counts[t.status] += 1;

  return {
    tasks: tasks.map((t) => ({
      ...t,
      updatedAt: t.updatedAt.toISOString(),
      completedAt: t.completedAt?.toISOString() ?? null,
      project: { ...t.project, dueDate: t.project.dueDate?.toISOString() ?? null },
    })),
    overdueProjects: overdueProjects.map((p) => ({
      ...p,
      dueDate: p.dueDate?.toISOString() ?? null,
    })),
    dueStages,
    counts,
    running,
    pickerTree,
  };
}

export type WorkDashboard = Awaited<ReturnType<typeof getWorkDashboard>>;

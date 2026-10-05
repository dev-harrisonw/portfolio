import prisma from "@/lib/prisma";
import { HttpError } from "@/lib/http";

const MINUTE_MS = 60_000;

export const entryInclude = {
  task: { include: { project: { include: { client: { select: { id: true, name: true, currency: true } } } } } },
} as const;

export function minutesBetween(start: Date, end: Date) {
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / MINUTE_MS));
}

export function getRunningEntry() {
  return prisma.timeEntry.findFirst({ where: { endedAt: null }, include: entryInclude });
}

/** Starting a timer stops whichever one is running, so there is only ever one. */
export async function startTimer(taskId: string, note = "") {
  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { id: true } });
  if (!task) throw new HttpError(404, "Task not found");

  const now = new Date();
  return prisma.$transaction(async (tx) => {
    const running = await tx.timeEntry.findMany({ where: { endedAt: null } });
    for (const entry of running) {
      await tx.timeEntry.update({
        where: { id: entry.id },
        data: { endedAt: now, durationMinutes: minutesBetween(entry.startedAt, now) },
      });
    }
    await tx.task.updateMany({ where: { id: taskId, status: "TODO" }, data: { status: "IN_PROGRESS" } });
    return tx.timeEntry.create({ data: { taskId, startedAt: now, note }, include: entryInclude });
  });
}

export async function stopTimer(note?: string) {
  const running = await prisma.timeEntry.findFirst({ where: { endedAt: null } });
  if (!running) throw new HttpError(409, "No timer is running");
  const now = new Date();
  return prisma.timeEntry.update({
    where: { id: running.id },
    data: {
      endedAt: now,
      durationMinutes: minutesBetween(running.startedAt, now),
      ...(note !== undefined ? { note } : {}),
    },
    include: entryInclude,
  });
}

export function listEntries({ from, to, clientId }: { from: Date; to: Date; clientId?: string }) {
  return prisma.timeEntry.findMany({
    where: {
      startedAt: { gte: from, lt: to },
      ...(clientId ? { task: { project: { clientId } } } : {}),
    },
    orderBy: { startedAt: "desc" },
    include: entryInclude,
  });
}

/** Active clients → active projects → open tasks, for the task picker. */
export function getPickerTree() {
  return prisma.client.findMany({
    where: { archived: false },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      projects: {
        where: { status: "ACTIVE" },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          tasks: { where: { status: { not: "DONE" } }, orderBy: { createdAt: "desc" }, select: { id: true, title: true, status: true } },
        },
      },
    },
  });
}


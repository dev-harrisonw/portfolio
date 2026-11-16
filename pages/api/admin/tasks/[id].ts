import prisma from "@/lib/prisma";
import { adminRoute, HttpError, parseBody, queryId } from "@/lib/api";
import { taskUpdateSchema } from "@/lib/validation/time";

export default adminRoute({
  GET: async (req, res) => {
    const id = queryId(req);
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            dueDate: true,
            billingType: true,
            client: { select: { id: true, name: true, currency: true } },
          },
        },
        entries: {
          orderBy: { startedAt: "desc" },
          select: { id: true, startedAt: true, endedAt: true, durationMinutes: true, amount: true, note: true, billable: true },
        },
      },
    });
    if (!task) throw new HttpError(404, "Not found");
    res.status(200).json({ task });
  },
  PUT: async (req, res) => {
    const id = queryId(req);
    const data = parseBody(taskUpdateSchema, req);
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Not found");

    let completedAt = existing.completedAt;
    if (data.status === "DONE" && existing.status !== "DONE") completedAt = new Date();
    if (data.status && data.status !== "DONE") completedAt = null;

    const task = await prisma.task.update({ where: { id }, data: { ...data, completedAt } });
    res.status(200).json({ task });
  },
  DELETE: async (req, res) => {
    const id = queryId(req);
    const logged = await prisma.timeEntry.count({ where: { taskId: id } });
    if (logged > 0) throw new HttpError(409, "This task has logged time. Mark it done instead.");
    await prisma.task.delete({ where: { id } });
    res.status(204).end();
  },
});

import prisma from "@/lib/prisma";
import { adminRoute, HttpError, parseBody, queryId } from "@/lib/api";
import { entryInclude } from "@/lib/time";
import { entryUpdateSchema } from "@/lib/validation/time";

export default adminRoute({
  PUT: async (req, res) => {
    const id = queryId(req);
    const data = parseBody(entryUpdateSchema, req);
    const existing = await prisma.timeEntry.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Not found");

    const startedAt = data.startedAt ?? existing.startedAt;
    const durationMinutes = data.durationMinutes ?? existing.durationMinutes;
    const isRunning = existing.endedAt === null;

    const entry = await prisma.timeEntry.update({
      where: { id },
      data: {
        ...data,
        startedAt,
        ...(isRunning ? {} : { durationMinutes, endedAt: new Date(startedAt.getTime() + durationMinutes * 60_000) }),
      },
      include: entryInclude,
    });
    res.status(200).json({ entry });
  },
  DELETE: async (req, res) => {
    await prisma.timeEntry.delete({ where: { id: queryId(req) } });
    res.status(204).end();
  },
});

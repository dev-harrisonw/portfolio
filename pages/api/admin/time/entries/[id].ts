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
    const isRunning = existing.endedAt === null;
    const amount = data.amount === undefined ? existing.amount : data.amount;
    const priced = amount != null && !isRunning;
    const durationMinutes = priced ? 0 : data.durationMinutes ?? existing.durationMinutes;

    const entry = await prisma.timeEntry.update({
      where: { id },
      data: {
        ...data,
        startedAt,
        amount: isRunning ? existing.amount : amount,
        ...(isRunning
          ? {}
          : {
              durationMinutes,
              endedAt: priced ? startedAt : new Date(startedAt.getTime() + durationMinutes * 60_000),
            }),
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

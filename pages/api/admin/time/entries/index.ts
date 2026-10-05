import prisma from "@/lib/prisma";
import { adminRoute, parseBody } from "@/lib/api";
import { entryInclude, listEntries } from "@/lib/time";
import { entrySchema, rangeSchema } from "@/lib/validation/time";

export default adminRoute({
  GET: async (req, res) => {
    const { from, to, clientId } = rangeSchema.parse(req.query);
    res.status(200).json({ entries: await listEntries({ from, to, clientId }) });
  },
  POST: async (req, res) => {
    const { durationMinutes, startedAt, ...rest } = parseBody(entrySchema, req);
    const entry = await prisma.timeEntry.create({
      data: {
        ...rest,
        startedAt,
        durationMinutes,
        endedAt: new Date(startedAt.getTime() + durationMinutes * 60_000),
      },
      include: entryInclude,
    });
    res.status(201).json({ entry });
  },
});

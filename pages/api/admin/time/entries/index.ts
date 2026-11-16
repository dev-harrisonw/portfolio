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
    const data = parseBody(entrySchema, req);
    const priced = data.amount != null;
    const durationMinutes = priced ? 0 : data.durationMinutes ?? 0;
    const entry = await prisma.timeEntry.create({
      data: {
        taskId: data.taskId,
        startedAt: data.startedAt,
        note: data.note,
        billable: data.billable,
        amount: priced ? data.amount : null,
        durationMinutes,
        endedAt: priced ? data.startedAt : new Date(data.startedAt.getTime() + durationMinutes * 60_000),
      },
      include: entryInclude,
    });
    res.status(201).json({ entry });
  },
});

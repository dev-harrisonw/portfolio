import prisma from "@/lib/prisma";
import { adminRoute, parseBody } from "@/lib/api";
import { syncDraftsForEntry } from "@/lib/invoicing/syncDraft";
import { entryInclude, listEntries } from "@/lib/time";
import { entrySchema, rangeSchema } from "@/lib/validation/time";

export default adminRoute({
  GET: async (req, res) => {
    const { from, to, clientId } = rangeSchema.parse(req.query);
    res.status(200).json({ entries: await listEntries({ from, to, clientId }) });
  },
  POST: async (req, res) => {
    const data = parseBody(entrySchema, req);
    const durationMinutes = data.durationMinutes ?? 0;
    const entry = await prisma.timeEntry.create({
      data: {
        taskId: data.taskId,
        startedAt: data.startedAt,
        note: data.note,
        billable: data.billable,
        amount: null,
        durationMinutes,
        endedAt: new Date(data.startedAt.getTime() + durationMinutes * 60_000),
      },
      include: entryInclude,
    });
    await syncDraftsForEntry(entry.id);
    res.status(201).json({ entry });
  },
});

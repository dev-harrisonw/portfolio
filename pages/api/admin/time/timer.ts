import { adminRoute, parseBody } from "@/lib/api";
import { getRunningEntry, startTimer, stopTimer } from "@/lib/time";
import { timerStartSchema, timerStopSchema } from "@/lib/validation/time";

export default adminRoute({
  GET: async (_req, res) => {
    res.status(200).json({ entry: await getRunningEntry() });
  },
  POST: async (req, res) => {
    const { taskId, note } = parseBody(timerStartSchema, req);
    res.status(201).json({ entry: await startTimer(taskId, note) });
  },
  DELETE: async (req, res) => {
    const { note } = parseBody(timerStopSchema, req);
    res.status(200).json({ entry: await stopTimer(note) });
  },
});

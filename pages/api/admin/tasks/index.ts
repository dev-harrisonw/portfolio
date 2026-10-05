import prisma from "@/lib/prisma";
import { adminRoute, parseBody } from "@/lib/api";
import { taskSchema } from "@/lib/validation/time";

export default adminRoute({
  POST: async (req, res) => {
    const data = parseBody(taskSchema, req);
    const task = await prisma.task.create({
      data: { ...data, completedAt: data.status === "DONE" ? new Date() : null },
    });
    res.status(201).json({ task });
  },
});

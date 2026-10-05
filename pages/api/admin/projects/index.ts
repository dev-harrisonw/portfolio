import prisma from "@/lib/prisma";
import { adminRoute, parseBody } from "@/lib/api";
import { projectSchema } from "@/lib/validation/time";

export default adminRoute({
  POST: async (req, res) => {
    const data = parseBody(projectSchema, req);
    const project = await prisma.project.create({ data });
    res.status(201).json({ project });
  },
});

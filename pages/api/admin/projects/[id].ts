import prisma from "@/lib/prisma";
import { adminRoute, parseBody, queryId } from "@/lib/api";
import { projectUpdateSchema } from "@/lib/validation/time";

export default adminRoute({
  PUT: async (req, res) => {
    const data = parseBody(projectUpdateSchema, req);
    const project = await prisma.project.update({ where: { id: queryId(req) }, data });
    res.status(200).json({ project });
  },
  /** Projects with logged time are archived instead of deleted. */
  DELETE: async (req, res) => {
    const id = queryId(req);
    const logged = await prisma.timeEntry.count({ where: { task: { projectId: id } } });
    if (logged > 0) {
      await prisma.project.update({ where: { id }, data: { status: "ARCHIVED" } });
      return res.status(200).json({ archived: true });
    }
    await prisma.project.delete({ where: { id } });
    res.status(204).end();
  },
});

import prisma from "@/lib/prisma";
import { adminRoute, parseBody } from "@/lib/api";
import { clientSchema } from "@/lib/validation/time";

export default adminRoute({
  GET: async (req, res) => {
    const includeArchived = req.query.archived === "1";
    const clients = await prisma.client.findMany({
      where: includeArchived ? {} : { archived: false },
      orderBy: { name: "asc" },
      include: { _count: { select: { projects: true, users: true } } },
    });
    res.status(200).json({ clients });
  },
  POST: async (req, res) => {
    const data = parseBody(clientSchema, req);
    const client = await prisma.client.create({ data });
    res.status(201).json({ client });
  },
});

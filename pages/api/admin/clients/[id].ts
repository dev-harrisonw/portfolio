import prisma from "@/lib/prisma";
import { adminRoute, HttpError, parseBody, queryId } from "@/lib/api";
import { clientUpdateSchema } from "@/lib/validation/time";

export default adminRoute({
  GET: async (req, res) => {
    const client = await prisma.client.findUnique({
      where: { id: queryId(req) },
      include: {
        users: { orderBy: { createdAt: "asc" } },
        projects: {
          orderBy: [{ status: "asc" }, { name: "asc" }],
          include: { tasks: { orderBy: [{ status: "asc" }, { createdAt: "desc" }] } },
        },
      },
    });
    if (!client) throw new HttpError(404, "Not found");
    res.status(200).json({ client });
  },
  PUT: async (req, res) => {
    const data = parseBody(clientUpdateSchema, req);
    const client = await prisma.client.update({ where: { id: queryId(req) }, data });
    res.status(200).json({ client });
  },
  /** Archive rather than delete: time entries and invoices must survive. */
  DELETE: async (req, res) => {
    await prisma.client.update({ where: { id: queryId(req) }, data: { archived: true } });
    res.status(204).end();
  },
});

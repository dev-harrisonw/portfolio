import prisma from "@/lib/prisma";
import { adminRoute, parseBody, queryId } from "@/lib/api";
import { expenseUpdateSchema } from "@/lib/validation/expenses";

export default adminRoute({
  PATCH: async (req, res) => {
    const id = queryId(req);
    const data = parseBody(expenseUpdateSchema, req);
    const expense = await prisma.expense.update({
      where: { id },
      data,
      include: { client: { select: { id: true, name: true } } },
    });
    res.status(200).json({ expense });
  },
  DELETE: async (req, res) => {
    const id = queryId(req);
    await prisma.expense.delete({ where: { id } });
    res.status(204).end();
  },
});

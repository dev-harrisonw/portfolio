import prisma from "@/lib/prisma";
import { adminRoute, parseBody } from "@/lib/api";
import { expenseSchema } from "@/lib/validation/expenses";

export default adminRoute({
  GET: async (_req, res) => {
    const expenses = await prisma.expense.findMany({
      orderBy: { date: "desc" },
      take: 200,
      include: { client: { select: { id: true, name: true } } },
    });
    res.status(200).json({ expenses });
  },
  POST: async (req, res) => {
    const data = parseBody(expenseSchema, req);
    const expense = await prisma.expense.create({
      data: {
        date: data.date,
        vendor: data.vendor,
        category: data.category,
        description: data.description ?? "",
        amount: data.amount,
        currency: data.currency,
        clientId: data.clientId ?? null,
      },
      include: { client: { select: { id: true, name: true } } },
    });
    const { logActivity } = await import("@/lib/activity");
    await logActivity({
      type: "expense.created",
      message: `Logged ${expense.vendor}`,
      href: "/admin/expenses",
      clientId: expense.clientId,
    });
    res.status(201).json({ expense });
  },
});

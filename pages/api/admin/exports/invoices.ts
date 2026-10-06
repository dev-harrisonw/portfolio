import prisma from "@/lib/prisma";
import { adminRoute } from "@/lib/api";
import { toCsv } from "@/lib/exports/csv";

const HEADER = ["Number", "Client", "Kind", "Status", "Total", "Currency", "Due", "Paid", "Created"];

/** GET — bookkeeping dump of every invoice except voids. */
export default adminRoute({
  GET: async (_req, res) => {
    const invoices = await prisma.invoice.findMany({
      where: { status: { not: "VOID" } },
      orderBy: { createdAt: "desc" },
      include: { client: { select: { name: true } } },
    });
    const rows = invoices.map((inv) => [
      inv.number,
      inv.client.name,
      inv.kind,
      inv.status,
      (inv.total / 100).toFixed(2),
      inv.currency,
      inv.dueAt?.toISOString().slice(0, 10) ?? "",
      inv.paidAt?.toISOString().slice(0, 10) ?? "",
      inv.createdAt.toISOString().slice(0, 10),
    ]);
    const stamp = new Date().toISOString().slice(0, 10);
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="invoices-${stamp}.csv"`);
    res.status(200).send(toCsv([HEADER, ...rows]));
  },
});

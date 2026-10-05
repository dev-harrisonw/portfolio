import prisma from "@/lib/prisma";
import { adminRoute } from "@/lib/api";
import { ENTRY_HEADER, toCsv, usageRows } from "@/lib/exports/csv";
import { usageFor } from "@/lib/exports/handlers";

/** GET ?period=YYYY-MM — every client's period that starts in that month, one CSV for bookkeeping. */
export default adminRoute({
  GET: async (req, res) => {
    const clients = await prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true } });
    const usages = await Promise.all(clients.map((c) => usageFor(c.id, req.query.period)));
    const rows = usages.flatMap((u) => usageRows(u));
    const month = typeof req.query.period === "string" ? req.query.period : new Date().toISOString().slice(0, 7);
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="all-clients-${month}-time.csv"`);
    res.status(200).send(toCsv([ENTRY_HEADER, ...rows]));
  },
});

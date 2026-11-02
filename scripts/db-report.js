/* TEMPORARY, read-only: prints a summary of clients and invoices to the production build log so a
 * data merge can be planned. No emails or secrets are printed. Never fails the build. */
const { PrismaClient } = require("@prisma/client");

async function main() {
  if (process.env.VERCEL_ENV !== "production") return;
  const match = (process.env.DATABASE_URL || "").match(/(?<![\w+])postgres(?:ql)?:\/\/[^\s'"]+/i);
  if (!match) return;
  const prisma = new PrismaClient({ datasourceUrl: match[0].replace(/-pooler(?=\.)/, "") });
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { projects: true, invoices: true, users: true } } },
    });
    for (const c of clients) {
      const entries = await prisma.timeEntry.aggregate({
        where: { task: { project: { clientId: c.id } } },
        _count: true,
        _min: { startedAt: true },
        _max: { startedAt: true },
      });
      console.log(
        "REPORT client",
        JSON.stringify({
          id: c.id,
          name: c.name,
          rate: c.hourlyRate,
          monthlyHours: c.monthlyHours,
          retainer: c.retainerAmount,
          startDay: c.periodStartDay,
          vatBps: c.vatRateBps,
          created: c.createdAt,
          archived: c.archived,
          projects: c._count.projects,
          invoices: c._count.invoices,
          portalUsers: c._count.users,
          entries: entries._count,
          firstEntry: entries._min.startedAt,
          lastEntry: entries._max.startedAt,
        })
      );
    }
    const invoices = await prisma.invoice.findMany({
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { entries: true } } },
    });
    for (const i of invoices) {
      console.log(
        "REPORT invoice",
        JSON.stringify({
          client: i.clientId,
          number: i.number,
          kind: i.kind,
          status: i.status,
          start: i.periodStart,
          end: i.periodEnd,
          total: i.total,
          entries: i._count.entries,
        })
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => console.log("REPORT failed:", error && error.message));

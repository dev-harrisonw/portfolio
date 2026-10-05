import Head from "next/head";
import { useRouter } from "next/router";
import type { GetServerSideProps } from "next";
import prisma from "@/lib/prisma";
import { requirePortalPage } from "@/lib/access";
import { shiftPeriod } from "@/lib/billing";
import { getClientUsage, periodFromParam, periodParam, type ClientUsage } from "@/lib/usage";
import { priceUsage, projectionScale, type InvoiceDraft } from "@/lib/invoicing/calc";
import PortalShell from "@/components/portal/PortalShell";
import PortalDashboard from "@/components/portal/PortalDashboard";
import { AllowanceSummary, CompletedTasks, EntryLog, ProjectBreakdown } from "@/components/portal/HoursBreakdown";

type Props = {
  usage: ClientUsage;
  estimate: InvoiceDraft;
  projected: InvoiceDraft;
  periods: { value: string; label: string }[];
  adminPreview: { clients: { id: string; name: string }[]; currentId: string } | null;
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const access = await requirePortalPage(ctx);
  if ("redirect" in access) return { redirect: access.redirect };

  const client = await prisma.client.findUnique({ where: { id: access.clientId }, select: { periodStartDay: true, createdAt: true } });
  if (!client) return { notFound: true };

  const now = new Date();
  const period = periodFromParam(ctx.query.period, client.periodStartDay, now);
  const usage = await getClientUsage(access.clientId, period, now);
  if (!usage) return { notFound: true };

  const periods = Array.from({ length: 12 }, (_, i) => shiftPeriod(client.periodStartDay, now, -i))
    .filter((p, i) => i === 0 || p.end > client.createdAt)
    .map((p) => ({
      value: periodParam(p.start),
      label: `${p.start.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })} – ${new Date(
        p.end.getTime() - 86400000
      ).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}`,
    }));

  const adminPreview = access.isAdmin
    ? {
        clients: await prisma.client.findMany({ where: { archived: false }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
        currentId: access.clientId,
      }
    : null;

  const estimate = priceUsage(usage);
  const projected = priceUsage(usage, { scale: projectionScale(usage) });

  return { props: { usage, estimate, projected, periods, adminPreview } };
};

export default function PortalPage({ usage, estimate, projected, periods, adminPreview }: Props) {
  const router = useRouter();
  const current = periodParam(usage.period.start);

  return (
    <PortalShell clientName={usage.client.name} adminPreview={adminPreview}>
      <Head>
        <title>{usage.client.name} · Client portal</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">{usage.period.isCurrent ? "This period" : "Past period"}</h1>
          <p className="text-fun-gray-light">
            {periods.find((p) => p.value === current)?.label}
            {usage.period.isCurrent && ` · ${usage.period.days.left} days left`}
          </p>
        </div>
        <select
          aria-label="Billing period"
          className="rounded-lg bg-black/20 border border-fun-gray-darker px-3 py-2 text-sm"
          value={current}
          onChange={(e) =>
            router.push({ pathname: "/portal", query: { ...router.query, period: e.target.value } })
          }
        >
          {periods.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <PortalDashboard usage={usage} estimate={estimate} projected={projected} />

      {usage.allowances.length > 1 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">Allowances</h2>
          <AllowanceSummary usage={usage} />
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-5 mb-10">
        <section className="lg:col-span-3">
          <h2 className="text-xl font-bold mb-4">Where the time went</h2>
          <ProjectBreakdown usage={usage} />
        </section>
        <section className="lg:col-span-2">
          <h2 className="text-xl font-bold mb-4">Work completed</h2>
          <CompletedTasks usage={usage} />
        </section>
      </div>

      <section>
        <h2 className="text-xl font-bold mb-4">Time log</h2>
        <EntryLog usage={usage} />
      </section>
    </PortalShell>
  );
}

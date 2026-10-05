import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";
import type { GetServerSideProps } from "next";
import prisma from "@/lib/prisma";
import { requirePortalPage } from "@/lib/access";
import { formatMoney, shiftPeriod } from "@/lib/billing";
import { getClientUsage, periodFromParam, periodParam, type ClientUsage } from "@/lib/usage";
import { priceUsage, projectionScale, type InvoiceDraft } from "@/lib/invoicing/calc";
import { api } from "@/lib/fetcher";
import PortalShell from "@/components/portal/PortalShell";
import PortalDashboard from "@/components/portal/PortalDashboard";
import BuildProgress from "@/components/portal/BuildProgress";
import { AllowanceSummary, CompletedTasks, EntryLog, ProjectBreakdown } from "@/components/portal/HoursBreakdown";

type Props = {
  usage: ClientUsage;
  estimate: InvoiceDraft;
  projected: InvoiceDraft;
  periods: { value: string; label: string }[];
  adminPreview: { clients: { id: string; name: string }[]; currentId: string } | null;
  invoices: {
    id: string;
    number: string;
    status: string;
    total: number;
    kind: string;
    createdAt: string;
    checkoutUrl: string | null;
  }[];
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const access = await requirePortalPage(ctx);
  if ("redirect" in access) return { redirect: access.redirect };

  const client = await prisma.client.findUnique({ where: { id: access.clientId }, select: { periodStartDay: true, createdAt: true } });
  if (!client) return { notFound: true };

  const now = new Date();
  const period = periodFromParam(ctx.query.period, client.periodStartDay, now);
  const usage = await getClientUsage(access.clientId, period, now, { audience: "client" });
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

  const invoices = (
    await prisma.invoice.findMany({
      where: {
        clientId: access.clientId,
        status: access.isAdmin ? { not: "VOID" } : { in: ["SENT", "PAID"] },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, number: true, status: true, total: true, kind: true, createdAt: true, checkoutUrl: true },
    })
  ).map((inv) => ({ ...inv, createdAt: inv.createdAt.toISOString() }));

  return { props: { usage, estimate, projected, periods, adminPreview, invoices } };
};

export default function PortalPage({ usage, estimate, projected, periods, adminPreview, invoices }: Props) {
  const router = useRouter();
  const current = periodParam(usage.period.start);
  const hasTime = usage.client.monthlyHours != null || usage.projects.length > 0;
  const paidId = typeof router.query.paid === "string" ? router.query.paid : null;
  const paidInvoice = paidId ? invoices.find((inv) => inv.id === paidId) : null;

  return (
    <PortalShell clientName={usage.client.name} adminPreview={adminPreview}>
      <Head>
        <title>{usage.client.name} · Client portal</title>
        <meta name="robots" content="noindex" />
      </Head>

      {paidInvoice && (
        <div className="mb-6 rounded-2xl border border-fun-pink/40 bg-fun-pink-darkest px-4 py-3 text-sm">
          Payment received for <span className="font-bold">{paidInvoice.number}</span>. Thank you.
        </div>
      )}
      {paidId && !paidInvoice && (
        <div className="mb-6 rounded-2xl border border-fun-pink/40 bg-fun-pink-darkest px-4 py-3 text-sm">
          Payment received. If the invoice still shows as sent, refresh in a moment.
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between mb-6 sm:mb-8">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold">{!hasTime ? "Your projects" : usage.period.isCurrent ? "This period" : "Past period"}</h1>
          <p className="text-sm sm:text-base text-fun-gray-light mt-1">
            {periods.find((p) => p.value === current)?.label}
            {hasTime && usage.period.isCurrent && ` · ${usage.period.days.left} days left`}
          </p>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
        {(["csv", "pdf"] as const).map((format) => (
          <a
            key={format}
            href={`/api/portal/timesheet?${new URLSearchParams({
              period: current,
              format,
              ...(adminPreview ? { client: adminPreview.currentId } : {}),
            })}`}
            className="rounded-lg border border-fun-gray-darker px-3 py-2.5 sm:py-2 text-sm text-center min-h-[44px] sm:min-h-0 flex items-center justify-center hover:border-fun-pink"
          >
            {format === "pdf" ? "Timesheet PDF" : "CSV"}
          </a>
        ))}
        <select
          aria-label="Billing period"
          className="col-span-2 sm:col-auto rounded-lg bg-black/20 border border-fun-gray-darker px-3 py-2.5 sm:py-2 text-base sm:text-sm min-h-[44px] sm:min-h-0"
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
      </div>

      {hasTime && <PortalDashboard usage={usage} estimate={estimate} projected={projected} />}

      {usage.builds.length > 0 && (
        <section>
          {hasTime && <h2 className="text-xl font-bold mb-4">Project builds</h2>}
          <BuildProgress builds={usage.builds} currency={usage.client.currency} />
        </section>
      )}

      {hasTime && usage.allowances.length > 1 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">Allowances</h2>
          <AllowanceSummary usage={usage} />
        </section>
      )}

      {hasTime ? (
        <>
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

          <section className="mt-10">
            <h2 className="text-xl font-bold mb-4">Time log</h2>
            <EntryLog usage={usage} />
          </section>
        </>
      ) : (
        <section>
          <h2 className="text-xl font-bold mb-4">Work completed this period</h2>
          <CompletedTasks usage={usage} />
        </section>
      )}

      {invoices.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold mb-4">Invoices</h2>
          <ul className="rounded-2xl border border-fun-gray-darker divide-y divide-fun-gray-darker">
            {invoices.map((inv) => (
              <li key={inv.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                <span>
                  <span className="font-bold">{inv.number}</span>
                  <span className="text-fun-gray-medium"> · {inv.kind === "STAGE" ? "Project payment" : "Period"}</span>
                </span>
                <span className="flex items-center gap-3 shrink-0">
                  <span className="font-monospace">{formatMoney(inv.total, usage.client.currency)}</span>
                  <span className="text-xs uppercase tracking-wider text-fun-gray-medium">{inv.status.toLowerCase()}</span>
                  {inv.status === "SENT" && (
                    <PayButton
                      invoiceId={inv.id}
                      clientId={adminPreview?.currentId}
                    />
                  )}
                  {(inv.status === "SENT" || inv.status === "PAID") && (
                    <a
                      href={`/api/portal/invoices/${inv.id}?${new URLSearchParams({
                        format: "pdf",
                        ...(adminPreview ? { client: adminPreview.currentId } : {}),
                      })}`}
                      className="text-fun-pink hover:underline"
                    >
                      PDF
                    </a>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </PortalShell>
  );
}

function PayButton({ invoiceId, clientId }: { invoiceId: string; clientId?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="inline-flex flex-col items-end">
      <button
        type="button"
        disabled={busy}
        className="rounded-full bg-fun-pink px-3 py-1.5 text-xs font-bold text-white hover:bg-fun-pink-light disabled:opacity-40 min-h-[44px] sm:min-h-0"
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            const qs = clientId ? `?client=${encodeURIComponent(clientId)}` : "";
            const { url } = await api<{ url: string }>(`/api/portal/invoices/${invoiceId}/pay${qs}`);
            window.location.href = url;
          } catch (e) {
            setError((e as Error).message);
            setBusy(false);
          }
        }}
      >
        {busy ? "Opening…" : "Pay"}
      </button>
      {error && <span className="mt-1 text-[11px] text-red-400 max-w-[12rem] text-right">{error}</span>}
    </span>
  );
}

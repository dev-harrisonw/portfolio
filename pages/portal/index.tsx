import Head from "next/head";
import { useRouter } from "next/router";
import type { GetServerSideProps } from "next";
import prisma from "@/lib/prisma";
import { requirePortalPage } from "@/lib/access";
import { formatMoney, shiftPeriod, type BillingPeriod } from "@/lib/billing";
import { getClientUsage, periodFromParam, periodParam, type ClientUsage } from "@/lib/usage";
import { priceUsage, projectionScale, type InvoiceDraft } from "@/lib/invoicing/calc";
import PortalShell from "@/components/portal/PortalShell";
import PortalDashboard from "@/components/portal/PortalDashboard";
import PeriodHeader, { type PeriodOption } from "@/components/portal/PeriodHeader";
import BuildProgress from "@/components/portal/BuildProgress";
import { AllowanceSummary, CompletedTasks, EntryLog, ProjectBreakdown } from "@/components/portal/HoursBreakdown";
import {
  InvoiceStatusPill,
  PayButton,
  invoiceDateNote,
  invoiceForPeriod,
  invoicePdfHref,
  invoicePeriodLabel,
  type PortalInvoice,
} from "@/components/portal/InvoiceBits";

type Props = {
  usage: ClientUsage;
  estimate: InvoiceDraft;
  projected: InvoiceDraft;
  periods: PeriodOption[];
  adminPreview: { clients: { id: string; name: string }[]; currentId: string } | null;
  invoices: PortalInvoice[];
  periodInvoice: PortalInvoice | null;
};

const DAY_MS = 86400000;
const utc = (d: Date, opts: Intl.DateTimeFormatOptions) => d.toLocaleDateString("en-GB", { ...opts, timeZone: "UTC" });

function describePeriod(p: BillingPeriod): PeriodOption {
  const last = new Date(p.end.getTime() - DAY_MS);
  const range = `${utc(p.start, { day: "numeric", month: "short" })} – ${utc(last, { day: "numeric", month: "short", year: "numeric" })}`;
  return {
    value: periodParam(p.start),
    label: p.start.getUTCDate() === 1 ? utc(p.start, { month: "long", year: "numeric" }) : range,
    range,
  };
}

const invoiceSelect = {
  id: true,
  number: true,
  status: true,
  total: true,
  vat: true,
  kind: true,
  createdAt: true,
  dueAt: true,
  paidAt: true,
  periodStart: true,
  periodEnd: true,
} as const;

const iso = (d: Date | null) => (d ? d.toISOString() : null);
function toPortalInvoice(inv: {
  id: string;
  number: string;
  status: string;
  total: number;
  vat: number;
  kind: string;
  createdAt: Date;
  dueAt: Date | null;
  paidAt: Date | null;
  periodStart: Date | null;
  periodEnd: Date | null;
}): PortalInvoice {
  return {
    ...inv,
    createdAt: inv.createdAt.toISOString(),
    dueAt: iso(inv.dueAt),
    paidAt: iso(inv.paidAt),
    periodStart: iso(inv.periodStart),
    periodEnd: iso(inv.periodEnd),
  };
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const access = await requirePortalPage(ctx);
  if ("redirect" in access) return { redirect: access.redirect };

  const client = await prisma.client.findUnique({ where: { id: access.clientId }, select: { periodStartDay: true, createdAt: true } });
  if (!client) return { notFound: true };

  const now = new Date();
  const period = periodFromParam(ctx.query.period, client.periodStartDay, now);
  const usage = await getClientUsage(access.clientId, period, now, { audience: "client" });
  if (!usage) return { notFound: true };

  // How far back the switcher goes. The client record's creation date is a poor limit: work and
  // invoices are often entered after the fact, so also reach back to the earliest time entry and invoice.
  const [firstEntry, firstInvoice] = await Promise.all([
    prisma.timeEntry.aggregate({ where: { task: { project: { clientId: access.clientId } } }, _min: { startedAt: true } }),
    prisma.invoice.aggregate({ where: { clientId: access.clientId, status: { not: "VOID" } }, _min: { periodStart: true } }),
  ]);
  const earliest = new Date(
    Math.min(
      client.createdAt.getTime(),
      firstEntry._min.startedAt?.getTime() ?? Infinity,
      firstInvoice._min.periodStart?.getTime() ?? Infinity
    )
  );

  const periods = Array.from({ length: 24 }, (_, i) => shiftPeriod(client.periodStartDay, now, -i))
    .filter((p, i) => i === 0 || p.end > earliest || periodParam(p.start) === periodParam(period.start))
    .map(describePeriod);

  const adminPreview = access.isAdmin
    ? {
        clients: await prisma.client.findMany({ where: { archived: false }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
        currentId: access.clientId,
      }
    : null;

  const estimate = priceUsage(usage);
  const projected = priceUsage(usage, { scale: projectionScale(usage) });

  const visible = access.isAdmin ? { not: "VOID" as const } : { in: ["SENT" as const, "PAID" as const] };
  const recent = await prisma.invoice.findMany({
    where: { clientId: access.clientId, status: visible },
    orderBy: { createdAt: "desc" },
    select: invoiceSelect,
  });
  // Match on overlap, not "starts inside the month": the first invoice covers 14–30 Sep.
  const forPeriod = invoiceForPeriod(
    recent.filter((inv) => inv.kind === "PERIOD"),
    period
  );

  return {
    props: {
      usage,
      estimate,
      projected,
      periods,
      adminPreview,
      invoices: recent.slice(0, 8).map(toPortalInvoice),
      periodInvoice: forPeriod ? toPortalInvoice(forPeriod) : null,
    },
  };
};

export default function PortalPage({ usage, estimate, projected, periods, adminPreview, invoices, periodInvoice }: Props) {
  const router = useRouter();
  const current = periodParam(usage.period.start);
  const hasTime = usage.client.monthlyHours != null || usage.projects.length > 0;
  const paidId = typeof router.query.paid === "string" ? router.query.paid : null;
  const paidInvoice = paidId ? invoices.find((inv) => inv.id === paidId) : null;
  const previewId = adminPreview?.currentId;
  const outstanding = invoices.filter((inv) => inv.status === "SENT");

  return (
    <PortalShell clientName={usage.client.name} adminPreview={adminPreview}>
      <Head>
        <title>{usage.client.name} · Client portal</title>
        <meta name="robots" content="noindex" />
      </Head>

      {paidInvoice && (
        <div className="mb-3 sm:mb-6 rounded-2xl border border-fun-pink/40 bg-fun-pink-darkest px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm">
          Payment received for <span className="font-bold">{paidInvoice.number}</span>. Thank you.
        </div>
      )}
      {paidId && !paidInvoice && (
        <div className="mb-3 sm:mb-6 rounded-2xl border border-fun-pink/40 bg-fun-pink-darkest px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm">
          Payment received. If the invoice still shows as sent, refresh in a moment.
        </div>
      )}

      {outstanding.length > 0 && !paidId && (
        <div className="mb-3 sm:mb-4 rounded-2xl border border-yellow-500/30 bg-yellow-500/5 px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-semibold text-yellow-200">
            {formatMoney(outstanding.reduce((sum, inv) => sum + inv.total, 0), usage.client.currency)} outstanding
          </span>
          <span className="text-fun-gray-light">
            {outstanding.map((inv) => `${inv.number}${inv.dueAt ? `, ${invoiceDateNote(inv)?.replace(/^\w/, (c) => c.toLowerCase())}` : ""}`).join(" · ")}
          </span>
          <a href="#invoices" className="sm:ml-auto text-fun-pink-light hover:underline">
            View invoices
          </a>
        </div>
      )}

      <PeriodHeader
        periods={periods}
        current={current}
        isCurrent={usage.period.isCurrent}
        days={usage.period.days}
        exportsQuery={hasTime ? { period: current, ...(previewId ? { client: previewId } : {}) } : null}
      />

      {hasTime && (
        <PortalDashboard usage={usage} estimate={estimate} projected={projected} periodInvoice={periodInvoice} clientId={previewId} />
      )}

      {usage.builds.length > 0 && (
        <section>
          {hasTime && <h2 className="text-xl font-bold mb-3 sm:mb-4">Project builds</h2>}
          <BuildProgress builds={usage.builds} currency={usage.client.currency} />
        </section>
      )}

      {hasTime && usage.allowances.length > 1 && (
        <section className="mb-6 sm:mb-10">
          <h2 className="text-xl font-bold mb-3 sm:mb-4">Allowances</h2>
          <AllowanceSummary usage={usage} />
        </section>
      )}

      {hasTime ? (
        <>
          <div className="grid gap-6 sm:gap-8 lg:grid-cols-5">
            <section className="lg:col-span-3">
              <h2 className="text-xl font-bold mb-3 sm:mb-4">Where the time went</h2>
              <ProjectBreakdown usage={usage} />
            </section>
            <section className="lg:col-span-2">
              <h2 className="text-xl font-bold mb-3 sm:mb-4">Work completed</h2>
              <CompletedTasks usage={usage} />
            </section>
          </div>

          {usage.entries.length > 0 && (
            <section className="mt-6 sm:mt-10">
              <h2 className="text-xl font-bold mb-3 sm:mb-4">Time log</h2>
              <EntryLog usage={usage} />
            </section>
          )}
        </>
      ) : (
        <section>
          <h2 className="text-xl font-bold mb-3 sm:mb-4">Work completed this period</h2>
          <CompletedTasks usage={usage} />
        </section>
      )}

      {invoices.length > 0 && (
        <section id="invoices" className="mt-6 sm:mt-10 scroll-mt-20">
          <h2 className="text-xl font-bold mb-3 sm:mb-4">Invoices</h2>
          <ul className="rounded-2xl border border-fun-gray-darker bg-fun-gray-darkest/60 divide-y divide-fun-gray-darker">
            {invoices.map((inv) => (
              <li key={inv.id} className="divide-row flex items-center gap-3 sm:gap-4 px-3.5 sm:px-4 py-3 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-semibold">{inv.number}</span>
                    <InvoiceStatusPill invoice={inv} />
                  </span>
                  <span className="block text-xs text-fun-gray-medium mt-0.5">
                    {invoicePeriodLabel(inv)}
                    {invoiceDateNote(inv) ? ` · ${invoiceDateNote(inv)}` : ""}
                  </span>
                </span>
                <span className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 sm:gap-4 shrink-0">
                <span className="font-monospace sm:w-24 text-right">{formatMoney(inv.total, usage.client.currency)}</span>
                <span className="flex items-center gap-3">
                  {inv.status !== "DRAFT" && (
                    <a href={invoicePdfHref(inv.id, previewId)} className="text-fun-pink-light hover:underline">
                      PDF
                    </a>
                  )}
                  {inv.status === "SENT" && <PayButton invoiceId={inv.id} clientId={previewId} />}
                </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </PortalShell>
  );
}
